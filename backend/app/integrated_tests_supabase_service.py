from __future__ import annotations

import io
import json
import logging
import uuid
import zipfile

from fastapi import HTTPException
from postgrest.exceptions import APIError

from .activity_tracking_service import sync_integrated_attempt
from .auth_service import compute_initials, normalize_student_key, utc_now_iso
from .reporting_service import (
    build_attempt_report_payload,
    build_centralized_csv_export,
    delete_persisted_report_bundle,
    persist_report_bundle,
    save_test_definition_snapshot,
)
from .supabase_service import get_server_supabase
from .supabase_storage_service import download_bytes

LOGGER = logging.getLogger("uvicorn.error")

TEST_COLUMNS = (
    "id,title,slug,description,duration_minutes,difficulty_label,is_active,is_draft,"
    "total_questions,lesson_structure,created_at,updated_at"
)
QUESTION_COLUMNS = (
    "id,test_id,lesson_number,lesson_label,text,options,correct_option_index,"
    "explanation,difficulty,order_in_lesson,order_in_test,created_at"
)
ATTEMPT_COLUMNS = (
    "id,test_id,student_email,student_name,status,started_at,submitted_at,"
    "score_total,scores_per_lesson,raw_answers,teacher_comment,pdf_generated_at,"
    "created_at,updated_at"
)
FINAL_STATUSES = {"submitted", "graded", "finalized"}
LESSON_NUMBERS = [1, 2, 3, 4, 5]
EXPECTED_QUESTIONS_PER_LESSON = 5
DEFAULT_COLORS = ["#0f172a", "#1d4ed8", "#b45309", "#0f766e", "#7c3aed", "#be123c"]
DEFAULT_STANDARD_CATEGORIES = [
    "Definitii",
    "Clasificare",
    "Propozitii categorice",
    "Silogisme si rationamente",
    "Erori de rationament",
]
DEFAULT_STANDARD_REPORT_TEMPLATE = {
    "include_score": True,
    "include_category_breakdown": True,
    "include_correct_answers": True,
    "include_justifications": True,
    "include_student_answers": True,
    "include_recommendations": True,
}


def _error(status_code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail=detail)


def _api_error(error: Exception, fallback: str) -> HTTPException:
    code = getattr(error, "code", "")
    message = getattr(error, "message", str(error))
    details = getattr(error, "details", None)
    hint = getattr(error, "hint", None)
    diagnostic_parts = [message]
    if code:
        diagnostic_parts.append(f"cod={code}")
    if details:
        diagnostic_parts.append(f"detalii={details}")
    if hint:
        diagnostic_parts.append(f"hint={hint}")
    diagnostic = " | ".join(diagnostic_parts)
    if code == "23505":
        return _error(409, f"Slug-ul sau identificatorul exista deja. Supabase: {diagnostic}")
    if code in {"22P02", "23503"}:
        return _error(400, f"{fallback}. Supabase: {diagnostic}")
    return _error(502, f"{fallback}. Supabase: {diagnostic}")


def _execute_write(
    table: str,
    operation: str,
    query,
    record_id: str = "",
    require_affected_rows: bool = True,
):
    context = f"table={table} operation={operation}"
    if record_id:
        context += f" record_id={record_id}"
    LOGGER.info("[Supabase write] START %s key_source=SUPABASE_SERVICE_ROLE_KEY", context)
    try:
        response = query.execute()
    except APIError as error:
        LOGGER.exception(
            "[Supabase write] ERROR %s code=%s message=%s details=%s hint=%s",
            context,
            getattr(error, "code", ""),
            getattr(error, "message", str(error)),
            getattr(error, "details", None),
            getattr(error, "hint", None),
        )
        raise
    except Exception:
        LOGGER.exception("[Supabase write] UNEXPECTED_ERROR %s", context)
        raise

    rows = response.data if isinstance(response.data, list) else []
    if require_affected_rows and not rows:
        message = (
            f"Supabase nu a modificat niciun rand pentru {context}. "
            "Verifica RLS, cheia service_role si identificatorul trimis."
        )
        LOGGER.error("[Supabase write] EMPTY_RESULT %s", context)
        raise RuntimeError(message)
    LOGGER.info("[Supabase write] SUCCESS %s affected_rows=%s", context, len(rows))
    return response


def _slugify(value: str) -> str:
    import re

    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower())
    return re.sub(r"-{2,}", "-", normalized).strip("-") or f"test-{uuid.uuid4().hex[:8]}"


def build_default_test_questions() -> list[dict]:
    questions = []
    order_in_test = 1
    for lesson_number in LESSON_NUMBERS:
        for order_in_lesson in range(1, EXPECTED_QUESTIONS_PER_LESSON + 1):
            lesson_label = DEFAULT_STANDARD_CATEGORIES[lesson_number - 1]
            questions.append(
                {
                    "lesson_number": lesson_number,
                    "lesson_label": lesson_label,
                    "text": "",
                    "options": ["", "", "", ""],
                    "correct_option_index": 0,
                    "category": lesson_label,
                    "answer_type": "single",
                    "justification": "",
                    "source_lesson": f"Lectia {lesson_number}",
                    "tags": [],
                    "explanation": "",
                    "difficulty": "",
                    "order_in_lesson": order_in_lesson,
                    "order_in_test": order_in_test,
                }
            )
            order_in_test += 1
    return questions


def build_standard_test_template() -> dict:
    return {
        "schema_version": "1.0",
        "test_meta": {
            "test_id": "logica_set_01",
            "test_name": "Test Logica - Set 01",
            "subject": "Logica",
            "level": "bac_admitere",
            "language": "ro",
            "total_questions": 25,
            "categories": list(DEFAULT_STANDARD_CATEGORIES),
        },
        "questions": [
            {
                "id": 1,
                "category": DEFAULT_STANDARD_CATEGORIES[0],
                "question": "Textul intrebarii",
                "options": {
                    "A": "Varianta A",
                    "B": "Varianta B",
                    "C": "Varianta C",
                    "D": "Varianta D",
                    "E": "Varianta E",
                },
                "correct_answer": "B",
                "justification": "Argumentarea raspunsului corect.",
                "difficulty": "mediu",
                "source_lesson": "Lectia 1",
                "tags": ["definitie", "reguli"],
            }
        ],
        "report_template": dict(DEFAULT_STANDARD_REPORT_TEMPLATE),
    }


def calculate_score(questions: list[dict], answers: dict[str, int]) -> int:
    if not questions:
        return 0
    correct = sum(
        1
        for question in questions
        if answers.get(str(question["id"])) == question["correct_option_index"]
    )
    return int((correct / len(questions)) * 100)


