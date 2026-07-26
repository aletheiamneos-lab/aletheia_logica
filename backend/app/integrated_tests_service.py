from __future__ import annotations

import json
from pathlib import Path
import re
import sqlite3
import uuid

from fastapi import HTTPException

from .auth_service import compute_initials, normalize_student_key, utc_now_iso
from .database import get_connection
from .pdf_service import generate_attempt_pdf
from .reporting_service import (
    build_attempt_report_payload,
    build_centralized_csv_export,
    persist_report_bundle,
    render_report_html,
    save_test_definition_snapshot,
)

LESSON_NUMBERS = [1, 2, 3, 4, 5]
EXPECTED_QUESTIONS_PER_LESSON = 5
EXPECTED_TOTAL_QUESTIONS = 25
DEFAULT_COLORS = [
    "#0f172a",
    "#1d4ed8",
    "#b45309",
    "#0f766e",
    "#7c3aed",
    "#be123c",
]
DEFAULT_STANDARD_CATEGORIES = [
    "Definitii",
    "Clasificare",
    "Propozitii categorice",
    "Silogisme si rationamente",
    "Erori de rationament",
]


def _regenerate_report_pdf_from_payload(report_row) -> str:
    target_path = report_row["report_pdf_path"]
    if not target_path:
        raise _error(404, "PDF-ul raportului nu este disponibil.")
    report_payload = _load_report_payload(report_row)
    generate_attempt_pdf(report_payload, Path(target_path))
    return target_path


def _regenerate_report_html_from_payload(report_row) -> str:
    target_path = report_row["report_html_path"]
    if not target_path:
        raise _error(404, "Raportul HTML nu este disponibil.")
    report_payload = _load_report_payload(report_row)
    html_path = Path(target_path)
    html_path.parent.mkdir(parents=True, exist_ok=True)
    html_path.write_text(render_report_html(report_payload), encoding="utf-8")
    return target_path
DEFAULT_STANDARD_REPORT_TEMPLATE = {
    "include_score": True,
    "include_category_breakdown": True,
    "include_correct_answers": True,
    "include_justifications": True,
    "include_student_answers": True,
    "include_recommendations": True,
}
OPTION_LABELS = ["A", "B", "C", "D", "E"]


def _error(status_code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail=detail)


def _slugify(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower())
    normalized = re.sub(r"-{2,}", "-", normalized).strip("-")
    return normalized or f"test-{uuid.uuid4().hex[:8]}"


def _decode_json(raw_value: str | None, default):
    if not raw_value:
        return default

    try:
        return json.loads(raw_value)
    except json.JSONDecodeError:
        return default


def _normalize_role(role: str) -> str:
    return "admin" if role == "teacher" else role


def _normalize_status(status: str) -> str:
    if status == "finalized":
        return "graded"
    return status


def _status_code_label(status: str) -> str:
    normalized_status = _normalize_status(status)
    if normalized_status == "in_progress":
        return "in_lucru"
    if normalized_status == "submitted":
        return "trimis"
    if normalized_status == "graded":
        return "finalizat"
    return normalized_status


def _status_display_label(status: str) -> str:
    normalized_status = _normalize_status(status)
    if normalized_status == "in_progress":
        return "In lucru"
    if normalized_status == "submitted":
        return "Trimis"
    if normalized_status == "graded":
        return "Corectat"
    return normalized_status


def _progress_percent(answered_count: int, total_questions: int) -> int:
    if not total_questions:
        return 0
    return round((answered_count / total_questions) * 100)


def _is_visible_to_students(row: sqlite3.Row) -> bool:
    return bool(row["is_active"]) and not bool(row["is_draft"]) and bool(row["is_visible_to_students"])


def _normalize_standard_categories(raw_categories: list[str] | None) -> list[str]:
    normalized = [
        str(category).strip()
        for category in (raw_categories or DEFAULT_STANDARD_CATEGORIES)
        if str(category).strip()
    ]
    if len(normalized) != 5:
        return list(DEFAULT_STANDARD_CATEGORIES)
    return normalized


def _normalize_report_template(raw_template: dict | None) -> dict:
    if not isinstance(raw_template, dict):
        return dict(DEFAULT_STANDARD_REPORT_TEMPLATE)

    normalized = dict(DEFAULT_STANDARD_REPORT_TEMPLATE)
    for key in DEFAULT_STANDARD_REPORT_TEMPLATE:
        if key in raw_template:
            normalized[key] = bool(raw_template[key])
    return normalized


def _serialize_question(row: sqlite3.Row, include_answer_key: bool = False) -> dict:
    data = {
        "id": row["id"],
        "test_id": row["test_id"],
        "testId": row["test_id"],
        "lesson_number": row["lesson_number"],
        "lessonNumber": row["lesson_number"],
        "lesson_label": row["lesson_label"],
        "lessonLabel": row["lesson_label"],
        "text": row["text"],
        "options": _decode_json(row["options_json"], ["", "", "", ""]),
        "category": row["category"] or row["lesson_label"],
        "answer_type": row["answer_type"] or "single",
        "answerType": row["answer_type"] or "single",
        "source_lesson": row["source_lesson"] or row["lesson_label"],
        "sourceLesson": row["source_lesson"] or row["lesson_label"],
        "tags": _decode_json(row["tags_json"], []),
        "difficulty": row["difficulty"] or "",
        "order_in_lesson": row["order_in_lesson"],
        "orderInLesson": row["order_in_lesson"],
        "order_in_test": row["order_in_test"],
        "orderInTest": row["order_in_test"],
    }

    if include_answer_key:
        data["correct_option_index"] = row["correct_option_index"]
        data["correctOptionIndex"] = row["correct_option_index"]
        data["explanation"] = row["explanation"] or ""
        data["justification"] = row["justification"] or row["explanation"] or ""

    return data


def _load_questions(
    connection: sqlite3.Connection,
    test_id: str,
    include_answer_key: bool = False,
) -> list[dict]:
    rows = connection.execute(
        """
        SELECT *
        FROM integrated_test_questions
        WHERE test_id = ?
        ORDER BY order_in_test, id
        """,
        (test_id,),
    ).fetchall()
    return [_serialize_question(row, include_answer_key=include_answer_key) for row in rows]


def _strip_answer_key_from_question(question: dict) -> dict:
    public_question = dict(question)
    public_question.pop("correct_option_index", None)
    public_question.pop("correctOptionIndex", None)
    public_question.pop("explanation", None)
    public_question.pop("justification", None)
    return public_question


def _decode_question_snapshot(raw_snapshot: str | None) -> list[dict]:
    snapshot = _decode_json(raw_snapshot, [])
    if not isinstance(snapshot, list):
        return []

    normalized = [entry for entry in snapshot if isinstance(entry, dict)]
    normalized.sort(
        key=lambda entry: int(entry.get("order_in_test") or entry.get("orderInTest") or 0)
    )
    return normalized


def _persist_attempt_question_snapshot(
    connection: sqlite3.Connection,
    attempt_id: str,
    questions: list[dict],
) -> None:
    connection.execute(
        "UPDATE integrated_attempts SET question_snapshot_json = ? WHERE id = ?",
        (json.dumps(questions, ensure_ascii=False), attempt_id),
    )


