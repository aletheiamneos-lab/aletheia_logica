from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request

from .supabase_service import get_server_supabase

PUBLIC_LINK_CODE = "main-public-link"
ABANDONED_AFTER_MINUTES = 45
LOGGER = logging.getLogger("uvicorn.error")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _error(status_code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail=detail)


def _normalize_text(value: str) -> str:
    return " ".join((value or "").strip().split())


def _normalize_optional_text(value: str | None) -> str:
    return _normalize_text(value or "")


def _student_identity_key(name: str, class_name: str, email: str) -> str:
    normalized_parts = (
        _normalize_text(name).casefold(),
        _normalize_optional_text(class_name).casefold(),
        _normalize_optional_text(email).casefold(),
    )
    return hashlib.sha256("\x1f".join(normalized_parts).encode("utf-8")).hexdigest()


def _decode_json(raw_value, fallback):
    return raw_value if isinstance(raw_value, (dict, list)) else fallback


def _parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None

    candidate = str(value).strip()
    if not candidate:
        return None

    try:
        parsed = datetime.fromisoformat(candidate.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _is_mobile_user_agent(user_agent: str) -> bool:
    normalized = (user_agent or "").casefold()
    return any(token in normalized for token in ("iphone", "android", "ipad", "mobile"))


def _detect_browser(user_agent: str) -> str:
    normalized = (user_agent or "").casefold()
    if "edg/" in normalized:
        return "Edge"
    if "chrome/" in normalized and "edg/" not in normalized:
        return "Chrome"
    if "firefox/" in normalized:
        return "Firefox"
    if "safari/" in normalized and "chrome/" not in normalized:
        return "Safari"
    return "Necunoscut"


def _detect_os(user_agent: str) -> str:
    normalized = (user_agent or "").casefold()
    if "windows" in normalized:
        return "Windows"
    if "android" in normalized:
        return "Android"
    if "iphone" in normalized or "ipad" in normalized or "ios" in normalized:
        return "iOS"
    if "mac os" in normalized or "macintosh" in normalized:
        return "macOS"
    if "linux" in normalized:
        return "Linux"
    return "Necunoscut"


def _detect_device_type(user_agent: str) -> str:
    return "mobil" if _is_mobile_user_agent(user_agent) else "desktop"


def _serialize_student(row: dict) -> dict:
    return {
        "id": int(row["id"]),
        "name": row["name"],
        "class_name": row.get("class_name") or "",
        "email": row.get("email") or "",
        "created_at": row["created_at"],
    }


def _derived_status(status: str, last_activity_at: str | None) -> str:
    normalized = (status or "").strip().lower() or "started"
    if normalized not in {"started", "in_progress", "completed", "abandoned"}:
        normalized = "started"

    if normalized in {"started", "in_progress"}:
        last_activity = _parse_iso(last_activity_at)
        if last_activity and datetime.now(timezone.utc) - last_activity > timedelta(
            minutes=ABANDONED_AFTER_MINUTES
        ):
            return "abandoned"

    return normalized


def _status_label(status: str) -> str:
    return {
        "started": "Pornit",
        "in_progress": "In lucru",
        "completed": "Finalizat",
        "abandoned": "Abandonat",
    }.get(status, "Pornit")


def _event_label(event_type: str) -> str:
    return {
        "link_opened": "Link deschis",
        "identified": "Elev identificat",
        "test_started": "Test pornit",
        "answer_saved": "Raspuns salvat",
        "question_changed": "Intrebare schimbata",
        "test_submitted": "Test trimis",
    }.get(event_type, event_type)


def _fetch_one(table_name: str, row_id: int) -> dict | None:
    rows = (
        get_server_supabase()
        .table(table_name)
        .select("*")
        .eq("id", row_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    return rows[0] if rows else None


def track_link_open(payload: dict, request: Request) -> dict:
    session_id = _normalize_text(payload.get("session_id", ""))
    public_link_code = _normalize_text(payload.get("public_link_code", "")) or PUBLIC_LINK_CODE
    if not session_id:
        raise _error(400, "Sesiunea publica lipseste.")

    user_agent = request.headers.get("user-agent", "")
    ip_address = request.client.host if request.client else ""
    activated_at = utc_now_iso()
    device_type = _detect_device_type(user_agent)
    browser = _detect_browser(user_agent)
    operating_system = _detect_os(user_agent)
    is_mobile = _is_mobile_user_agent(user_agent)
    supabase = get_server_supabase()
    existing_rows = (
        supabase.table("activity_link_activations")
        .select("*")
        .eq("session_id", session_id)
        .order("activated_at", desc=True)
        .limit(1)
        .execute()
        .data
        or []
    )
    if existing_rows:
        return {
            "ok": True,
            "session_id": session_id,
            "public_link_code": public_link_code,
            "already_logged": True,
        }

    supabase.table("activity_link_activations").insert(
        {
            "student_id": None,
            "session_id": session_id,
            "public_link_code": public_link_code,
            "activated_at": activated_at,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "device_type": device_type,
            "browser": browser,
            "os": operating_system,
            "is_mobile": is_mobile,
        }
    ).execute()
    supabase.table("activity_events").insert(
        {
            "student_id": None,
            "session_id": session_id,
            "test_session_id": None,
            "event_type": "link_opened",
            "event_data": {
                "public_link_code": public_link_code,
                "device_type": device_type,
                "browser": browser,
                "os": operating_system,
            },
            "created_at": activated_at,
        }
    ).execute()

    return {
        "ok": True,
        "session_id": session_id,
        "public_link_code": public_link_code,
        "already_logged": False,
    }


def identify_student(
    payload: dict,
    request: Request | None = None,
    *,
    record_event: bool = True,
) -> dict:
    session_id = _normalize_text(payload.get("session_id", ""))
    name = _normalize_text(payload.get("name", ""))
    class_name = _normalize_optional_text(payload.get("class_name"))
    email = _normalize_optional_text(payload.get("email"))

    if not session_id:
        raise _error(400, "Sesiunea publica lipseste.")
    if not name:
        raise _error(400, "Numele complet este obligatoriu.")

    identity_key = _student_identity_key(name, class_name, email)
    created_at = utc_now_iso()
    supabase = get_server_supabase()
    if request is not None:
        track_link_open(
            {
                "session_id": session_id,
                "public_link_code": payload.get("public_link_code") or PUBLIC_LINK_CODE,
            },
            request,
        )

    rows = (
        supabase.table("tracked_students")
        .select("*")
        .eq("identity_key", identity_key)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not rows and email:
        legacy_rows = (
            supabase.table("tracked_students")
            .select("*")
            .eq("name", name)
            .eq("class_name", class_name)
            .eq("email", "")
            .limit(1)
            .execute()
            .data
            or []
        )
        if legacy_rows:
            rows = (
                supabase.table("tracked_students")
                .update({"identity_key": identity_key, "email": email})
                .eq("id", legacy_rows[0]["id"])
                .execute()
                .data
                or legacy_rows
            )
    was_created = not rows
    if not rows:
        rows = (
            supabase.table("tracked_students")
            .insert(
                {
                    "identity_key": identity_key,
                    "name": name,
                    "class_name": class_name,
                    "email": email,
                    "created_at": created_at,
                }
            )
            .execute()
            .data
            or []
        )
    else:
        student_row = rows[0]
        if (
            student_row.get("name") != name
            or (student_row.get("class_name") or "") != class_name
            or (student_row.get("email") or "") != email
        ):
            updated_rows = (
                supabase.table("tracked_students")
                .update({"name": name, "class_name": class_name, "email": email})
                .eq("id", student_row["id"])
                .execute()
                .data
                or []
            )
            if updated_rows:
                rows = updated_rows
    if not rows:
        raise _error(502, "Elevul nu a putut fi salvat in Supabase.")

    student_row = rows[0]
    student_id = int(student_row["id"])
    (
        supabase.table("activity_link_activations")
        .update({"student_id": student_id})
        .eq("session_id", session_id)
        .is_("student_id", "null")
        .execute()
    )
    if record_event:
        existing_identification = (
            supabase.table("activity_events")
            .select("id")
            .eq("student_id", student_id)
            .eq("session_id", session_id)
            .eq("event_type", "identified")
            .limit(1)
            .execute()
            .data
            or []
        )
        if not existing_identification:
            supabase.table("activity_events").insert(
                {
                    "student_id": student_id,
                    "session_id": session_id,
                    "test_session_id": None,
                    "event_type": "identified",
                    "event_data": {"name": name, "class_name": class_name, "email": email},
                    "created_at": utc_now_iso(),
                }
            ).execute()

    return {
        "ok": True,
        "student_id": student_id,
        "student": _serialize_student(student_row),
        "created": was_created,
    }


def start_test_session(payload: dict) -> dict:
    session_id = _normalize_text(payload.get("session_id", ""))
    student_id = int(payload.get("student_id") or 0)
    test_id = _normalize_text(payload.get("test_id", ""))
    test_title = _normalize_text(payload.get("test_title", ""))

    if not session_id or not student_id or not test_id or not test_title:
        raise _error(400, "Datele de pornire ale testului sunt incomplete.")
    if _fetch_one("tracked_students", student_id) is None:
        raise _error(404, "Elevul urmarit nu exista.")

    supabase = get_server_supabase()
    existing_rows = (
        supabase.table("activity_test_sessions")
        .select("*")
        .eq("session_id", session_id)
        .eq("student_id", student_id)
        .eq("test_id", test_id)
        .in_("status", ["started", "in_progress"])
        .order("id", desc=True)
        .limit(1)
        .execute()
        .data
        or []
    )
    now_iso = utc_now_iso()
    if existing_rows:
        session_rows = (
            supabase.table("activity_test_sessions")
            .update({"last_activity_at": now_iso, "status": "in_progress"})
            .eq("id", existing_rows[0]["id"])
            .execute()
            .data
            or []
        )
        session_row = session_rows[0] if session_rows else existing_rows[0]
    else:
        session_rows = (
            supabase.table("activity_test_sessions")
            .insert(
                {
                    "student_id": student_id,
                    "session_id": session_id,
                    "test_id": test_id,
                    "test_title": test_title,
                    "started_at": now_iso,
                    "last_activity_at": now_iso,
                    "status": "started",
                }
            )
            .execute()
            .data
            or []
        )
        if not session_rows:
            raise _error(502, "Sesiunea de tracking nu a putut fi salvata in Supabase.")
        session_row = session_rows[0]

    test_session_id = int(session_row["id"])
    supabase.table("activity_events").insert(
        {
            "student_id": student_id,
            "session_id": session_id,
            "test_session_id": test_session_id,
            "event_type": "test_started",
            "event_data": {"test_id": test_id, "test_title": test_title},
            "created_at": now_iso,
        }
    ).execute()
    return {
        "ok": True,
        "test_session_id": test_session_id,
        "student_id": student_id,
    }


def _validated_test_session(student_id: int, session_id: str, test_session_id: int) -> dict:
    rows = (
        get_server_supabase()
        .table("activity_test_sessions")
        .select("*")
        .eq("id", test_session_id)
        .eq("student_id", student_id)
        .eq("session_id", session_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not rows:
        raise _error(404, "Sesiunea de tracking pentru test nu exista.")
    return rows[0]


def save_test_progress(payload: dict) -> dict:
    session_id = _normalize_text(payload.get("session_id", ""))
    student_id = int(payload.get("student_id") or 0)
    test_session_id = int(payload.get("test_session_id") or 0)
    question_index = int(payload.get("question_index") or 0)
    selected_answer = payload.get("selected_answer")
    is_correct = payload.get("is_correct")
    answered_count = int(payload.get("answered_count") or 0)
    total_questions = int(payload.get("total_questions") or 0)
    event_type = _normalize_text(payload.get("event_type", "")) or "answer_saved"
    if event_type not in {"answer_saved", "question_changed"}:
        event_type = "answer_saved"

    if not session_id or not student_id or not test_session_id:
        raise _error(400, "Datele de progres sunt incomplete.")
    _validated_test_session(student_id, session_id, test_session_id)

    progress_percent = round((answered_count / total_questions) * 100) if total_questions > 0 else 0
    now_iso = utc_now_iso()
    supabase = get_server_supabase()
    (
        supabase.table("activity_test_sessions")
        .update(
            {
                "last_activity_at": now_iso,
                "status": "in_progress",
                "current_question_index": question_index,
                "answered_count": answered_count,
                "progress_percent": progress_percent,
            }
        )
        .eq("id", test_session_id)
        .execute()
    )
    supabase.table("activity_events").insert(
        {
            "student_id": student_id,
            "session_id": session_id,
            "test_session_id": test_session_id,
            "event_type": event_type,
            "event_data": {
                "question_index": question_index,
                "selected_answer": selected_answer,
                "is_correct": is_correct,
                "answered_count": answered_count,
                "total_questions": total_questions,
            },
            "created_at": now_iso,
        }
    ).execute()
    return {"ok": True, "progress_percent": progress_percent}


def submit_test_session(payload: dict) -> dict:
    session_id = _normalize_text(payload.get("session_id", ""))
    student_id = int(payload.get("student_id") or 0)
    test_session_id = int(payload.get("test_session_id") or 0)
    score = float(payload.get("score") or 0)
    correct_answers = int(payload.get("correct_answers") or 0)
    wrong_answers = int(payload.get("wrong_answers") or 0)
    total_questions = int(payload.get("total_questions") or 0)

    if not session_id or not student_id or not test_session_id:
        raise _error(400, "Datele de trimitere ale testului sunt incomplete.")
    _validated_test_session(student_id, session_id, test_session_id)

    now_iso = utc_now_iso()
    supabase = get_server_supabase()
    (
        supabase.table("activity_test_sessions")
        .update(
            {
                "completed_at": now_iso,
                "last_activity_at": now_iso,
                "status": "completed",
                "score": score,
                "correct_answers": correct_answers,
                "wrong_answers": wrong_answers,
                "total_questions": total_questions,
                "progress_percent": 100,
                "answered_count": min(
                    total_questions,
                    max(correct_answers + wrong_answers, 0),
                ),
            }
        )
        .eq("id", test_session_id)
        .execute()
    )
    supabase.table("activity_events").insert(
        {
            "student_id": student_id,
            "session_id": session_id,
            "test_session_id": test_session_id,
            "event_type": "test_submitted",
            "event_data": {
                "score": score,
                "correct_answers": correct_answers,
                "wrong_answers": wrong_answers,
                "total_questions": total_questions,
            },
            "created_at": now_iso,
        }
    ).execute()
    return {"ok": True, "test_session_id": test_session_id}


def _source_session_id(source_type: str, source_id: str) -> str:
    normalized_type = _normalize_text(source_type).casefold() or "test"
    normalized_id = _normalize_text(source_id)
    return f"source:{normalized_type}:{normalized_id}"


def _safe_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _safe_float(value, default: float = 0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _first_value(payload: dict, *keys: str):
    for key in keys:
        if key in payload and payload[key] is not None:
            return payload[key]
    return None


def _activity_identity(current_user: dict, session_id: str) -> dict | None:
    if current_user.get("role") != "student":
        return None

    name = _normalize_text(
        current_user.get("display_name")
        or current_user.get("displayName")
        or " ".join(
            part
            for part in (
                _normalize_text(current_user.get("first_name") or current_user.get("firstName") or ""),
                _normalize_text(current_user.get("last_name") or current_user.get("lastName") or ""),
            )
            if part
        )
    )
    email = _normalize_optional_text(current_user.get("email"))
    if not name:
        return None

    return identify_student(
        {
            "session_id": session_id,
            "name": name,
            "email": email,
        },
        record_event=False,
    )


def sync_external_test_attempt(
    current_user: dict,
    *,
    source_type: str,
    source_id: str,
    test_id: str,
    test_title: str,
    status: str,
    started_at: str | None = None,
    last_activity_at: str | None = None,
    completed_at: str | None = None,
    score: float | int | None = None,
    correct_answers: int | None = None,
    wrong_answers: int | None = None,
    total_questions: int | None = None,
    answered_count: int | None = None,
    current_question_index: int | None = None,
    tracking_session_id: int | None = None,
) -> dict | None:
    """Mirror a real test attempt into the unified activity monitor.

    The source-derived session id makes retries and historical backfills
    idempotent without requiring an additional database migration.
    """

    if current_user.get("role") != "student":
        return None

    normalized_source_id = _normalize_text(source_id)
    normalized_test_id = _normalize_text(test_id)
    normalized_test_title = _normalize_text(test_title)
    if not normalized_source_id or not normalized_test_id or not normalized_test_title:
        return None

    source_session_id = _source_session_id(source_type, normalized_source_id)
    identity = _activity_identity(current_user, source_session_id)
    if not identity:
        return None

    student_id = int(identity["student_id"])
    supabase = get_server_supabase()
    existing_rows = []
    if tracking_session_id:
        existing_rows = (
            supabase.table("activity_test_sessions")
            .select("*")
            .eq("id", int(tracking_session_id))
            .eq("student_id", student_id)
            .limit(1)
            .execute()
            .data
            or []
        )

    if not existing_rows:
        existing_rows = (
            supabase.table("activity_test_sessions")
            .select("*")
            .eq("session_id", source_session_id)
            .eq("student_id", student_id)
            .limit(1)
            .execute()
            .data
            or []
        )

    normalized_status = "completed" if status == "completed" else "in_progress"
    if not existing_rows and normalized_status == "completed":
        existing_rows = (
            supabase.table("activity_test_sessions")
            .select("*")
            .eq("student_id", student_id)
            .eq("test_id", normalized_test_id)
            .in_("status", ["started", "in_progress"])
            .order("last_activity_at", desc=True)
            .limit(1)
            .execute()
            .data
            or []
        )

    now_iso = utc_now_iso()
    normalized_started_at = started_at or now_iso
    normalized_last_activity = last_activity_at or completed_at or now_iso
    normalized_total = max(0, _safe_int(total_questions))
    normalized_correct = max(0, _safe_int(correct_answers))
    normalized_wrong = max(0, _safe_int(wrong_answers))
    normalized_answered = max(
        0,
        _safe_int(
            answered_count,
            normalized_correct + normalized_wrong,
        ),
    )
    normalized_answered = min(normalized_answered, normalized_total) if normalized_total else normalized_answered
    progress_percent = (
        100
        if normalized_status == "completed"
        else round((normalized_answered / normalized_total) * 100)
        if normalized_total
        else 0
    )
    values = {
        "test_id": normalized_test_id,
        "test_title": normalized_test_title,
        "last_activity_at": normalized_last_activity,
        "status": normalized_status,
        "score": _safe_float(score) if score is not None else None,
        "correct_answers": normalized_correct,
        "wrong_answers": normalized_wrong,
        "total_questions": normalized_total,
        "current_question_index": max(0, _safe_int(current_question_index)),
        "answered_count": normalized_answered,
        "progress_percent": max(0, min(100, progress_percent)),
    }
    if normalized_status == "completed":
        values["completed_at"] = completed_at or normalized_last_activity

    was_created = not existing_rows
    if existing_rows:
        rows = (
            supabase.table("activity_test_sessions")
            .update(values)
            .eq("id", existing_rows[0]["id"])
            .execute()
            .data
            or existing_rows
        )
    else:
        rows = (
            supabase.table("activity_test_sessions")
            .insert(
                {
                    "student_id": student_id,
                    "session_id": source_session_id,
                    "started_at": normalized_started_at,
                    **values,
                }
            )
            .execute()
            .data
            or []
        )
    if not rows:
        raise _error(502, "Incercarea nu a putut fi sincronizata in monitorizare.")

    session_row = rows[0]
    test_session_id = int(session_row["id"])
    if was_created:
        supabase.table("activity_events").insert(
            {
                "student_id": student_id,
                "session_id": session_row["session_id"],
                "test_session_id": test_session_id,
                "event_type": "test_started",
                "event_data": {
                    "test_id": normalized_test_id,
                    "test_title": normalized_test_title,
                    "source_type": source_type,
                    "source_id": normalized_source_id,
                },
                "created_at": normalized_started_at,
            }
        ).execute()

    if normalized_status == "completed":
        submitted_events = (
            supabase.table("activity_events")
            .select("id")
            .eq("test_session_id", test_session_id)
            .eq("event_type", "test_submitted")
            .limit(1)
            .execute()
            .data
            or []
        )
        if not submitted_events:
            supabase.table("activity_events").insert(
                {
                    "student_id": student_id,
                    "session_id": session_row["session_id"],
                    "test_session_id": test_session_id,
                    "event_type": "test_submitted",
                    "event_data": {
                        "score": values["score"],
                        "correct_answers": normalized_correct,
                        "wrong_answers": normalized_wrong,
                        "total_questions": normalized_total,
                        "source_type": source_type,
                        "source_id": normalized_source_id,
                    },
                    "created_at": values["completed_at"],
                }
            ).execute()

    return {
        "test_session_id": test_session_id,
        "student_id": student_id,
        "status": normalized_status,
    }


def sync_integrated_attempt(
    current_user: dict,
    attempt_row: dict,
    test_title: str,
    *,
    total_questions: int,
) -> dict | None:
    raw_answers = _decode_json(attempt_row.get("raw_answers"), {})
    answers = _decode_json(raw_answers.get("answers"), {})
    if "answers" not in raw_answers:
        answers = {
            str(key): value
            for key, value in raw_answers.items()
            if not str(key).startswith("_")
        }
    meta = _decode_json(raw_answers.get("_meta"), {})
    questions = _decode_json(meta.get("question_snapshot"), [])
    correct_answers = sum(
        1
        for question in questions
        if str(question.get("id")) in answers
        and answers[str(question.get("id"))] == question.get("correct_option_index")
    )
    wrong_answers = max(len(answers) - correct_answers, 0)
    normalized_status = (
        "completed"
        if str(attempt_row.get("status") or "").lower() in {"submitted", "graded", "finalized"}
        else "in_progress"
    )
    return sync_external_test_attempt(
        current_user,
        source_type="integrated",
        source_id=str(attempt_row["id"]),
        test_id=str(attempt_row["test_id"]),
        test_title=test_title,
        status=normalized_status,
        started_at=attempt_row.get("started_at") or attempt_row.get("created_at"),
        last_activity_at=attempt_row.get("updated_at"),
        completed_at=attempt_row.get("submitted_at"),
        score=attempt_row.get("score_total"),
        correct_answers=correct_answers,
        wrong_answers=wrong_answers,
        total_questions=total_questions,
        answered_count=len(answers),
        current_question_index=_safe_int(meta.get("current_question_index")),
    )


def sync_report_attempt(
    current_user: dict,
    report: dict,
    *,
    source_type: str,
) -> dict | None:
    report_id = str(report.get("id") or report.get("reportId") or "")
    test_title = str(
        report.get("testTitle")
        or report.get("test_title")
        or report.get("examTitle")
        or f"Test {source_type.upper()}"
    )
    raw_test_id = str(
        report.get("testId")
        or report.get("test_id")
        or report.get("examId")
        or report.get("exam_id")
        or report.get("testSlug")
        or report.get("test_slug")
        or report_id
    )
    tracking_session_id = _safe_int(
        _first_value(report, "trackingTestSessionId", "tracking_test_session_id")
    )
    total_questions = _safe_int(
        _first_value(
            report,
            "totalQuestions",
            "total_questions",
            "totalItems",
            "total_items",
        )
    )
    correct_answers = _safe_int(
        _first_value(report, "correctCount", "correct_count", "score")
    )
    wrong_answers = _safe_int(
        _first_value(report, "wrongCount", "wrong_count"),
        max(total_questions - correct_answers, 0),
    )
    answered_count = _safe_int(
        _first_value(report, "answeredCount", "answered_count"),
        correct_answers + wrong_answers,
    )
    return sync_external_test_attempt(
        current_user,
        source_type=source_type,
        source_id=report_id,
        test_id=f"{source_type}:{raw_test_id}",
        test_title=test_title,
        status="completed",
        started_at=report.get("startedAt") or report.get("started_at"),
        last_activity_at=report.get("submittedAt") or report.get("submitted_at"),
        completed_at=report.get("submittedAt") or report.get("submitted_at"),
        score=_first_value(report, "scorePercent", "score_percentage", "percentage"),
        correct_answers=correct_answers,
        wrong_answers=wrong_answers,
        total_questions=total_questions,
        answered_count=answered_count,
        current_question_index=max(total_questions - 1, 0),
        tracking_session_id=tracking_session_id or None,
    )


def backfill_historical_activity_attempts() -> dict:
    """Idempotently imports persisted student results into monitorizare."""

    supabase = get_server_supabase()
    imported = {"integrated": 0, "bac": 0, "admitere": 0}
    tests = supabase.table("tests").select("id,title").execute().data or []
    test_titles = {str(row["id"]): str(row.get("title") or "Test integrat") for row in tests}
    attempts = supabase.table("attempts").select("*").execute().data or []
    for row in attempts:
        raw_answers = _decode_json(row.get("raw_answers"), {})
        meta = _decode_json(raw_answers.get("_meta"), {})
        if meta.get("role") != "student":
            continue
        current_user = {
            "role": "student",
            "session_id": meta.get("session_id") or _source_session_id("integrated", str(row["id"])),
            "display_name": row.get("student_name") or "Elev",
            "email": row.get("student_email") or "",
            "first_name": meta.get("student_first_name") or "",
            "last_name": meta.get("student_last_name") or "",
        }
        questions = _decode_json(meta.get("question_snapshot"), [])
        sync_integrated_attempt(
            current_user,
            row,
            test_titles.get(str(row.get("test_id")), "Test integrat"),
            total_questions=len(questions),
        )
        imported["integrated"] += 1

    for source_type, table_name in (
        ("bac", "bac_student_reports"),
        ("admitere", "admitere_student_reports"),
    ):
        try:
            report_rows = supabase.table(table_name).select("*").execute().data or []
        except Exception:
            LOGGER.exception("[Activity backfill] Tabela %s nu a putut fi citita", table_name)
            continue
        for row in report_rows:
            email = _normalize_optional_text(row.get("student_email"))
            payload = _decode_json(row.get("payload"), {})
            if not email:
                continue
            report = {
                **payload,
                "id": str(row.get("id") or payload.get("id") or ""),
                "submittedAt": row.get("submitted_at") or payload.get("submittedAt"),
            }
            current_user = {
                "role": "student",
                "session_id": _source_session_id(source_type, report["id"]),
                "display_name": row.get("student_name") or payload.get("studentName") or "Elev",
                "email": email,
            }
            sync_report_attempt(current_user, report, source_type=source_type)
            imported[source_type] += 1

    return imported


def _serialize_recent_event(
    row: dict,
    students_by_id: dict[int, dict],
    sessions_by_id: dict[int, dict],
) -> dict:
    student = students_by_id.get(int(row["student_id"])) if row.get("student_id") is not None else None
    session = (
        sessions_by_id.get(int(row["test_session_id"]))
        if row.get("test_session_id") is not None
        else None
    )
    return {
        "id": int(row["id"]),
        "event_type": row["event_type"],
        "event_label": _event_label(row["event_type"]),
        "student_name": (student or {}).get("name") or "Vizitator",
        "test_title": (session or {}).get("test_title") or "",
        "created_at": row["created_at"],
        "event_data": _decode_json(row.get("event_data"), {}),
    }


def _serialize_tracked_session(row: dict) -> dict:
    status = _derived_status(row["status"], row.get("last_activity_at"))
    return {
        "id": int(row["id"]),
        "student_id": int(row["student_id"]),
        "session_id": row["session_id"],
        "test_id": row["test_id"],
        "test_title": row["test_title"],
        "started_at": row["started_at"],
        "last_activity_at": row["last_activity_at"],
        "completed_at": row.get("completed_at") or "",
        "status": status,
        "status_label": _status_label(status),
        "score": row.get("score"),
        "correct_answers": row.get("correct_answers"),
        "wrong_answers": row.get("wrong_answers"),
        "total_questions": row.get("total_questions"),
        "current_question_index": row.get("current_question_index") or 0,
        "answered_count": row.get("answered_count") or 0,
        "progress_percent": row.get("progress_percent") or 0,
    }


def _activity_snapshot() -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    supabase = get_server_supabase()
    students = (
        supabase.table("tracked_students").select("*").order("created_at", desc=True).execute().data or []
    )
    activations = (
        supabase.table("activity_link_activations")
        .select("*")
        .order("activated_at", desc=True)
        .execute()
        .data
        or []
    )
    sessions = (
        supabase.table("activity_test_sessions")
        .select("*")
        .order("last_activity_at", desc=True)
        .execute()
        .data
        or []
    )
    events = (
        supabase.table("activity_events")
        .select("*")
        .order("created_at", desc=True)
        .limit(100)
        .execute()
        .data
        or []
    )
    return students, activations, sessions, events


def get_admin_activity_overview(current_user: dict) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate vedea overview-ul de tracking.")

    students, activations, sessions, events = _activity_snapshot()
    active_cutoff = datetime.now(timezone.utc) - timedelta(minutes=ABANDONED_AFTER_MINUTES)
    active_test_sessions = sum(
        1
        for row in sessions
        if row.get("status") in {"started", "in_progress"}
        and (_parse_iso(row.get("last_activity_at")) or datetime.min.replace(tzinfo=timezone))
        >= active_cutoff
    )
    students_by_id = {int(row["id"]): row for row in students}
    sessions_by_id = {int(row["id"]): row for row in sessions}
    return {
        "total_activations": len(activations),
        "identified_students": len(students),
        "total_test_sessions": len(sessions),
        "active_test_sessions": active_test_sessions,
        "completed_tests": sum(1 for row in sessions if row.get("status") == "completed"),
        "recent_activity": [
            _serialize_recent_event(row, students_by_id, sessions_by_id) for row in events[:16]
        ],
        "generated_at": utc_now_iso(),
    }


def get_admin_activity_students(current_user: dict) -> list[dict]:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate vedea elevii urmariti.")

    student_rows, activation_rows, session_rows, _ = _activity_snapshot()
    activations_by_student: dict[int, list[dict]] = {}
    sessions_by_student: dict[int, list[dict]] = {}
    for row in activation_rows:
        if row.get("student_id") is not None:
            activations_by_student.setdefault(int(row["student_id"]), []).append(row)
    for row in session_rows:
        sessions_by_student.setdefault(int(row["student_id"]), []).append(row)

    students = []
    for row in student_rows:
        student_id = int(row["id"])
        student_activations = activations_by_student.get(student_id, [])
        student_sessions = sessions_by_student.get(student_id, [])
        latest_activation = student_activations[0] if student_activations else None
        latest_session = student_sessions[0] if student_sessions else None
        serialized_session = _serialize_tracked_session(latest_session) if latest_session else None
        last_activity_at = (
            serialized_session["last_activity_at"]
            if serialized_session
            else (latest_activation["activated_at"] if latest_activation else row["created_at"])
        )
        students.append(
            {
                **_serialize_student(row),
                "device_type": latest_activation.get("device_type", "") if latest_activation else "",
                "last_activity_at": last_activity_at,
                "latest_status": serialized_session["status"] if serialized_session else "started",
                "latest_status_label": (
                    serialized_session["status_label"] if serialized_session else "Pornit"
                ),
                "tests_started": len(student_sessions),
                "tests_completed": sum(
                    1 for session in student_sessions if session.get("status") == "completed"
                ),
                "latest_test_title": serialized_session["test_title"] if serialized_session else "",
                "progress_percent": serialized_session["progress_percent"] if serialized_session else 0,
                "score": serialized_session["score"] if serialized_session else None,
            }
        )

    students.sort(key=lambda entry: entry["last_activity_at"] or "", reverse=True)
    return students


def get_admin_activity_student_detail(current_user: dict, student_id: int) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate vedea detaliile elevului.")

    student_row = _fetch_one("tracked_students", student_id)
    if student_row is None:
        raise _error(404, "Elevul selectat nu exista.")

    supabase = get_server_supabase()
    activation_rows = (
        supabase.table("activity_link_activations")
        .select("*")
        .eq("student_id", student_id)
        .order("activated_at", desc=True)
        .execute()
        .data
        or []
    )
    session_rows = (
        supabase.table("activity_test_sessions")
        .select("*")
        .eq("student_id", student_id)
        .order("last_activity_at", desc=True)
        .execute()
        .data
        or []
    )
    event_rows = (
        supabase.table("activity_events")
        .select("*")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .limit(100)
        .execute()
        .data
        or []
    )
    sessions_by_id = {int(row["id"]): row for row in session_rows}

    return {
        "student": _serialize_student(student_row),
        "activations": [
            {
                "id": int(row["id"]),
                "session_id": row["session_id"],
                "public_link_code": row["public_link_code"],
                "activated_at": row["activated_at"],
                "device_type": row.get("device_type") or "",
                "browser": row.get("browser") or "",
                "os": row.get("os") or "",
                "is_mobile": bool(row.get("is_mobile")),
            }
            for row in activation_rows
        ],
        "test_sessions": [_serialize_tracked_session(row) for row in session_rows],
        "event_timeline": [
            {
                "id": int(row["id"]),
                "event_type": row["event_type"],
                "event_label": _event_label(row["event_type"]),
                "test_title": (
                    sessions_by_id.get(int(row["test_session_id"]), {}).get("test_title") or ""
                    if row.get("test_session_id") is not None
                    else ""
                ),
                "created_at": row["created_at"],
                "event_data": _decode_json(row.get("event_data"), {}),
            }
            for row in event_rows
        ],
    }