def compute_radar(questions: list[dict], answers: dict[str, int]) -> list[dict]:
    radar = {
        lesson_number: {"correct": 0, "total": 0}
        for lesson_number in LESSON_NUMBERS
    }
    for question in questions:
        lesson_number = int(question["lesson_number"])
        radar.setdefault(lesson_number, {"correct": 0, "total": 0})
        radar[lesson_number]["total"] += 1
        if answers.get(str(question["id"])) == question["correct_option_index"]:
            radar[lesson_number]["correct"] += 1
    return [
        {
            "lesson": lesson_number,
            "percent": int((values["correct"] / values["total"]) * 100)
            if values["total"]
            else 0,
        }
        for lesson_number, values in radar.items()
    ]


def _normalize_categories(categories) -> list[str]:
    normalized = [str(value).strip() for value in categories or [] if str(value).strip()]
    return normalized if len(normalized) == 5 else list(DEFAULT_STANDARD_CATEGORIES)


def _lesson_structure(questions: list[dict]) -> list[dict]:
    result = []
    lesson_numbers = sorted({int(question["lesson_number"]) for question in questions} | {1, 2, 3, 4, 5})
    for lesson_number in lesson_numbers:
        rows = [question for question in questions if int(question["lesson_number"]) == lesson_number]
        label = rows[0]["lesson_label"] if rows else f"Lectia {lesson_number}"
        result.append(
            {
                "lesson_number": lesson_number,
                "lessonNumber": lesson_number,
                "lesson_label": label,
                "lessonLabel": label,
                "question_count": len(rows),
                "questionCount": len(rows),
                "expected_count": EXPECTED_QUESTIONS_PER_LESSON,
                "expectedCount": EXPECTED_QUESTIONS_PER_LESSON,
                "is_complete": len(rows) == EXPECTED_QUESTIONS_PER_LESSON,
                "isComplete": len(rows) == EXPECTED_QUESTIONS_PER_LESSON,
            }
        )
    return result


def _validate_questions(questions: list[dict]) -> dict:
    issues = []
    structure = _lesson_structure(questions)
    if len(questions) != 25:
        issues.append(f"Testul publicabil trebuie sa aiba exact 25 intrebari, nu {len(questions)}.")
    for lesson in structure:
        if lesson["question_count"] != EXPECTED_QUESTIONS_PER_LESSON:
            issues.append(
                f"{lesson['lesson_label']} trebuie sa aiba exact {EXPECTED_QUESTIONS_PER_LESSON} intrebari."
            )
    seen_orders = set()
    for question in questions:
        order = question["order_in_test"]
        options = question.get("options") or []
        if not str(question.get("text") or "").strip():
            issues.append(f"Intrebarea {order} nu are text completat.")
        if len(options) not in {4, 5} or any(not str(option).strip() for option in options):
            issues.append(f"Intrebarea {order} nu are variante complete.")
        correct_index = question.get("correct_option_index")
        if not isinstance(correct_index, int) or not 0 <= correct_index < len(options):
            issues.append(f"Intrebarea {order} are varianta corecta invalida.")
        if order in seen_orders:
            issues.append(f"Ordinea in test {order} apare de mai multe ori.")
        seen_orders.add(order)
    return {
        "is_publishable": not issues,
        "issues": issues,
        "lesson_structure": structure,
        "total_questions": len(questions),
    }


def _question_from_row(row: dict, include_answer_key: bool) -> dict:
    data = {
        "id": str(row["id"]),
        "test_id": str(row["test_id"]),
        "testId": str(row["test_id"]),
        "lesson_number": int(row.get("lesson_number") or 0),
        "lessonNumber": int(row.get("lesson_number") or 0),
        "lesson_label": row.get("lesson_label") or "",
        "lessonLabel": row.get("lesson_label") or "",
        "text": row.get("text") or "",
        "options": list(row.get("options") or []),
        "category": row.get("lesson_label") or "",
        "answer_type": "single",
        "answerType": "single",
        "source_lesson": row.get("lesson_label") or "",
        "sourceLesson": row.get("lesson_label") or "",
        "tags": [],
        "difficulty": row.get("difficulty") or "",
        "order_in_lesson": int(row.get("order_in_lesson") or 0),
        "orderInLesson": int(row.get("order_in_lesson") or 0),
        "order_in_test": int(row.get("order_in_test") or 0),
        "orderInTest": int(row.get("order_in_test") or 0),
    }
    if include_answer_key:
        correct_index = int(row.get("correct_option_index") or 0)
        data.update(
            {
                "correct_option_index": correct_index,
                "correctOptionIndex": correct_index,
                "explanation": row.get("explanation") or "",
                "justification": row.get("explanation") or "",
            }
        )
    return data


def _public_question(question: dict) -> dict:
    result = dict(question)
    for key in ("correct_option_index", "correctOptionIndex", "explanation", "justification"):
        result.pop(key, None)
    return result


def _load_questions(test_id: str, include_answer_key: bool = False) -> list[dict]:
    try:
        response = (
            get_server_supabase()
            .table("questions")
            .select(QUESTION_COLUMNS)
            .eq("test_id", test_id)
            .order("order_in_test")
            .execute()
        )
    except APIError as error:
        raise _api_error(error, "Intrebarile nu au putut fi citite") from error
    return [_question_from_row(row, include_answer_key) for row in response.data or []]


def _fetch_test(test_id: str) -> dict:
    try:
        response = (
            get_server_supabase().table("tests").select(TEST_COLUMNS).eq("id", test_id).limit(1).execute()
        )
    except APIError as error:
        raise _api_error(error, "Testul nu a putut fi citit") from error
    if not response.data:
        raise _error(404, "Testul integrat nu a fost gasit.")
    return response.data[0]


def _fetch_attempt(attempt_id: str) -> dict:
    try:
        response = (
            get_server_supabase()
            .table("attempts")
            .select(ATTEMPT_COLUMNS)
            .eq("id", attempt_id)
            .limit(1)
            .execute()
        )
    except APIError as error:
        raise _api_error(error, "Incercarea nu a putut fi citita") from error
    if not response.data:
        raise _error(404, "Incercarea nu a fost gasita.")
    return response.data[0]


def _raw_envelope(row: dict) -> tuple[dict[str, int], dict]:
    raw = row.get("raw_answers")
    if not isinstance(raw, dict):
        return {}, {}
    if isinstance(raw.get("answers"), dict):
        answers = raw["answers"]
        meta = raw.get("_meta") if isinstance(raw.get("_meta"), dict) else {}
    else:
        answers = {key: value for key, value in raw.items() if not str(key).startswith("_")}
        meta = raw.get("_meta") if isinstance(raw.get("_meta"), dict) else {}
    normalized_answers = {
        str(key): int(value)
        for key, value in answers.items()
        if isinstance(value, int) and not isinstance(value, bool)
    }
    return normalized_answers, meta