def _load_attempt_questions(
    connection: sqlite3.Connection,
    attempt_row: sqlite3.Row,
    include_answer_key: bool = False,
) -> list[dict]:
    snapshot = _decode_question_snapshot(
        attempt_row["question_snapshot_json"] if "question_snapshot_json" in attempt_row.keys() else None
    )

    if not snapshot:
        snapshot = _load_questions(connection, attempt_row["test_id"], include_answer_key=True)
        _persist_attempt_question_snapshot(connection, attempt_row["id"], snapshot)

    if include_answer_key:
        return snapshot

    return [_strip_answer_key_from_question(question) for question in snapshot]


def _lesson_structure(questions: list[dict]) -> list[dict]:
    structure = []
    for lesson_number in LESSON_NUMBERS:
        lesson_questions = [question for question in questions if question["lesson_number"] == lesson_number]
        lesson_label = lesson_questions[0]["lesson_label"] if lesson_questions else f"Lectia {lesson_number}"
        structure.append(
            {
                "lesson_number": lesson_number,
                "lessonNumber": lesson_number,
                "lesson_label": lesson_label,
                "lessonLabel": lesson_label,
                "question_count": len(lesson_questions),
                "questionCount": len(lesson_questions),
                "expected_count": EXPECTED_QUESTIONS_PER_LESSON,
                "expectedCount": EXPECTED_QUESTIONS_PER_LESSON,
                "is_complete": len(lesson_questions) == EXPECTED_QUESTIONS_PER_LESSON,
                "isComplete": len(lesson_questions) == EXPECTED_QUESTIONS_PER_LESSON,
            }
        )
    return structure


def _validate_test_questions(questions: list[dict]) -> dict:
    issues = []
    lesson_structure = _lesson_structure(questions)
    total_questions = len(questions)

    if total_questions != EXPECTED_TOTAL_QUESTIONS:
        issues.append(
            f"Testul publicabil trebuie sa aiba exact {EXPECTED_TOTAL_QUESTIONS} intrebari, nu {total_questions}."
        )

    for lesson_entry in lesson_structure:
        if lesson_entry["question_count"] != EXPECTED_QUESTIONS_PER_LESSON:
            issues.append(
                f"{lesson_entry['lesson_label']} trebuie sa aiba exact {EXPECTED_QUESTIONS_PER_LESSON} intrebari."
            )

    seen_order_in_test = set()
    for question in questions:
        order_in_test = question.get("order_in_test", question.get("orderInTest", "?"))
        question_text = str(question.get("text") or "").strip()
        options = question.get("options")
        normalized_options = options if isinstance(options, list) else []
        correct_option_index = question.get("correct_option_index", question.get("correctOptionIndex"))

        if not question_text:
            issues.append(f"Intrebarea {order_in_test} nu are text completat.")
        if len(normalized_options) not in {4, 5}:
            issues.append(f"Intrebarea {order_in_test} nu are 4 sau 5 variante.")
        if any(not str(option).strip() for option in normalized_options):
            issues.append(f"Intrebarea {order_in_test} are variante necompletate.")
        if isinstance(correct_option_index, int):
            if correct_option_index < 0 or correct_option_index >= len(normalized_options):
                issues.append(f"Intrebarea {order_in_test} are varianta corecta invalida.")
        if not str(question.get("category") or "").strip():
            issues.append(f"Intrebarea {order_in_test} nu are categorie standard.")
        if order_in_test in seen_order_in_test:
            issues.append(f"Ordinea in test {order_in_test} apare de mai multe ori.")
        seen_order_in_test.add(order_in_test)

    return {
        "is_publishable": not issues,
        "issues": issues,
        "lesson_structure": lesson_structure,
        "total_questions": total_questions,
    }


def _serialize_test_row(row: sqlite3.Row, questions: list[dict], latest_attempt: dict | None = None) -> dict:
    validation = _validate_test_questions(questions)
    status = latest_attempt["status_label"] if latest_attempt else "neinceput"
    categories = _normalize_standard_categories(_decode_json(row["categories_json"], DEFAULT_STANDARD_CATEGORIES))
    report_template = _normalize_report_template(
        _decode_json(row["report_template_json"], DEFAULT_STANDARD_REPORT_TEMPLATE)
    )
    return {
        "id": row["id"],
        "title": row["title"],
        "slug": row["slug"],
        "description": row["description"],
        "duration_minutes": row["duration_minutes"],
        "durationMinutes": row["duration_minutes"],
        "difficulty_label": row["difficulty_label"],
        "difficultyLabel": row["difficulty_label"],
        "is_active": bool(row["is_active"]),
        "isActive": bool(row["is_active"]),
        "is_draft": bool(row["is_draft"]),
        "isDraft": bool(row["is_draft"]),
        "is_visible_to_students": bool(row["is_visible_to_students"]),
        "isVisibleToStudents": bool(row["is_visible_to_students"]),
        "schema_version": row["schema_version"] or "1.0",
        "schemaVersion": row["schema_version"] or "1.0",
        "subject": row["subject"] or "Logica",
        "level": row["level"] or "bac_admitere",
        "language": row["language"] or "ro",
        "categories": categories,
        "report_template": report_template,
        "reportTemplate": report_template,
        "created_at": row["created_at"],
        "createdAt": row["created_at"],
        "updated_at": row["updated_at"],
        "updatedAt": row["updated_at"],
        "total_questions": validation["total_questions"],
        "totalQuestions": validation["total_questions"],
        "lesson_structure": validation["lesson_structure"],
        "lessonStructure": validation["lesson_structure"],
        "validation": {
            "is_publishable": validation["is_publishable"],
            "isPublishable": validation["is_publishable"],
            "issues": validation["issues"],
        },
        "status": status,
        "latest_attempt": latest_attempt,
        "latestAttempt": latest_attempt,
    }


def _fetch_test_row(connection: sqlite3.Connection, test_id: str) -> sqlite3.Row:
    row = connection.execute(
        "SELECT * FROM integrated_tests WHERE id = ?",
        (test_id,),
    ).fetchone()
    if row is None:
        raise _error(404, "Testul integrat nu a fost gasit.")
    return row


def _fetch_attempt_row(connection: sqlite3.Connection, attempt_id: str) -> sqlite3.Row:
    row = connection.execute(
        "SELECT * FROM integrated_attempts WHERE id = ?",
        (attempt_id,),
    ).fetchone()
    if row is None:
        raise _error(404, "Incercarea nu a fost gasita.")
    return row


def _fetch_report_row(connection: sqlite3.Connection, report_id: str) -> sqlite3.Row:
    row = connection.execute(
        "SELECT * FROM integrated_reports WHERE id = ?",
        (report_id,),
    ).fetchone()
    if row is None:
        raise _error(404, "Raportul nu a fost gasit.")
    return row


def _fetch_report_row_by_attempt(connection: sqlite3.Connection, attempt_id: str) -> sqlite3.Row | None:
    return connection.execute(
        "SELECT * FROM integrated_reports WHERE attempt_id = ?",
        (attempt_id,),
    ).fetchone()