def _attempt_questions(row: dict, include_answer_key: bool) -> list[dict]:
    _, meta = _raw_envelope(row)
    snapshot = meta.get("question_snapshot")
    if isinstance(snapshot, list) and snapshot:
        questions = [entry for entry in snapshot if isinstance(entry, dict)]
        questions.sort(key=lambda entry: int(entry.get("order_in_test") or 0))
        return questions if include_answer_key else [_public_question(question) for question in questions]
    return _load_questions(str(row["test_id"]), include_answer_key=include_answer_key)


def _student_name_parts(name: str) -> tuple[str, str]:
    parts = " ".join(str(name or "").split()).split()
    if len(parts) < 2:
        return (parts[0] if parts else "", "")
    return " ".join(parts[:-1]), parts[-1]


def _attempt_from_row(row: dict, questions: list[dict] | None = None) -> dict:
    answers, meta = _raw_envelope(row)
    questions = questions or _attempt_questions(row, include_answer_key=True)
    total = len(questions)
    correct = sum(
        1 for question in questions if answers.get(str(question["id"])) == question.get("correct_option_index")
    )
    status = "graded" if row.get("status") == "finalized" else row.get("status") or "in_progress"
    first_name = meta.get("student_first_name") or _student_name_parts(row.get("student_name") or "")[0]
    last_name = meta.get("student_last_name") or _student_name_parts(row.get("student_name") or "")[1]
    answered_count = len(answers)
    duration = int(meta.get("duration_seconds") or 0)
    current_index = int(meta.get("current_question_index") or 0)
    score = int(round(float(row.get("score_total") or 0))) if status in FINAL_STATUSES else 0
    wrong = max(total - correct, 0) if status in FINAL_STATUSES else 0
    role = meta.get("role") or "student"
    student_key = meta.get("student_key") or normalize_student_key(first_name, last_name)
    unique_code = meta.get("unique_code") or str(row["id"]).replace("-", "")[:10].upper()
    return {
        "id": str(row["id"]),
        "testId": str(row["test_id"]),
        "test_id": str(row["test_id"]),
        "sessionId": meta.get("session_id") or "",
        "session_id": meta.get("session_id") or "",
        "studentFirstName": first_name,
        "student_first_name": first_name,
        "studentLastName": last_name,
        "student_last_name": last_name,
        "studentName": row.get("student_name") or "",
        "student_name": row.get("student_name") or "",
        "student_display_name": row.get("student_name") or "",
        "studentEmail": row.get("student_email") or "",
        "student_email": row.get("student_email") or "",
        "student_key": student_key,
        "studentKey": student_key,
        "role": role,
        "status": status,
        "status_label": "in_lucru" if status == "in_progress" else "finalizat",
        "statusLabel": "In lucru" if status == "in_progress" else "Corectat",
        "startedAt": row.get("started_at"),
        "started_at": row.get("started_at"),
        "submittedAt": row.get("submitted_at"),
        "submitted_at": row.get("submitted_at"),
        "updatedAt": row.get("updated_at"),
        "updated_at": row.get("updated_at"),
        "elapsedSeconds": duration,
        "duration_seconds": duration,
        "currentQuestionIndex": current_index,
        "current_question_index": current_index,
        "answers": answers,
        "answeredCount": answered_count,
        "answered_count": answered_count,
        "progressPercent": round((answered_count / total) * 100) if total else 0,
        "progress_percent": round((answered_count / total) * 100) if total else 0,
        "correctCount": correct,
        "correct_count": correct,
        "wrongCount": wrong,
        "wrong_count": wrong,
        "scorePercent": score,
        "score_percentage": score,
        "lesson_scores": row.get("scores_per_lesson") or {},
        "teacherComment": row.get("teacher_comment") or "",
        "teacher_comment": row.get("teacher_comment") or "",
        "report_json_path": "",
        "report_html_path": "",
        "report_pdf_path": "",
        "uniqueCode": unique_code,
        "unique_code": unique_code,
    }


def _attempt_role(row: dict) -> str:
    _, meta = _raw_envelope(row)
    return str(meta.get("role") or "student")


def _ensure_attempt_access(current_user: dict, row: dict) -> None:
    if current_user["role"] == "admin":
        return
    current_email = str(current_user.get("email") or "").strip().casefold()
    attempt_email = str(row.get("student_email") or "").strip().casefold()
    if not current_email or current_email != attempt_email:
        raise _error(403, "Nu poti accesa incercarea altui student.")


def _latest_attempt(test_id: str, email: str) -> dict | None:
    if not email:
        return None
    try:
        response = (
            get_server_supabase()
            .table("attempts")
            .select(ATTEMPT_COLUMNS)
            .eq("test_id", test_id)
            .ilike("student_email", email)
            .order("updated_at", desc=True)
            .limit(1)
            .execute()
        )
    except APIError as error:
        raise _api_error(error, "Incercarea recenta nu a putut fi citita") from error
    if not response.data:
        return None
    questions = _attempt_questions(response.data[0], include_answer_key=True)
    return _attempt_from_row(response.data[0], questions)


def _test_from_row(
    row: dict,
    questions: list[dict],
    latest_attempt: dict | None = None,
) -> dict:
    validation = _validate_questions(questions)
    visible = bool(row.get("is_active")) and not bool(row.get("is_draft"))
    structure = row.get("lesson_structure") if isinstance(row.get("lesson_structure"), list) else None
    structure = structure or validation["lesson_structure"]
    return {
        "id": str(row["id"]),
        "title": row.get("title") or "",
        "slug": row.get("slug") or "",
        "description": row.get("description") or "",
        "duration_minutes": int(row.get("duration_minutes") or 0),
        "durationMinutes": int(row.get("duration_minutes") or 0),
        "difficulty_label": row.get("difficulty_label") or "necalibrat",
        "difficultyLabel": row.get("difficulty_label") or "necalibrat",
        "is_active": bool(row.get("is_active")),
        "isActive": bool(row.get("is_active")),
        "is_draft": bool(row.get("is_draft")),
        "isDraft": bool(row.get("is_draft")),
        "is_visible_to_students": visible,
        "isVisibleToStudents": visible,
        "schema_version": "1.0",
        "schemaVersion": "1.0",
        "subject": "Logica",
        "level": "bac_admitere",
        "language": "ro",
        "categories": _normalize_categories(
            [entry.get("lesson_label") or entry.get("lessonLabel") for entry in structure]
        ),
        "report_template": dict(DEFAULT_STANDARD_REPORT_TEMPLATE),
        "reportTemplate": dict(DEFAULT_STANDARD_REPORT_TEMPLATE),
        "created_at": row.get("created_at"),
        "createdAt": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "updatedAt": row.get("updated_at"),
        "total_questions": int(row.get("total_questions") or len(questions)),
        "totalQuestions": int(row.get("total_questions") or len(questions)),
        "lesson_structure": structure,
        "lessonStructure": structure,
        "validation": {
            "is_publishable": validation["is_publishable"],
            "isPublishable": validation["is_publishable"],
            "issues": validation["issues"],
        },
        "status": latest_attempt["status_label"] if latest_attempt else "neinceput",
        "latest_attempt": latest_attempt,
        "latestAttempt": latest_attempt,
    }


def _normalize_question_payload(test_id: str, payload: dict, index: int) -> dict:
    options = [str(option).strip() for option in payload.get("options") or []]
    correct_index = int(payload.get("correct_option_index", 0))
    if not 0 <= correct_index < len(options):
        raise _error(400, f"Intrebarea {index + 1} are varianta corecta invalida.")
    return {
        "id": str(uuid.uuid4()),
        "test_id": test_id,
        "lesson_number": int(payload["lesson_number"]),
        "lesson_label": str(payload.get("lesson_label") or f"Lectia {payload['lesson_number']}").strip(),
        "text": str(payload.get("text") or "").strip(),
        "options": options,
        "correct_option_index": correct_index,
        "explanation": str(payload.get("explanation") or payload.get("justification") or "").strip(),
        "difficulty": str(payload.get("difficulty") or "").strip(),
        "order_in_lesson": int(payload["order_in_lesson"]),
        "order_in_test": int(payload["order_in_test"]),
    }


def _replace_questions(test_id: str, questions: list[dict]) -> None:
    client = get_server_supabase()
    old_rows = client.table("questions").select(QUESTION_COLUMNS).eq("test_id", test_id).execute().data or []
    try:
        _execute_write(
            "questions",
            "delete_for_replace",
            client.table("questions").delete().eq("test_id", test_id),
            test_id,
            require_affected_rows=False,
        )
        if questions:
            _execute_write(
                "questions",
                "insert_replacement",
                client.table("questions").insert(questions),
                test_id,
            )
    except Exception as error:
        try:
            _execute_write(
                "questions",
                "rollback_delete",
                client.table("questions").delete().eq("test_id", test_id),
                test_id,
                require_affected_rows=False,
            )
            if old_rows:
                _execute_write(
                    "questions",
                    "rollback_restore",
                    client.table("questions").insert(old_rows),
                    test_id,
                )
        except Exception as rollback_error:
            LOGGER.exception(
                "[Supabase write] ROLLBACK_ERROR table=questions record_id=%s "
                "code=%s message=%s",
                test_id,
                getattr(rollback_error, "code", ""),
                getattr(rollback_error, "message", str(rollback_error)),
            )
        raise _api_error(error, "Intrebarile nu au putut fi salvate") from error


def list_integrated_tests(current_user: dict) -> list[dict]:
    query = get_server_supabase().table("tests").select(TEST_COLUMNS)
    if current_user["role"] != "admin":
        query = query.eq("is_active", True).eq("is_draft", False)
    try:
        rows = query.order("updated_at", desc=True).execute().data or []
    except Exception as error:
        raise _api_error(error, "Testele nu au putut fi citite") from error

    result = []
    email = str(current_user.get("email") or "").strip().casefold()
    for row in rows:
        questions = _load_questions(str(row["id"]), include_answer_key=True)
        latest = _latest_attempt(str(row["id"]), email) if current_user["role"] == "student" else None
        item = _test_from_row(row, questions, latest)
        if current_user["role"] == "admin":
            attempts = (
                get_server_supabase()
                .table("attempts")
                .select("status,raw_answers")
                .eq("test_id", str(row["id"]))
                .execute()
                .data
                or []
            )
            active = sum(
                1
                for attempt in attempts
                if attempt.get("status") == "in_progress" and _attempt_role(attempt) == "student"
            )
            finalized = sum(
                1
                for attempt in attempts
                if attempt.get("status") in FINAL_STATUSES and _attempt_role(attempt) == "student"
            )
            item.update(
                {
                    "active_attempts": active,
                    "activeAttempts": active,
                    "finalized_attempts": finalized,
                    "finalizedAttempts": finalized,
                }
            )
        result.append(item)
    return result


def get_integrated_test(current_user: dict, test_id: str, include_answer_key: bool = False) -> dict:
    row = _fetch_test(test_id)
    visible = bool(row.get("is_active")) and not bool(row.get("is_draft"))
    if current_user["role"] != "admin" and not visible:
        raise _error(403, "Testul nu este disponibil pentru elevi.")
    include_key = include_answer_key or current_user["role"] == "admin"
    questions = _load_questions(test_id, include_answer_key=include_key)
    latest = (
        _latest_attempt(test_id, str(current_user.get("email") or "").strip().casefold())
        if current_user["role"] == "student"
        else None
    )
    return {**_test_from_row(row, questions, latest), "questions": questions}


def create_integrated_test(current_user: dict, payload: dict) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate crea teste integrate.")
    test_id = str(uuid.uuid4())
    questions = [
        _normalize_question_payload(test_id, question, index)
        for index, question in enumerate(payload.get("questions") or [])
    ]
    validation = _validate_questions(questions)
    is_draft = bool(payload.get("is_draft", True)) or not validation["is_publishable"]
    test_payload = {
        "id": test_id,
        "title": payload["title"].strip(),
        "slug": _slugify(payload.get("slug") or payload["title"]),
        "description": payload["description"].strip(),
        "duration_minutes": int(payload["duration_minutes"]),
        "difficulty_label": str(payload.get("difficulty_label") or "necalibrat").strip(),
        "is_active": bool(payload.get("is_active")) and not is_draft,
        "is_draft": is_draft,
        "total_questions": len(questions),
        "lesson_structure": validation["lesson_structure"],
    }
    client = get_server_supabase()
    try:
        row = _execute_write(
            "tests",
            "insert",
            client.table("tests").insert(test_payload),
            test_id,
        ).data[0]
        if questions:
            _execute_write(
                "questions",
                "insert",
                client.table("questions").insert(questions),
                test_id,
            )
    except Exception as error:
        try:
            _execute_write(
                "tests",
                "rollback_delete",
                client.table("tests").delete().eq("id", test_id),
                test_id,
                require_affected_rows=False,
            )
        except Exception as rollback_error:
            LOGGER.exception(
                "[Supabase write] ROLLBACK_ERROR table=tests record_id=%s code=%s message=%s",
                test_id,
                getattr(rollback_error, "code", ""),
                getattr(rollback_error, "message", str(rollback_error)),
            )
        raise _api_error(error, "Testul nu a putut fi creat") from error
    serialized = {**_test_from_row(row, questions), "questions": questions}
    save_test_definition_snapshot(serialized)
    return serialized