def _find_student_email(connection: sqlite3.Connection, student_name: str) -> str:
    normalized_name = " ".join((student_name or "").strip().split())
    if not normalized_name:
        return ""

    row = connection.execute(
        """
        SELECT email
        FROM students
        WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
          AND COALESCE(TRIM(email), '') <> ''
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        """,
        (normalized_name,),
    ).fetchone()
    return (row["email"] or "").strip() if row else ""


def _serialize_attempt_row(row: sqlite3.Row, total_questions: int | None = None) -> dict:
    normalized_status = _normalize_status(row["status"])
    total_count = total_questions if total_questions is not None else 0
    correct_count = row["correct_count"]
    answered_count = row["answered_count"]
    score_percent = round((correct_count / total_count) * 100) if total_count else 0
    progress_percent = _progress_percent(answered_count, total_count)
    normalized_role = _normalize_role(row["role"])

    return {
        "id": row["id"],
        "testId": row["test_id"],
        "test_id": row["test_id"],
        "sessionId": row["session_id"],
        "session_id": row["session_id"],
        "studentFirstName": row["student_first_name"] or "",
        "student_first_name": row["student_first_name"] or "",
        "studentLastName": row["student_last_name"] or "",
        "student_last_name": row["student_last_name"] or "",
        "studentName": row["student_display_name"],
        "student_name": row["student_display_name"],
        "student_display_name": row["student_display_name"],
        "student_key": row["student_key"],
        "studentKey": row["student_key"],
        "role": normalized_role,
        "status": normalized_status,
        "status_label": _status_code_label(normalized_status),
        "statusLabel": _status_display_label(normalized_status),
        "startedAt": row["started_at"],
        "started_at": row["started_at"],
        "submittedAt": row["submitted_at"],
        "submitted_at": row["submitted_at"],
        "updatedAt": row["updated_at"],
        "updated_at": row["updated_at"],
        "elapsedSeconds": row["duration_seconds"],
        "duration_seconds": row["duration_seconds"],
        "currentQuestionIndex": row["current_question_index"],
        "current_question_index": row["current_question_index"],
        "answers": _decode_json(row["answers_json"], {}),
        "answeredCount": answered_count,
        "answered_count": answered_count,
        "progressPercent": progress_percent,
        "progress_percent": progress_percent,
        "correctCount": correct_count,
        "correct_count": correct_count,
        "wrongCount": row["wrong_count"],
        "wrong_count": row["wrong_count"],
        "scorePercent": score_percent,
        "score_percentage": score_percent,
        "lesson_scores": _decode_json(row["lesson_scores_json"], {}),
        "teacherComment": row["teacher_comment"] or "",
        "teacher_comment": row["teacher_comment"] or "",
        "report_json_path": row["report_json_path"] or "",
        "report_html_path": row["report_html_path"] or "",
        "report_pdf_path": row["report_pdf_path"] or "",
        "uniqueCode": row["unique_code"],
        "unique_code": row["unique_code"],
    }


def _serialize_progress_snapshot(row: sqlite3.Row, attempt_id: str, total_questions: int) -> dict:
    snapshot_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{attempt_id}:{row['id']}"))
    progress_percent = _progress_percent(row["answered_count"], total_questions)
    return {
        "id": snapshot_id,
        "attemptId": attempt_id,
        "attempt_id": attempt_id,
        "timestamp": row["recorded_at"],
        "answeredCount": row["answered_count"],
        "answered_count": row["answered_count"],
        "progressPercent": progress_percent,
        "progress_percent": progress_percent,
        "elapsedSeconds": row["elapsed_seconds"],
        "elapsed_seconds": row["elapsed_seconds"],
        "questionIndex": row["current_question_index"],
        "current_question_index": row["current_question_index"],
    }


def _load_report_payload(report_row: sqlite3.Row) -> dict:
    report_path = report_row["report_json_path"]
    try:
        with open(report_path, "r", encoding="utf-8") as report_file:
            return json.load(report_file)
    except FileNotFoundError as error:
        raise _error(404, "Sursa JSON a raportului nu mai exista local.") from error


def _merge_report_display_source(report_payload: dict, stored_report: dict | None) -> dict:
    if not isinstance(stored_report, dict):
        return report_payload

    stored_rows = stored_report.get("questionRows") or stored_report.get("questions") or []
    if not isinstance(stored_rows, list):
        return report_payload

    stored_rows_by_id = {
        str(row.get("id")): row
        for row in stored_rows
        if isinstance(row, dict) and row.get("id")
    }
    if not stored_rows_by_id:
        return report_payload

    for row in report_payload["questionRows"]:
        stored_row = stored_rows_by_id.get(str(row["id"]))
        if not stored_row:
            continue

        stored_text = (
            stored_row.get("question_text")
            or stored_row.get("questionText")
            or stored_row.get("text")
        )
        if isinstance(stored_text, str) and stored_text.strip():
            row["text"] = stored_text
            row["questionText"] = stored_text
            row["question_text"] = stored_text

        stored_options = stored_row.get("options")
        if isinstance(stored_options, list) and stored_options:
            row["options"] = [str(option) for option in stored_options]

        stored_option_rows = stored_row.get("option_rows") or stored_row.get("optionRows")
        if isinstance(stored_option_rows, list) and stored_option_rows:
            row["optionRows"] = stored_option_rows
            row["option_rows"] = stored_option_rows

    report_payload["questions"] = report_payload["questionRows"]
    return report_payload


def _upsert_report_row(
    connection: sqlite3.Connection,
    report_payload: dict,
    bundle_paths: dict[str, str],
    test_id: str,
) -> None:
    now_iso = utc_now_iso()
    connection.execute(
        """
        INSERT INTO integrated_reports (
            id, attempt_id, test_id, test_slug, student_name, test_title,
            duration_seconds, score_percent, lesson_radar_json, teacher_comment,
            report_json_path, report_html_path, report_pdf_path, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(attempt_id) DO UPDATE SET
            id = excluded.id,
            test_id = excluded.test_id,
            test_slug = excluded.test_slug,
            student_name = excluded.student_name,
            test_title = excluded.test_title,
            duration_seconds = excluded.duration_seconds,
            score_percent = excluded.score_percent,
            lesson_radar_json = excluded.lesson_radar_json,
            teacher_comment = excluded.teacher_comment,
            report_json_path = excluded.report_json_path,
            report_html_path = excluded.report_html_path,
            report_pdf_path = excluded.report_pdf_path,
            updated_at = excluded.updated_at
        """,
        (
            report_payload["id"],
            report_payload["attemptId"],
            test_id,
            report_payload["testSlug"],
            report_payload["studentName"],
            report_payload["testTitle"],
            report_payload["durationSeconds"],
            report_payload["scorePercent"],
            json.dumps(report_payload["lessonRadar"], ensure_ascii=False),
            report_payload["teacherComment"],
            bundle_paths["json_path"],
            bundle_paths["html_path"],
            bundle_paths["pdf_path"],
            now_iso,
            now_iso,
        ),
    )