def update_integrated_test(current_user: dict, test_id: str, payload: dict) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate edita teste integrate.")
    _fetch_test(test_id)
    questions = [
        _normalize_question_payload(test_id, question, index)
        for index, question in enumerate(payload.get("questions") or [])
    ]
    validation = _validate_questions(questions)
    is_draft = bool(payload.get("is_draft", True)) or not validation["is_publishable"]
    changes = {
        "title": payload["title"].strip(),
        "slug": _slugify(payload.get("slug") or payload["title"]),
        "description": payload["description"].strip(),
        "duration_minutes": int(payload["duration_minutes"]),
        "difficulty_label": str(payload.get("difficulty_label") or "necalibrat").strip(),
        "is_active": bool(payload.get("is_active")) and not is_draft,
        "is_draft": is_draft,
        "total_questions": len(questions),
        "lesson_structure": validation["lesson_structure"],
        "updated_at": utc_now_iso(),
    }
    try:
        row = (
            _execute_write(
                "tests",
                "update",
                get_server_supabase().table("tests").update(changes).eq("id", test_id),
                test_id,
            )
            .data[0]
        )
        _replace_questions(test_id, questions)
    except Exception as error:
        raise _api_error(error, "Testul nu a putut fi actualizat") from error
    serialized = {**_test_from_row(row, questions), "questions": questions}
    save_test_definition_snapshot(serialized)
    return serialized


def publish_integrated_test(current_user: dict, test_id: str) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate publica teste integrate.")
    row = _fetch_test(test_id)
    questions = _load_questions(test_id, include_answer_key=True)
    validation = _validate_questions(questions)
    if not validation["is_publishable"]:
        raise _error(400, "Testul nu poate fi publicat inca. " + " ".join(validation["issues"]))
    try:
        updated = (
            _execute_write(
                "tests",
                "publish_update",
                get_server_supabase()
                .table("tests")
                .update({"is_active": True, "is_draft": False, "updated_at": utc_now_iso()})
                .eq("id", test_id),
                test_id,
            )
            .data[0]
        )
    except Exception as error:
        raise _api_error(error, "Testul nu a putut fi publicat") from error
    serialized = {**_test_from_row(updated or row, questions), "questions": questions}
    save_test_definition_snapshot(serialized)
    return serialized


def start_attempt(current_user: dict, test_id: str) -> dict:
    test_row = _fetch_test(test_id)
    if current_user["role"] != "admin" and (
        not bool(test_row.get("is_active")) or bool(test_row.get("is_draft"))
    ):
        raise _error(403, "Testul nu este disponibil pentru elevi.")
    email = (
        str(current_user.get("email") or "").strip().casefold()
        if current_user["role"] == "student"
        else f"admin-preview-{current_user['session_id']}@local.invalid"
    )
    try:
        existing = (
            get_server_supabase()
            .table("attempts")
            .select(ATTEMPT_COLUMNS)
            .eq("test_id", test_id)
            .ilike("student_email", email)
            .eq("status", "in_progress")
            .order("updated_at", desc=True)
            .limit(1)
            .execute()
            .data
            or []
        )
    except APIError as error:
        raise _api_error(error, "Incercarea nu a putut fi pornita") from error
    if existing:
        attempt_row = existing[0]
        private_questions = _attempt_questions(attempt_row, include_answer_key=True)
    else:
        private_questions = _load_questions(test_id, include_answer_key=True)
        if current_user["role"] == "student":
            display_name = current_user.get("display_name") or current_user.get("displayName") or "Elev"
        else:
            display_name = "Admin Preview"
        first_name = current_user.get("first_name") or ("Admin" if current_user["role"] == "admin" else "")
        last_name = current_user.get("last_name") or ("Preview" if current_user["role"] == "admin" else "")
        meta = {
            "session_id": current_user["session_id"],
            "role": current_user["role"],
            "student_first_name": first_name,
            "student_last_name": last_name,
            "student_key": normalize_student_key(first_name, last_name),
            "duration_seconds": 0,
            "current_question_index": 0,
            "unique_code": uuid.uuid4().hex[:10].upper(),
            "question_snapshot": private_questions,
            "progress_events": [
                {
                    "event_type": "started",
                    "answered_count": 0,
                    "current_question_index": 0,
                    "elapsed_seconds": 0,
                    "recorded_at": utc_now_iso(),
                }
            ],
        }
        payload = {
            "test_id": test_id,
            "student_email": email,
            "student_name": display_name,
            "status": "in_progress",
            "raw_answers": {"answers": {}, "_meta": meta},
            "teacher_comment": "",
        }
        try:
            attempt_row = _execute_write(
                "attempts",
                "insert_start",
                get_server_supabase().table("attempts").insert(payload),
                test_id,
            ).data[0]
        except Exception as error:
            raise _api_error(error, "Incercarea nu a putut fi pornita") from error
    public_questions = [_public_question(question) for question in private_questions]
    test = _test_from_row(test_row, private_questions)
    test["questions"] = public_questions
    tracking = sync_integrated_attempt(
        current_user,
        attempt_row,
        str(test_row.get("title") or "Test integrat"),
        total_questions=len(private_questions),
    )
    return {
        "attempt": _attempt_from_row(attempt_row, private_questions),
        "test": test,
        "tracking_session_id": tracking.get("test_session_id") if tracking else None,
    }


def update_attempt_progress(current_user: dict, attempt_id: str, payload: dict) -> dict:
    row = _fetch_attempt(attempt_id)
    _ensure_attempt_access(current_user, row)
    if row.get("status") != "in_progress":
        raise _error(400, "Incercarea a fost deja finalizata.")
    questions = _attempt_questions(row, include_answer_key=True)
    valid = {str(question["id"]): question for question in questions}
    answers = {
        str(question_id): int(selected)
        for question_id, selected in (payload.get("answers") or {}).items()
        if str(question_id) in valid
        and isinstance(selected, int)
        and not isinstance(selected, bool)
        and 0 <= selected < len(valid[str(question_id)]["options"])
    }
    _, meta = _raw_envelope(row)
    meta.update(
        {
            "duration_seconds": int(payload["elapsed_seconds"]),
            "current_question_index": int(payload["current_question_index"]),
            "question_snapshot": questions,
        }
    )
    events = list(meta.get("progress_events") or [])
    events.append(
        {
            "event_type": "progress",
            "answered_count": len(answers),
            "current_question_index": int(payload["current_question_index"]),
            "elapsed_seconds": int(payload["elapsed_seconds"]),
            "recorded_at": utc_now_iso(),
        }
    )
    meta["progress_events"] = events[-250:]
    try:
        updated = (
            _execute_write(
                "attempts",
                "update_progress",
                get_server_supabase()
                .table("attempts")
                .update({"raw_answers": {"answers": answers, "_meta": meta}, "updated_at": utc_now_iso()})
                .eq("id", attempt_id),
                attempt_id,
            )
            .data[0]
        )
    except Exception as error:
        raise _api_error(error, "Progresul nu a putut fi salvat") from error
    test_row = _fetch_test(str(updated["test_id"]))
    sync_integrated_attempt(
        current_user,
        updated,
        str(test_row.get("title") or "Test integrat"),
        total_questions=len(questions),
    )
    return _attempt_from_row(updated, questions)


def _lesson_scores(questions: list[dict], answers: dict[str, int]) -> dict:
    radar = compute_radar(questions, answers)
    return {
        str(entry["lesson"]): {
            "lesson_label": next(
                (
                    question["lesson_label"]
                    for question in questions
                    if int(question["lesson_number"]) == int(entry["lesson"])
                ),
                f"Lectia {entry['lesson']}",
            ),
            "correct_count": sum(
                1
                for question in questions
                if int(question["lesson_number"]) == int(entry["lesson"])
                and answers.get(str(question["id"])) == question["correct_option_index"]
            ),
            "total_count": sum(
                1 for question in questions if int(question["lesson_number"]) == int(entry["lesson"])
            ),
            "percentage": int(entry["percent"]),
        }
        for entry in radar
    }


def _build_report(row: dict, persist_files: bool = False) -> tuple[dict, dict | None]:
    test = _fetch_test(str(row["test_id"]))
    questions = _attempt_questions(row, include_answer_key=True)
    attempt = _attempt_from_row(row, questions)
    report = build_attempt_report_payload(
        {"id": str(test["id"]), "title": test.get("title") or "", "slug": test.get("slug") or ""},
        attempt,
        questions,
        attempt["teacherComment"],
        report_id=str(row["id"]),
    )
    bundle = persist_report_bundle(report) if persist_files else None
    if persist_files:
        try:
            _execute_write(
                "attempts",
                "update_pdf_generated_at",
                get_server_supabase()
                .table("attempts")
                .update({"pdf_generated_at": utc_now_iso(), "updated_at": utc_now_iso()})
                .eq("id", str(row["id"])),
                str(row["id"]),
            )
        except Exception as error:
            raise _api_error(error, "Data generarii PDF nu a putut fi salvata") from error
    return report, bundle


def submit_attempt(current_user: dict, attempt_id: str) -> dict:
    row = _fetch_attempt(attempt_id)
    _ensure_attempt_access(current_user, row)
    if row.get("status") != "in_progress":
        raise _error(400, "Incercarea a fost deja finalizata.")
    questions = _attempt_questions(row, include_answer_key=True)
    answers, meta = _raw_envelope(row)
    score = calculate_score(questions, answers)
    scores = _lesson_scores(questions, answers)
    submitted_at = utc_now_iso()
    events = list(meta.get("progress_events") or [])
    events.append(
        {
            "event_type": "submitted",
            "answered_count": len(answers),
            "current_question_index": int(meta.get("current_question_index") or 0),
            "elapsed_seconds": int(meta.get("duration_seconds") or 0),
            "recorded_at": submitted_at,
        }
    )
    meta["progress_events"] = events[-250:]
    try:
        updated = (
            _execute_write(
                "attempts",
                "update_submit",
                get_server_supabase()
                .table("attempts")
                .update(
                    {
                        "status": "graded",
                        "submitted_at": submitted_at,
                        "score_total": score,
                        "scores_per_lesson": scores,
                        "raw_answers": {"answers": answers, "_meta": meta},
                        "updated_at": submitted_at,
                    }
                )
                .eq("id", attempt_id),
                attempt_id,
            )
            .data[0]
        )
    except Exception as error:
        raise _api_error(error, "Incercarea nu a putut fi finalizata") from error
    attempt = _attempt_from_row(updated, questions)
    test_row = _fetch_test(str(updated["test_id"]))
    sync_integrated_attempt(
        current_user,
        updated,
        str(test_row.get("title") or "Test integrat"),
        total_questions=len(questions),
    )
    report, _ = _build_report(updated, persist_files=current_user["role"] == "student")
    return {
        "status": "submitted",
        "score": score,
        "attempt": attempt,
        "report": report,
        "reportId": report["id"],
    }


def submit_test(current_user: dict, attempt_id: str) -> dict:
    return submit_attempt(current_user, attempt_id)


def get_integrated_attempt(current_user: dict, attempt_id: str) -> dict:
    row = _fetch_attempt(attempt_id)
    _ensure_attempt_access(current_user, row)
    include_key = current_user["role"] == "admin"
    questions = _attempt_questions(row, include_answer_key=include_key)
    private_questions = _attempt_questions(row, include_answer_key=True)
    attempt = _attempt_from_row(row, private_questions)
    test_row = _fetch_test(str(row["test_id"]))
    test = _test_from_row(test_row, private_questions, attempt)
    test["questions"] = questions
    return {"attempt": attempt, "test": test}


def get_attempt_report(current_user: dict, attempt_id: str) -> dict:
    row = _fetch_attempt(attempt_id)
    _ensure_attempt_access(current_user, row)
    if row.get("status") not in FINAL_STATUSES:
        questions = _attempt_questions(row, include_answer_key=True)
        attempt = _attempt_from_row(row, questions)
        test = _fetch_test(str(row["test_id"]))
        report = build_attempt_report_payload(
            {"id": str(test["id"]), "title": test["title"], "slug": test["slug"]},
            attempt,
            questions,
            attempt["teacherComment"],
            report_id=str(row["id"]),
        )
    else:
        report, _ = _build_report(row, persist_files=False)
    return {"attempt": _attempt_from_row(row), "report": report}