def _persist_attempt_report(
    connection: sqlite3.Connection,
    test_row: sqlite3.Row,
    attempt: dict,
    questions: list[dict],
) -> tuple[dict, dict]:
    existing_report_row = _fetch_report_row_by_attempt(connection, attempt["id"])
    stored_report_payload = None
    if existing_report_row is not None:
        try:
            stored_report_payload = _load_report_payload(existing_report_row)
        except HTTPException:
            stored_report_payload = None

    report_payload = build_attempt_report_payload(
        {"id": test_row["id"], "title": test_row["title"], "slug": test_row["slug"]},
        attempt,
        questions,
        attempt["teacherComment"],
        report_id=existing_report_row["id"] if existing_report_row else None,
    )
    report_payload = _merge_report_display_source(report_payload, stored_report_payload)
    bundle_paths = persist_report_bundle(report_payload)
    connection.execute(
        """
        UPDATE integrated_attempts
        SET report_json_path = ?, report_html_path = ?, report_pdf_path = ?
        WHERE id = ?
        """,
        (
            bundle_paths["json_path"],
            bundle_paths["html_path"],
            bundle_paths["pdf_path"],
            attempt["id"],
        ),
    )
    _upsert_report_row(connection, report_payload, bundle_paths, test_row["id"])
    return report_payload, bundle_paths


def _refresh_report_record(
    connection: sqlite3.Connection,
    attempt_row: sqlite3.Row,
) -> tuple[dict, dict, sqlite3.Row]:
    attempt_status = _normalize_status(attempt_row["status"])
    if attempt_status not in {"submitted", "graded"}:
        raise _error(404, "Raportul nu este disponibil pentru aceasta incercare.")
    if _normalize_role(attempt_row["role"]) != "student":
        raise _error(404, "Incercarile de preview admin nu sunt arhivate ca rapoarte.")

    test_row = _fetch_test_row(connection, attempt_row["test_id"])
    questions = _load_attempt_questions(connection, attempt_row, include_answer_key=True)
    attempt = _serialize_attempt_row(attempt_row, total_questions=len(questions))
    report_payload, bundle_paths = _persist_attempt_report(connection, test_row, attempt, questions)
    connection.commit()
    refreshed_report_row = _fetch_report_row_by_attempt(connection, attempt_row["id"])
    if refreshed_report_row is None:
        raise _error(500, "Raportul nu a putut fi reimprospatat local.")
    return report_payload, bundle_paths, refreshed_report_row


def _ensure_report_record(connection: sqlite3.Connection, attempt_id: str) -> sqlite3.Row:
    attempt_row = _fetch_attempt_row(connection, attempt_id)
    _, _, report_row = _refresh_report_record(connection, attempt_row)
    return report_row


def _latest_attempt_for_student(
    connection: sqlite3.Connection,
    test_id: str,
    student_key: str,
) -> dict | None:
    row = connection.execute(
        """
        SELECT *
        FROM integrated_attempts
        WHERE test_id = ? AND student_key = ?
        ORDER BY updated_at DESC
        LIMIT 1
        """,
        (test_id, student_key),
    ).fetchone()
    if row is None:
        return None

    total_questions = connection.execute(
        "SELECT COUNT(*) AS total FROM integrated_test_questions WHERE test_id = ?",
        (test_id,),
    ).fetchone()["total"]
    return _serialize_attempt_row(row, total_questions=total_questions)


def _admin_attempt_counts(connection: sqlite3.Connection, test_id: str) -> dict:
    row = connection.execute(
        """
        SELECT
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS active_attempts,
            SUM(CASE WHEN status IN ('submitted', 'graded', 'finalized') THEN 1 ELSE 0 END) AS finalized_attempts
        FROM integrated_attempts
        WHERE test_id = ? AND role = 'student'
        """,
        (test_id,),
    ).fetchone()
    return {
        "active_attempts": row["active_attempts"] or 0,
        "activeAttempts": row["active_attempts"] or 0,
        "finalized_attempts": row["finalized_attempts"] or 0,
        "finalizedAttempts": row["finalized_attempts"] or 0,
    }


def list_integrated_tests(current_user: dict) -> list[dict]:
    with get_connection() as connection:
        if current_user["role"] == "admin":
            rows = connection.execute(
                "SELECT * FROM integrated_tests ORDER BY updated_at DESC, title COLLATE NOCASE"
            ).fetchall()
        else:
            rows = connection.execute(
                """
                SELECT *
                FROM integrated_tests
                WHERE is_active = 1 AND is_draft = 0 AND is_visible_to_students = 1
                ORDER BY updated_at DESC, title COLLATE NOCASE
                """
            ).fetchall()

        student_key = (
            normalize_student_key(current_user["first_name"], current_user["last_name"])
            if current_user["role"] == "student"
            else ""
        )

        results = []
        for row in rows:
            questions = _load_questions(connection, row["id"], include_answer_key=True)
            latest_attempt = (
                _latest_attempt_for_student(connection, row["id"], student_key)
                if current_user["role"] == "student"
                else None
            )
            serialized = _serialize_test_row(row, questions, latest_attempt=latest_attempt)
            if current_user["role"] == "admin":
                serialized.update(_admin_attempt_counts(connection, row["id"]))
            results.append(serialized)

    return results


def get_integrated_test(current_user: dict, test_id: str, include_answer_key: bool = False) -> dict:
    with get_connection() as connection:
        row = _fetch_test_row(connection, test_id)

        if current_user["role"] != "admin" and not _is_visible_to_students(row):
            raise _error(403, "Testul nu este disponibil pentru elevi.")

        questions = _load_questions(
            connection,
            test_id,
            include_answer_key=include_answer_key or current_user["role"] == "admin",
        )
        latest_attempt = None
        if current_user["role"] == "student":
            student_key = normalize_student_key(current_user["first_name"], current_user["last_name"])
            latest_attempt = _latest_attempt_for_student(connection, test_id, student_key)

    return {
        **_serialize_test_row(row, questions, latest_attempt=latest_attempt),
        "questions": questions,
    }


def _normalize_question_payload(test_id: str, question_payload: dict, question_index: int) -> dict:
    question_id = question_payload.get("id") or f"{test_id}-q{question_index + 1}"
    options = [str(option).strip() for option in question_payload["options"]]
    correct_option_index = int(question_payload["correct_option_index"])
    if correct_option_index < 0 or correct_option_index >= len(options):
        raise _error(400, f"Intrebarea {question_id} are varianta corecta invalida.")
    return {
        "id": question_id,
        "test_id": test_id,
        "lesson_number": question_payload["lesson_number"],
        "lesson_label": question_payload["lesson_label"].strip() or f"Lectia {question_payload['lesson_number']}",
        "text": question_payload.get("text", "").strip(),
        "options": options,
        "correct_option_index": correct_option_index,
        "category": (question_payload.get("category") or question_payload["lesson_label"]).strip(),
        "answer_type": (question_payload.get("answer_type") or "single").strip() or "single",
        "justification": (question_payload.get("justification") or "").strip(),
        "source_lesson": (question_payload.get("source_lesson") or question_payload["lesson_label"]).strip(),
        "tags": [str(tag).strip() for tag in question_payload.get("tags", []) if str(tag).strip()],
        "explanation": (question_payload.get("explanation") or "").strip(),
        "difficulty": (question_payload.get("difficulty") or "").strip(),
        "order_in_lesson": question_payload["order_in_lesson"],
        "order_in_test": question_payload["order_in_test"],
    }