def update_teacher_comment(current_user: dict, attempt_id: str, teacher_comment: str) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate actualiza comentariul.")
    row = _fetch_attempt(attempt_id)
    try:
        updated = (
            _execute_write(
                "attempts",
                "update_teacher_comment",
                get_server_supabase()
                .table("attempts")
                .update({"teacher_comment": teacher_comment, "updated_at": utc_now_iso()})
                .eq("id", attempt_id),
                attempt_id,
            )
            .data[0]
        )
    except Exception as error:
        raise _api_error(error, "Comentariul nu a putut fi salvat") from error
    report, _ = _build_report(updated, persist_files=updated.get("status") in FINAL_STATUSES)
    return {"attempt": _attempt_from_row(updated), "report": report}


def _list_attempt_rows(status: str | None = None) -> list[dict]:
    query = get_server_supabase().table("attempts").select(ATTEMPT_COLUMNS)
    if status:
        query = query.eq("status", status)
    try:
        return query.order("updated_at", desc=True).execute().data or []
    except Exception as error:
        raise _api_error(error, "Incercarile nu au putut fi citite") from error


def _report_summary(row: dict) -> dict:
    test = _fetch_test(str(row["test_id"]))
    questions = _attempt_questions(row, include_answer_key=True)
    attempt = _attempt_from_row(row, questions)
    first_name, last_name = _student_name_parts(row.get("student_name") or "")
    return {
        "id": str(row["id"]),
        "testType": "integrated",
        "test_type": "integrated",
        "attemptId": str(row["id"]),
        "attempt_id": str(row["id"]),
        "studentName": row.get("student_name") or "",
        "student_name": row.get("student_name") or "",
        "student_display_name": row.get("student_name") or "",
        "studentFirstName": first_name,
        "student_first_name": first_name,
        "studentLastName": last_name,
        "student_last_name": last_name,
        "studentEmail": row.get("student_email") or "",
        "student_email": row.get("student_email") or "",
        "student": {"firstName": first_name, "lastName": last_name, "email": row.get("student_email") or ""},
        "testTitle": test.get("title") or "",
        "test_title": test.get("title") or "",
        "status": attempt["status"],
        "statusLabel": attempt["statusLabel"],
        "status_label": attempt["status_label"],
        "submittedAt": row.get("submitted_at"),
        "submitted_at": row.get("submitted_at"),
        "durationSeconds": attempt["duration_seconds"],
        "duration_seconds": attempt["duration_seconds"],
        "scorePercent": attempt["scorePercent"],
        "score_percentage": attempt["scorePercent"],
        "correctCount": attempt["correctCount"],
        "correct_count": attempt["correctCount"],
        "wrongCount": attempt["wrongCount"],
        "wrong_count": attempt["wrongCount"],
        "teacherComment": row.get("teacher_comment") or "",
        "teacher_comment": row.get("teacher_comment") or "",
        "uniqueCode": attempt["uniqueCode"],
        "unique_code": attempt["uniqueCode"],
        "reportJsonPath": "",
        "report_json_path": "",
        "reportHtmlPath": "",
        "report_html_path": "",
        "reportPdfPath": "",
        "report_pdf_path": "",
        "lessonRadar": list((row.get("scores_per_lesson") or {}).values()),
        "lesson_radar": list((row.get("scores_per_lesson") or {}).values()),
    }


def list_admin_reports(current_user: dict) -> list[dict]:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate vedea rapoartele centralizate.")
    return [
        _report_summary(row)
        for row in _list_attempt_rows()
        if row.get("status") in FINAL_STATUSES and _attempt_role(row) == "student"
    ]


def list_teacher_results(current_user: dict) -> list[dict]:
    return list_admin_reports(current_user)


def list_archive_entries(current_user: dict) -> list[dict]:
    return list_admin_reports(current_user)


def list_admin_live_attempts(current_user: dict) -> list[dict]:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate folosi monitorizarea live.")
    attempts = []
    for index, row in enumerate(_list_attempt_rows("in_progress")):
        if _attempt_role(row) != "student":
            continue
        test = _fetch_test(str(row["test_id"]))
        questions = _attempt_questions(row, include_answer_key=True)
        attempt = _attempt_from_row(row, questions)
        _, meta = _raw_envelope(row)
        events = meta.get("progress_events") if isinstance(meta.get("progress_events"), list) else []
        initials = compute_initials(attempt["studentFirstName"], attempt["studentLastName"])
        marker = meta.get("marker") if isinstance(meta.get("marker"), dict) else {}
        snapshots = [
            {
                "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"{row['id']}:{event_index}")),
                "attemptId": str(row["id"]),
                "attempt_id": str(row["id"]),
                "timestamp": event.get("recorded_at"),
                "answeredCount": int(event.get("answered_count") or 0),
                "answered_count": int(event.get("answered_count") or 0),
                "progressPercent": round((int(event.get("answered_count") or 0) / len(questions)) * 100)
                if questions
                else 0,
                "elapsedSeconds": int(event.get("elapsed_seconds") or 0),
                "questionIndex": int(event.get("current_question_index") or 0),
            }
            for event_index, event in enumerate(events)
            if isinstance(event, dict)
        ]
        attempts.append(
            {
                **attempt,
                "student": attempt["studentName"],
                "test": test.get("title") or "",
                "progress": attempt["progressPercent"],
                "questionIndex": attempt["currentQuestionIndex"],
                "elapsedSeconds": attempt["elapsedSeconds"],
                "testTitle": test.get("title") or "",
                "test_title": test.get("title") or "",
                "durationMinutes": int(test.get("duration_minutes") or 0),
                "duration_minutes": int(test.get("duration_minutes") or 0),
                "lastActivity": row.get("updated_at"),
                "last_activity_label": row.get("updated_at"),
                "marker": {
                    "label": marker.get("label") or initials,
                    "accent_color": marker.get("accent_color") or DEFAULT_COLORS[index % len(DEFAULT_COLORS)],
                    "fallback_initials": initials,
                },
                "snapshots": snapshots,
                "series": [
                    {
                        "elapsed_seconds": snapshot["elapsedSeconds"],
                        "answered_count": snapshot["answeredCount"],
                        "recorded_at": snapshot["timestamp"],
                    }
                    for snapshot in snapshots
                ],
            }
        )
    return attempts


def get_live_monitor_snapshot(current_user: dict) -> dict:
    return {"active_students": list_admin_live_attempts(current_user), "generated_at": utc_now_iso()}


def update_student_marker(
    current_user: dict,
    student_key: str,
    marker_label: str | None,
    accent_color: str | None,
) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate modifica markerii studentilor.")
    matching_rows = [
        row
        for row in _list_attempt_rows()
        if _attempt_from_row(row).get("student_key") == student_key
    ]
    if not matching_rows:
        raise _error(404, "Studentul selectat nu exista in arhiva.")
    marker = {
        "label": (marker_label or "").strip(),
        "accent_color": (accent_color or "").strip(),
    }
    try:
        for row in matching_rows:
            answers, meta = _raw_envelope(row)
            meta["marker"] = marker
            _execute_write(
                "attempts",
                "update_student_marker",
                get_server_supabase().table("attempts").update(
                    {
                        "raw_answers": {"answers": answers, "_meta": meta},
                        "updated_at": utc_now_iso(),
                    }
                )
                .eq("id", str(row["id"])),
                str(row["id"]),
            )
    except Exception as error:
        raise _api_error(error, "Markerul studentului nu a putut fi salvat") from error
    return {
        "studentKey": student_key,
        "student_key": student_key,
        "marker_label": (marker_label or "").strip(),
        "accent_color": (accent_color or "").strip(),
    }


def get_admin_report(current_user: dict, report_id: str) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate accesa raportele.")
    report, _ = _build_report(_fetch_attempt(report_id), persist_files=False)
    return report


def get_report_file(current_user: dict, attempt_id: str, file_kind: str) -> tuple[bytes, str]:
    row = _fetch_attempt(attempt_id)
    _ensure_attempt_access(current_user, row)
    if file_kind in {"json", "html"} and current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate descarca fisierele arhivate.")
    _, bundle = _build_report(row, persist_files=True)
    if not bundle or file_kind not in {"json", "html", "pdf"}:
        raise _error(404, "Fisierul raportului nu este disponibil.")
    object_path = str(bundle[f"{file_kind}_path"])
    file_name = bundle["pdf_file_name"] if file_kind == "pdf" else f"report.{file_kind}"
    return download_bytes(object_path), file_name


def get_admin_pdf(current_user: dict, report_id: str) -> tuple[dict, bytes, str]:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate accesa PDF-ul.")
    report, bundle = _build_report(_fetch_attempt(report_id), persist_files=True)
    return report, download_bytes(bundle["pdf_path"]), bundle["pdf_file_name"]


def get_admin_report_email_delivery(current_user: dict, report_id: str) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate trimite rapoarte pe email.")
    row = _fetch_attempt(report_id)
    email = str(row.get("student_email") or "").strip()
    if not email or email.endswith("@local.invalid"):
        raise _error(404, "Elevul nu are o adresa de email salvata.")
    report, bundle = _build_report(row, persist_files=True)
    return {
        "recipient_email": email,
        "pdf_bytes": download_bytes(bundle["pdf_path"]),
        "pdf_file_name": bundle["pdf_file_name"],
        "report": report,
    }


def get_admin_attempts_summary(current_user: dict) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate vedea sumarul incercarilor.")
    try:
        total_response = get_server_supabase().table("attempts").select("id", count="exact").limit(1).execute()
        finalized_response = (
            get_server_supabase()
            .table("attempts")
            .select("id", count="exact")
            .in_("status", list(FINAL_STATUSES))
            .limit(1)
            .execute()
        )
        in_progress_response = (
            get_server_supabase()
            .table("attempts")
            .select("id", count="exact")
            .eq("status", "in_progress")
            .limit(1)
            .execute()
        )
    except Exception as error:
        raise _api_error(error, "Sumarul incercarilor nu a putut fi citit") from error

    return {
        "total_attempts": int(total_response.count or 0),
        "finalized_attempts": int(finalized_response.count or 0),
        "in_progress_attempts": int(in_progress_response.count or 0),
    }


def build_admin_attempts_pdf_zip(current_user: dict, attempt_ids: list[str]) -> tuple[bytes, str]:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate descarca arhiva rapoartelor.")

    buffer = io.BytesIO()
    archive_name = f"rapoarte_selectate_{uuid.uuid4().hex[:10]}.zip"
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for index, attempt_id in enumerate(attempt_ids, start=1):
            _report, pdf_bytes, file_name = get_admin_pdf(current_user, attempt_id)
            archive.writestr(f"{index:03d}_{file_name}", pdf_bytes)
    return buffer.getvalue(), archive_name


def delete_admin_attempts(current_user: dict, attempt_ids: list[str]) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate sterge incercari.")

    try:
        rows = (
            get_server_supabase()
            .table("attempts")
            .select(ATTEMPT_COLUMNS)
            .in_("id", attempt_ids)
            .execute()
            .data
            or []
        )
    except Exception as error:
        raise _api_error(error, "Incercarile selectate nu au putut fi verificate") from error

    found_ids = [str(row["id"]) for row in rows]
    if not found_ids:
        raise _error(404, "Incercarile selectate nu mai exista.")

    reports_for_cleanup = []
    for row in rows:
        try:
            report, _ = _build_report(row, persist_files=False)
            reports_for_cleanup.append(report)
        except Exception:
            LOGGER.exception(
                "[Attempt delete] Raportul local nu a putut fi pregatit pentru curatare attempt_id=%s",
                row.get("id"),
            )

    try:
        _execute_write(
            "attempts",
            "bulk_delete",
            get_server_supabase().table("attempts").delete().in_("id", found_ids),
            ",".join(found_ids),
        )
    except Exception as error:
        raise _api_error(error, "Incercarile selectate nu au putut fi sterse") from error

    removed_files = []
    cleanup_errors = []
    for report in reports_for_cleanup:
        try:
            removed_files.extend(delete_persisted_report_bundle(report))
        except OSError as error:
            cleanup_errors.append(str(error))
            LOGGER.exception(
                "[Attempt delete] Fisierele locale nu au putut fi sterse attempt_id=%s",
                report.get("attemptId"),
            )

    not_found_ids = [attempt_id for attempt_id in attempt_ids if attempt_id not in found_ids]
    return {
        "deleted_count": len(found_ids),
        "deleted_attempt_ids": found_ids,
        "not_found_attempt_ids": not_found_ids,
        "removed_files_count": len(removed_files),
        "cleanup_errors": cleanup_errors,
    }


def export_centralized_results(current_user: dict) -> tuple[bytes, str]:
    reports = list_admin_reports(current_user)
    return build_centralized_csv_export(
        [
            {
                "report_id": report["id"],
                "attempt_id": report["attemptId"],
                "student_name": report["studentName"],
                "test_title": report["testTitle"],
                "status": report["status"],
                "submitted_at": report["submittedAt"],
                "duration_seconds": report["durationSeconds"],
                "score_percent": report["scorePercent"],
                "pdf_path": report["reportPdfPath"],
            }
            for report in reports
        ]
    )