def _replace_questions(connection: sqlite3.Connection, test_id: str, questions: list[dict]) -> None:
    connection.execute("DELETE FROM integrated_test_questions WHERE test_id = ?", (test_id,))
    connection.executemany(
        """
        INSERT INTO integrated_test_questions (
            id, test_id, lesson_number, lesson_label, text,
            options_json, correct_option_index, category, answer_type,
            justification, source_lesson, tags_json, explanation, difficulty,
            order_in_lesson, order_in_test
        )
        VALUES (
            :id, :test_id, :lesson_number, :lesson_label, :text,
            :options_json, :correct_option_index, :category, :answer_type,
            :justification, :source_lesson, :tags_json, :explanation, :difficulty,
            :order_in_lesson, :order_in_test
        )
        """,
        [
            {
                **question,
                "options_json": json.dumps(question["options"], ensure_ascii=False),
                "tags_json": json.dumps(question.get("tags", []), ensure_ascii=False),
            }
            for question in questions
        ],
    )


def _persist_test(connection: sqlite3.Connection, test_id: str) -> dict:
    row = _fetch_test_row(connection, test_id)
    questions = _load_questions(connection, test_id, include_answer_key=True)
    serialized = _serialize_test_row(row, questions)
    serialized["questions"] = questions
    save_test_definition_snapshot(serialized)
    return serialized


def create_integrated_test(current_user: dict, payload: dict) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate crea teste integrate.")

    test_id = str(uuid.uuid4())
    slug = _slugify(payload.get("slug") or payload["title"])
    now_iso = utc_now_iso()
    questions = [
        _normalize_question_payload(test_id, question_payload, index)
        for index, question_payload in enumerate(payload.get("questions", []))
    ]
    validation = _validate_test_questions(questions)
    is_draft = payload.get("is_draft", True) or not validation["is_publishable"]
    is_active = bool(payload.get("is_active", False)) and not is_draft
    is_visible_to_students = bool(payload.get("is_visible_to_students", False))

    with get_connection() as connection:
        try:
            connection.execute(
                """
                INSERT INTO integrated_tests (
                    id, title, slug, description, duration_minutes, difficulty_label,
                    is_active, is_draft, is_visible_to_students, schema_version,
                    subject, level, language, categories_json, report_template_json,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    test_id,
                    payload["title"].strip(),
                    slug,
                    payload["description"].strip(),
                    payload["duration_minutes"],
                    payload.get("difficulty_label", "necalibrat").strip(),
                    int(is_active),
                    int(is_draft),
                    int(is_visible_to_students),
                    payload.get("schema_version", "1.0").strip() or "1.0",
                    payload.get("subject", "Logica").strip() or "Logica",
                    payload.get("level", "bac_admitere").strip() or "bac_admitere",
                    payload.get("language", "ro").strip() or "ro",
                    json.dumps(
                        _normalize_standard_categories(payload.get("categories")),
                        ensure_ascii=False,
                    ),
                    json.dumps(
                        _normalize_report_template(payload.get("report_template")),
                        ensure_ascii=False,
                    ),
                    now_iso,
                    now_iso,
                ),
            )
        except sqlite3.IntegrityError as error:
            raise _error(400, f"Slug-ul testului exista deja: {slug}") from error
        _replace_questions(connection, test_id, questions)
        connection.commit()
        return _persist_test(connection, test_id)


def update_integrated_test(current_user: dict, test_id: str, payload: dict) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate edita teste integrate.")

    normalized_questions = [
        _normalize_question_payload(test_id, question_payload, index)
        for index, question_payload in enumerate(payload.get("questions", []))
    ]
    validation = _validate_test_questions(normalized_questions)
    is_draft = payload.get("is_draft", True) or not validation["is_publishable"]
    is_active = bool(payload.get("is_active", False)) and not is_draft
    is_visible_to_students = bool(payload.get("is_visible_to_students", False))

    with get_connection() as connection:
        _fetch_test_row(connection, test_id)
        try:
            connection.execute(
                """
                UPDATE integrated_tests
                SET title = ?, slug = ?, description = ?, duration_minutes = ?,
                    difficulty_label = ?, is_active = ?, is_draft = ?,
                    is_visible_to_students = ?, schema_version = ?, subject = ?,
                    level = ?, language = ?, categories_json = ?, report_template_json = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    payload["title"].strip(),
                    _slugify(payload.get("slug") or payload["title"]),
                    payload["description"].strip(),
                    payload["duration_minutes"],
                    payload.get("difficulty_label", "necalibrat").strip(),
                    int(is_active),
                    int(is_draft),
                    int(is_visible_to_students),
                    payload.get("schema_version", "1.0").strip() or "1.0",
                    payload.get("subject", "Logica").strip() or "Logica",
                    payload.get("level", "bac_admitere").strip() or "bac_admitere",
                    payload.get("language", "ro").strip() or "ro",
                    json.dumps(
                        _normalize_standard_categories(payload.get("categories")),
                        ensure_ascii=False,
                    ),
                    json.dumps(
                        _normalize_report_template(payload.get("report_template")),
                        ensure_ascii=False,
                    ),
                    utc_now_iso(),
                    test_id,
                ),
            )
        except sqlite3.IntegrityError as error:
            raise _error(400, "Slug-ul selectat este deja folosit de alt test.") from error
        _replace_questions(connection, test_id, normalized_questions)
        connection.commit()
        return _persist_test(connection, test_id)


def publish_integrated_test(current_user: dict, test_id: str) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate publica teste integrate.")

    with get_connection() as connection:
        _fetch_test_row(connection, test_id)
        questions = _load_questions(connection, test_id, include_answer_key=True)
        validation = _validate_test_questions(questions)

        if not validation["is_publishable"]:
            raise _error(
                400,
                "Testul nu poate fi publicat inca. Corecteaza structura: "
                + " ".join(validation["issues"]),
            )

        connection.execute(
            """
            UPDATE integrated_tests
            SET is_active = 1, is_draft = 0, updated_at = ?
            WHERE id = ?
            """,
            (utc_now_iso(), test_id),
        )
        connection.commit()
        return _persist_test(connection, test_id)


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
            "total_questions": EXPECTED_TOTAL_QUESTIONS,
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


def _ensure_attempt_access(current_user: dict, attempt_row: sqlite3.Row) -> None:
    if current_user["role"] == "admin":
        return
    if attempt_row["session_id"] != current_user["session_id"]:
        raise _error(403, "Nu poti accesa incercarea altui student.")


def start_attempt(current_user: dict, test_id: str) -> dict:
    with get_connection() as connection:
        test_row = _fetch_test_row(connection, test_id)

        if current_user["role"] != "admin" and not _is_visible_to_students(test_row):
            raise _error(403, "Testul nu este disponibil pentru elevi.")

        existing_attempt_row = connection.execute(
            """
            SELECT *
            FROM integrated_attempts
            WHERE test_id = ? AND session_id = ? AND status = 'in_progress'
            ORDER BY updated_at DESC
            LIMIT 1
            """,
            (test_id, current_user["session_id"]),
        ).fetchone()

        if existing_attempt_row is not None:
            questions_for_test = _load_attempt_questions(connection, existing_attempt_row, include_answer_key=True)
            public_questions = _load_attempt_questions(connection, existing_attempt_row, include_answer_key=False)
            serialized_test = _serialize_test_row(test_row, questions_for_test)
            serialized_test["questions"] = public_questions
            attempt = _serialize_attempt_row(existing_attempt_row, total_questions=len(public_questions))
            return {"attempt": attempt, "test": serialized_test}

        questions_for_test = _load_questions(connection, test_id, include_answer_key=True)
        public_questions = [_strip_answer_key_from_question(question) for question in questions_for_test]
        serialized_test = _serialize_test_row(test_row, questions_for_test)
        serialized_test["questions"] = public_questions

        attempt_id = str(uuid.uuid4())
        started_at = utc_now_iso()
        if current_user["role"] == "student":
            student_first_name = current_user["first_name"]
            student_last_name = current_user["last_name"]
            student_display_name = current_user["display_name"]
            student_key = normalize_student_key(student_first_name, student_last_name)
        else:
            student_first_name = "Admin"
            student_last_name = "Preview"
            student_display_name = "Admin Preview"
            student_key = f"admin::{current_user['session_id']}"

        connection.execute(
            """
            INSERT INTO integrated_attempts (
                id, test_id, session_id, student_first_name, student_last_name,
                student_display_name, student_key, role, status,
                started_at, updated_at, unique_code, question_snapshot_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, ?, ?, ?)
            """,
            (
                attempt_id,
                test_id,
                current_user["session_id"],
                student_first_name,
                student_last_name,
                student_display_name,
                student_key,
                current_user["role"],
                started_at,
                started_at,
                uuid.uuid4().hex[:10].upper(),
                json.dumps(questions_for_test, ensure_ascii=False),
            ),
        )
        connection.execute(
            """
            INSERT INTO integrated_attempt_events (
                attempt_id, event_type, answered_count, current_question_index, elapsed_seconds, recorded_at
            )
            VALUES (?, 'started', 0, 0, 0, ?)
            """,
            (attempt_id, started_at),
        )
        connection.commit()

        attempt_row = _fetch_attempt_row(connection, attempt_id)
        attempt = _serialize_attempt_row(attempt_row, total_questions=len(public_questions))
        return {"attempt": attempt, "test": serialized_test}


def update_attempt_progress(current_user: dict, attempt_id: str, payload: dict) -> dict:
    with get_connection() as connection:
        attempt_row = _fetch_attempt_row(connection, attempt_id)
        _ensure_attempt_access(current_user, attempt_row)
        if _normalize_status(attempt_row["status"]) != "in_progress":
            raise _error(400, "Incercarea a fost deja finalizata.")

        question_rows = _load_attempt_questions(connection, attempt_row, include_answer_key=True)
        valid_questions_by_id = {question["id"]: question for question in question_rows}

        normalized_answers = {}
        for question_id, selected_index in payload.get("answers", {}).items():
            question = valid_questions_by_id.get(question_id)
            if question is None:
                continue
            if isinstance(selected_index, int) and 0 <= selected_index < len(question["options"]):
                normalized_answers[question_id] = selected_index

        answered_count = len(normalized_answers)
        updated_at = utc_now_iso()

        connection.execute(
            """
            UPDATE integrated_attempts
            SET answers_json = ?, answered_count = ?, current_question_index = ?,
                duration_seconds = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                json.dumps(normalized_answers, ensure_ascii=False),
                answered_count,
                payload["current_question_index"],
                payload["elapsed_seconds"],
                updated_at,
                attempt_id,
            ),
        )
        connection.execute(
            """
            INSERT INTO integrated_attempt_events (
                attempt_id, event_type, answered_count, current_question_index, elapsed_seconds, recorded_at
            )
            VALUES (?, 'progress', ?, ?, ?, ?)
            """,
            (
                attempt_id,
                answered_count,
                payload["current_question_index"],
                payload["elapsed_seconds"],
                updated_at,
            ),
        )
        connection.commit()

        refreshed = _fetch_attempt_row(connection, attempt_id)
        return _serialize_attempt_row(refreshed, total_questions=len(question_rows))


def calculate_score(questions: list[dict], answers: dict[str, int]) -> int:
    if not questions:
        return 0
    correct = sum(
        1
        for question in questions
        if answers.get(question["id"]) == question["correct_option_index"]
    )
    return int((correct / len(questions)) * 100)


def compute_radar(questions: list[dict], answers: dict[str, int]) -> list[dict]:
    radar = {lesson_number: {"correct": 0, "total": EXPECTED_QUESTIONS_PER_LESSON} for lesson_number in LESSON_NUMBERS}
    for question in questions:
        lesson_bucket = radar[question["lesson_number"]]
        if answers.get(question["id"]) == question["correct_option_index"]:
            lesson_bucket["correct"] += 1
    return [
        {
            "lesson": lesson_number,
            "percent": int((values["correct"] / values["total"]) * 100) if values["total"] else 0,
        }
        for lesson_number, values in radar.items()
    ]


def submit_attempt(current_user: dict, attempt_id: str) -> dict:
    with get_connection() as connection:
        attempt_row = _fetch_attempt_row(connection, attempt_id)
        _ensure_attempt_access(current_user, attempt_row)
        if _normalize_status(attempt_row["status"]) != "in_progress":
            raise _error(400, "Incercarea a fost deja finalizata.")

        test_row = _fetch_test_row(connection, attempt_row["test_id"])
        questions = _load_attempt_questions(connection, attempt_row, include_answer_key=True)
        attempt = _serialize_attempt_row(attempt_row, total_questions=len(questions))
        answers = attempt["answers"]

        correct_count = sum(
            1
            for question in questions
            if answers.get(question["id"]) == question["correct_option_index"]
        )
        wrong_count = len(questions) - correct_count
        lesson_radar = compute_radar(questions, answers)
        lesson_scores = {
            str(entry["lesson"]): {
                "lesson_label": next(
                    (
                        question["lesson_label"]
                        for question in questions
                        if question["lesson_number"] == entry["lesson"]
                    ),
                    f"Lectia {entry['lesson']}",
                ),
                "correct_count": int((entry["percent"] / 100) * EXPECTED_QUESTIONS_PER_LESSON),
                "total_count": EXPECTED_QUESTIONS_PER_LESSON,
                "percentage": entry["percent"],
            }
            for entry in lesson_radar
        }
        submitted_at = utc_now_iso()

        connection.execute(
            """
            UPDATE integrated_attempts
            SET status = 'graded', submitted_at = ?, updated_at = ?,
                correct_count = ?, wrong_count = ?, lesson_scores_json = ?
            WHERE id = ?
            """,
            (
                submitted_at,
                submitted_at,
                correct_count,
                wrong_count,
                json.dumps(lesson_scores, ensure_ascii=False),
                attempt_id,
            ),
        )
        connection.execute(
            """
            INSERT INTO integrated_attempt_events (
                attempt_id, event_type, answered_count, current_question_index, elapsed_seconds, recorded_at
            )
            VALUES (?, 'submitted', ?, ?, ?, ?)
            """,
            (
                attempt_id,
                attempt["answeredCount"],
                attempt["currentQuestionIndex"],
                attempt["elapsedSeconds"],
                submitted_at,
            ),
        )
        connection.commit()

        refreshed_attempt_row = _fetch_attempt_row(connection, attempt_id)
        refreshed_attempt = _serialize_attempt_row(refreshed_attempt_row, total_questions=len(questions))
        report_payload = build_attempt_report_payload(
            {"id": test_row["id"], "title": test_row["title"], "slug": test_row["slug"]},
            refreshed_attempt,
            questions,
            refreshed_attempt["teacherComment"],
        )

        if refreshed_attempt["role"] == "student":
            report_payload, _ = _persist_attempt_report(connection, test_row, refreshed_attempt, questions)
            connection.commit()

        return {
            "status": "submitted",
            "score": calculate_score(questions, answers),
            "attempt": refreshed_attempt,
            "report": report_payload,
            "reportId": report_payload["id"],
        }


def submit_test(current_user: dict, attempt_id: str) -> dict:
    return submit_attempt(current_user, attempt_id)


def get_integrated_attempt(current_user: dict, attempt_id: str) -> dict:
    with get_connection() as connection:
        attempt_row = _fetch_attempt_row(connection, attempt_id)
        _ensure_attempt_access(current_user, attempt_row)

        test_row = _fetch_test_row(connection, attempt_row["test_id"])
        include_answer_key = current_user["role"] == "admin"
        questions = _load_attempt_questions(connection, attempt_row, include_answer_key=include_answer_key)
        attempt = _serialize_attempt_row(attempt_row, total_questions=len(questions))
        serialized_test = _serialize_test_row(test_row, questions, latest_attempt=attempt)
        serialized_test["questions"] = questions

    return {
        "attempt": attempt,
        "test": serialized_test,
    }


def get_attempt_report(current_user: dict, attempt_id: str) -> dict:
    with get_connection() as connection:
        attempt_row = _fetch_attempt_row(connection, attempt_id)
        _ensure_attempt_access(current_user, attempt_row)
        test_row = _fetch_test_row(connection, attempt_row["test_id"])
        questions = _load_attempt_questions(connection, attempt_row, include_answer_key=True)
        attempt = _serialize_attempt_row(attempt_row, total_questions=len(questions))

        if attempt["role"] == "student" and attempt["status"] in {"submitted", "graded"}:
            report_row = _ensure_report_record(connection, attempt_id)
            report_payload = _load_report_payload(report_row)
        else:
            report_payload = build_attempt_report_payload(
                {"id": test_row["id"], "title": test_row["title"], "slug": test_row["slug"]},
                attempt,
                questions,
                attempt["teacherComment"],
            )

    return {
        "attempt": attempt,
        "report": report_payload,
    }


def update_teacher_comment(current_user: dict, attempt_id: str, teacher_comment: str) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate actualiza comentariul.")

    with get_connection() as connection:
        attempt_row = _fetch_attempt_row(connection, attempt_id)
        test_row = _fetch_test_row(connection, attempt_row["test_id"])
        questions = _load_attempt_questions(connection, attempt_row, include_answer_key=True)
        connection.execute(
            "UPDATE integrated_attempts SET teacher_comment = ?, updated_at = ? WHERE id = ?",
            (teacher_comment, utc_now_iso(), attempt_id),
        )
        connection.commit()

        refreshed_attempt_row = _fetch_attempt_row(connection, attempt_id)
        refreshed_attempt = _serialize_attempt_row(refreshed_attempt_row, total_questions=len(questions))
        if refreshed_attempt["role"] == "student":
            report_payload, _ = _persist_attempt_report(connection, test_row, refreshed_attempt, questions)
            connection.commit()
        else:
            report_payload = build_attempt_report_payload(
                {"id": test_row["id"], "title": test_row["title"], "slug": test_row["slug"]},
                refreshed_attempt,
                questions,
                teacher_comment,
            )

    return {"attempt": refreshed_attempt, "report": report_payload}


def _backfill_missing_reports(connection: sqlite3.Connection) -> None:
    rows = connection.execute(
        """
        SELECT a.*
        FROM integrated_attempts a
        LEFT JOIN integrated_reports r ON r.attempt_id = a.id
        WHERE a.role = 'student' AND a.status = 'graded' AND r.id IS NULL
        """
    ).fetchall()

    for row in rows:
        test_row = _fetch_test_row(connection, row["test_id"])
        questions = _load_attempt_questions(connection, row, include_answer_key=True)
        attempt = _serialize_attempt_row(row, total_questions=len(questions))
        _persist_attempt_report(connection, test_row, attempt, questions)


def list_admin_reports(current_user: dict) -> list[dict]:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate vedea rapoartele centralizate.")

    with get_connection() as connection:
        _backfill_missing_reports(connection)
        connection.commit()
        rows = connection.execute(
            """
            SELECT r.*, a.correct_count, a.wrong_count, a.status, a.submitted_at, a.unique_code, a.student_first_name, a.student_last_name
            FROM integrated_reports r
            JOIN integrated_attempts a ON a.id = r.attempt_id
            WHERE a.role = 'student'
            ORDER BY a.submitted_at DESC, r.updated_at DESC
            """
        ).fetchall()
        reports = []
        for row in rows:
            student_email = _find_student_email(connection, row["student_name"])
            reports.append(
                {
                    "id": row["id"],
                    "testType": "integrated",
                    "test_type": "integrated",
                    "attemptId": row["attempt_id"],
                    "attempt_id": row["attempt_id"],
                    "studentName": row["student_name"],
                    "student_name": row["student_name"],
                    "student_display_name": row["student_name"],
                    "studentFirstName": row["student_first_name"] or "",
                    "student_first_name": row["student_first_name"] or "",
                    "studentLastName": row["student_last_name"] or "",
                    "student_last_name": row["student_last_name"] or "",
                    "studentEmail": student_email,
                    "student_email": student_email,
                    "student": {
                        "firstName": row["student_first_name"] or "",
                        "lastName": row["student_last_name"] or "",
                        "email": student_email,
                    },
                    "testTitle": row["test_title"],
                    "test_title": row["test_title"],
                    "status": _normalize_status(row["status"]),
                    "statusLabel": _status_display_label(row["status"]),
                    "status_label": _status_code_label(row["status"]),
                    "submittedAt": row["submitted_at"],
                    "submitted_at": row["submitted_at"],
                    "durationSeconds": row["duration_seconds"],
                    "duration_seconds": row["duration_seconds"],
                    "scorePercent": row["score_percent"],
                    "score_percentage": row["score_percent"],
                    "correctCount": row["correct_count"],
                    "correct_count": row["correct_count"],
                    "wrongCount": row["wrong_count"],
                    "wrong_count": row["wrong_count"],
                    "teacherComment": row["teacher_comment"] or "",
                    "teacher_comment": row["teacher_comment"] or "",
                    "uniqueCode": row["unique_code"],
                    "unique_code": row["unique_code"],
                    "reportJsonPath": row["report_json_path"],
                    "report_json_path": row["report_json_path"],
                    "reportHtmlPath": row["report_html_path"],
                    "report_html_path": row["report_html_path"],
                    "reportPdfPath": row["report_pdf_path"],
                    "report_pdf_path": row["report_pdf_path"],
                    "lessonRadar": _decode_json(row["lesson_radar_json"], []),
                    "lesson_radar": _decode_json(row["lesson_radar_json"], []),
                }
            )

    return reports


def list_teacher_results(current_user: dict) -> list[dict]:
    return list_admin_reports(current_user)


def get_admin_report(current_user: dict, report_id: str) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate accesa raportele.")

    with get_connection() as connection:
        report_row = _fetch_report_row(connection, report_id)
        attempt_row = _fetch_attempt_row(connection, report_row["attempt_id"])
        _, _, refreshed_report_row = _refresh_report_record(connection, attempt_row)
        return _load_report_payload(refreshed_report_row)


def list_admin_live_attempts(current_user: dict) -> list[dict]:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate folosi monitorizarea live.")

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT a.*, t.title AS test_title, t.duration_minutes
            FROM integrated_attempts a
            JOIN integrated_tests t ON t.id = a.test_id
            WHERE a.status = 'in_progress' AND a.role = 'student'
            ORDER BY a.updated_at DESC
            """
        ).fetchall()

        total_questions_by_test = {
            row["test_id"]: connection.execute(
                "SELECT COUNT(*) AS total FROM integrated_test_questions WHERE test_id = ?",
                (row["test_id"],),
            ).fetchone()["total"]
            for row in rows
        }

        profile_rows = connection.execute(
            "SELECT * FROM integrated_student_profiles ORDER BY updated_at DESC"
        ).fetchall()
        profiles = {
            row["student_key"]: {
                "marker_label": row["marker_label"] or "",
                "accent_color": row["accent_color"] or "",
            }
            for row in profile_rows
        }

        attempts = []
        for index, row in enumerate(rows):
            total_questions = total_questions_by_test[row["test_id"]]
            attempt = _serialize_attempt_row(row, total_questions=total_questions)
            event_rows = connection.execute(
                """
                SELECT id, answered_count, current_question_index, elapsed_seconds, recorded_at
                FROM integrated_attempt_events
                WHERE attempt_id = ?
                ORDER BY id ASC
                """,
                (row["id"],),
            ).fetchall()
            snapshots = [
                _serialize_progress_snapshot(event_row, row["id"], total_questions)
                for event_row in event_rows
            ]
            profile = profiles.get(row["student_key"], {})
            initials = compute_initials(row["student_first_name"] or "", row["student_last_name"] or "")
            attempts.append(
                {
                    **attempt,
                    "student": row["student_display_name"],
                    "test": row["test_title"],
                    "progress": attempt["progressPercent"],
                    "questionIndex": attempt["currentQuestionIndex"],
                    "elapsedSeconds": attempt["elapsedSeconds"],
                    "testTitle": row["test_title"],
                    "test_title": row["test_title"],
                    "durationMinutes": row["duration_minutes"],
                    "duration_minutes": row["duration_minutes"],
                    "lastActivity": row["updated_at"],
                    "last_activity_label": row["updated_at"],
                    "marker": {
                        "label": profile.get("marker_label") or initials,
                        "accent_color": profile.get("accent_color") or DEFAULT_COLORS[index % len(DEFAULT_COLORS)],
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
    return {
        "active_students": list_admin_live_attempts(current_user),
        "generated_at": utc_now_iso(),
    }


def update_student_marker(
    current_user: dict,
    student_key: str,
    marker_label: str | None,
    accent_color: str | None,
) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate modifica markerii studentilor.")

    with get_connection() as connection:
        latest_attempt_row = connection.execute(
            """
            SELECT student_display_name
            FROM integrated_attempts
            WHERE student_key = ? AND role = 'student'
            ORDER BY updated_at DESC
            LIMIT 1
            """,
            (student_key,),
        ).fetchone()

        if latest_attempt_row is None:
            raise _error(404, "Studentul selectat nu exista in arhiva.")

        connection.execute(
            """
            INSERT INTO integrated_student_profiles (
                student_key, display_name, marker_label, accent_color, updated_at
            )
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(student_key) DO UPDATE SET
                display_name = excluded.display_name,
                marker_label = excluded.marker_label,
                accent_color = excluded.accent_color,
                updated_at = excluded.updated_at
            """,
            (
                student_key,
                latest_attempt_row["student_display_name"],
                (marker_label or "").strip(),
                (accent_color or "").strip(),
                utc_now_iso(),
            ),
        )
        connection.commit()

    return {
        "studentKey": student_key,
        "student_key": student_key,
        "marker_label": (marker_label or "").strip(),
        "accent_color": (accent_color or "").strip(),
    }


def list_archive_entries(current_user: dict) -> list[dict]:
    return list_admin_reports(current_user)


def get_report_file_path(current_user: dict, attempt_id: str, file_kind: str) -> str:
    with get_connection() as connection:
        attempt_row = _fetch_attempt_row(connection, attempt_id)
        report_row = _fetch_report_row_by_attempt(connection, attempt_id)

    if report_row is None:
        raise _error(404, "Fisierul raportului nu este disponibil.")

    if file_kind == "pdf":
        _ensure_attempt_access(current_user, attempt_row)
    elif current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate descarca fisierele arhivate.")

    file_paths = {
        "pdf": report_row["report_pdf_path"],
        "json": report_row["report_json_path"],
        "html": report_row["report_html_path"],
    }
    target_path = file_paths.get(file_kind)
    if not target_path:
        raise _error(404, "Fisierul raportului nu este disponibil.")
    if file_kind == "pdf":
        return _regenerate_report_pdf_from_payload(report_row)
    if file_kind == "html":
        return _regenerate_report_html_from_payload(report_row)
    if not Path(target_path).exists():
        raise _error(404, "Fisierul raportului nu este disponibil.")
    return target_path


def get_admin_pdf_path(current_user: dict, report_id: str) -> str:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate accesa PDF-ul.")

    with get_connection() as connection:
        report_row = _fetch_report_row(connection, report_id)
    return _regenerate_report_pdf_from_payload(report_row)


def get_admin_report_email_delivery(current_user: dict, report_id: str) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate trimite rapoarte pe email.")

    with get_connection() as connection:
        report_row = _fetch_report_row(connection, report_id)
        student_email = _find_student_email(connection, report_row["student_name"])
        report_payload = _load_report_payload(report_row)

    if not student_email:
        raise _error(404, "Elevul nu are o adresa de email salvata.")

    pdf_path = _regenerate_report_pdf_from_payload(report_row)

    return {
        "recipient_email": student_email,
        "pdf_path": pdf_path,
        "report": report_payload,
    }


def export_centralized_results(current_user: dict) -> str:
    reports = list_admin_reports(current_user)
    export_rows = [
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
    return build_centralized_csv_export(export_rows)
