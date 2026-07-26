from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request

from .database import get_connection

PUBLIC_LINK_CODE = "main-public-link"
ABANDONED_AFTER_MINUTES = 45


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _error(status_code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail=detail)


def _normalize_text(value: str) -> str:
    return " ".join((value or "").strip().split())


def _normalize_optional_text(value: str | None) -> str:
    return _normalize_text(value or "")


def _decode_json(raw_value: str | None, fallback):
    if not raw_value:
        return fallback

    try:
        return json.loads(raw_value)
    except json.JSONDecodeError:
        return fallback


def _parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None

    candidate = value.strip()
    if not candidate:
        return None

    try:
        return datetime.fromisoformat(candidate.replace("Z", "+00:00"))
    except ValueError:
        return None


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


def _serialize_student(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "class_name": row["class_name"] or "",
        "email": row["email"] or "",
        "created_at": row["created_at"],
    }


def _derived_status(status: str, last_activity_at: str | None) -> str:
    normalized = (status or "").strip().lower() or "started"
    if normalized not in {"started", "in_progress", "completed", "abandoned"}:
        normalized = "started"

    if normalized in {"started", "in_progress"}:
        last_activity = _parse_iso(last_activity_at)
        if last_activity and datetime.now(timezone.utc) - last_activity > timedelta(minutes=ABANDONED_AFTER_MINUTES):
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
    is_mobile = int(_is_mobile_user_agent(user_agent))

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO link_activations (
                student_id, session_id, public_link_code, activated_at,
                ip_address, user_agent, device_type, browser, os, is_mobile
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                None,
                session_id,
                public_link_code,
                activated_at,
                ip_address,
                user_agent,
                device_type,
                browser,
                operating_system,
                is_mobile,
            ),
        )
        connection.execute(
            """
            INSERT INTO test_events (
                student_id, session_id, test_session_id, event_type, event_data, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                None,
                session_id,
                None,
                "link_opened",
                json.dumps(
                    {
                        "public_link_code": public_link_code,
                        "device_type": device_type,
                        "browser": browser,
                        "os": operating_system,
                    },
                    ensure_ascii=False,
                ),
                activated_at,
            ),
        )
        connection.commit()

    return {"ok": True, "session_id": session_id, "public_link_code": public_link_code}


def identify_student(payload: dict) -> dict:
    session_id = _normalize_text(payload.get("session_id", ""))
    name = _normalize_text(payload.get("name", ""))
    class_name = _normalize_optional_text(payload.get("class_name"))
    email = _normalize_optional_text(payload.get("email"))

    if not session_id:
        raise _error(400, "Sesiunea publica lipseste.")
    if not name:
        raise _error(400, "Numele complet este obligatoriu.")

    with get_connection() as connection:
        existing_student_row = connection.execute(
            """
            SELECT *
            FROM students
            WHERE LOWER(name) = LOWER(?)
              AND LOWER(COALESCE(class_name, '')) = LOWER(?)
              AND LOWER(COALESCE(email, '')) = LOWER(?)
            ORDER BY id DESC
            LIMIT 1
            """,
            (name, class_name, email),
        ).fetchone()

        if existing_student_row is None:
            created_at = utc_now_iso()
            cursor = connection.execute(
                """
                INSERT INTO students (name, class_name, email, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (name, class_name, email, created_at),
            )
            student_id = cursor.lastrowid
            student_row = connection.execute(
                "SELECT * FROM students WHERE id = ?",
                (student_id,),
            ).fetchone()
        else:
            student_row = existing_student_row
            student_id = student_row["id"]

        connection.execute(
            """
            UPDATE link_activations
            SET student_id = ?
            WHERE session_id = ? AND student_id IS NULL
            """,
            (student_id, session_id),
        )
        connection.execute(
            """
            INSERT INTO test_events (
                student_id, session_id, test_session_id, event_type, event_data, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                student_id,
                session_id,
                None,
                "identified",
                json.dumps(
                    {"name": name, "class_name": class_name, "email": email},
                    ensure_ascii=False,
                ),
                utc_now_iso(),
            ),
        )
        connection.commit()

    return {"ok": True, "student_id": student_id, "student": _serialize_student(student_row)}


def start_test_session(payload: dict) -> dict:
    session_id = _normalize_text(payload.get("session_id", ""))
    student_id = int(payload.get("student_id") or 0)
    test_id = _normalize_text(payload.get("test_id", ""))
    test_title = _normalize_text(payload.get("test_title", ""))

    if not session_id or not student_id or not test_id or not test_title:
        raise _error(400, "Datele de pornire ale testului sunt incomplete.")

    with get_connection() as connection:
        student_row = connection.execute(
            "SELECT * FROM students WHERE id = ?",
            (student_id,),
        ).fetchone()
        if student_row is None:
            raise _error(404, "Elevul urmarit nu exista.")

        existing_row = connection.execute(
            """
            SELECT *
            FROM test_sessions
            WHERE session_id = ? AND student_id = ? AND test_id = ? AND status IN ('started', 'in_progress')
            ORDER BY id DESC
            LIMIT 1
            """,
            (session_id, student_id, test_id),
        ).fetchone()

        if existing_row is not None:
            test_session_id = existing_row["id"]
            now_iso = utc_now_iso()
            connection.execute(
                """
                UPDATE test_sessions
                SET last_activity_at = ?, status = CASE WHEN status = 'started' THEN 'in_progress' ELSE status END
                WHERE id = ?
                """,
                (now_iso, test_session_id),
            )
        else:
            now_iso = utc_now_iso()
            cursor = connection.execute(
                """
                INSERT INTO test_sessions (
                    student_id, session_id, test_id, test_title,
                    started_at, last_activity_at, status
                )
                VALUES (?, ?, ?, ?, ?, ?, 'started')
                """,
                (student_id, session_id, test_id, test_title, now_iso, now_iso),
            )
            test_session_id = cursor.lastrowid

        connection.execute(
            """
            INSERT INTO test_events (
                student_id, session_id, test_session_id, event_type, event_data, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                student_id,
                session_id,
                test_session_id,
                "test_started",
                json.dumps({"test_id": test_id, "test_title": test_title}, ensure_ascii=False),
                now_iso,
            ),
        )
        connection.commit()

    return {"ok": True, "test_session_id": test_session_id}


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

    progress_percent = 0
    if total_questions > 0:
        progress_percent = round((answered_count / total_questions) * 100)

    with get_connection() as connection:
        session_row = connection.execute(
            """
            SELECT *
            FROM test_sessions
            WHERE id = ? AND student_id = ? AND session_id = ?
            """,
            (test_session_id, student_id, session_id),
        ).fetchone()
        if session_row is None:
            raise _error(404, "Sesiunea de tracking pentru test nu exista.")

        now_iso = utc_now_iso()
        connection.execute(
            """
            UPDATE test_sessions
            SET last_activity_at = ?,
                status = 'in_progress',
                current_question_index = ?,
                answered_count = ?,
                progress_percent = ?
            WHERE id = ?
            """,
            (
                now_iso,
                question_index,
                answered_count,
                progress_percent,
                test_session_id,
            ),
        )
        connection.execute(
            """
            INSERT INTO test_events (
                student_id, session_id, test_session_id, event_type, event_data, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                student_id,
                session_id,
                test_session_id,
                event_type,
                json.dumps(
                    {
                        "question_index": question_index,
                        "selected_answer": selected_answer,
                        "is_correct": is_correct,
                        "answered_count": answered_count,
                        "total_questions": total_questions,
                    },
                    ensure_ascii=False,
                ),
                now_iso,
            ),
        )
        connection.commit()

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

    with get_connection() as connection:
        session_row = connection.execute(
            """
            SELECT *
            FROM test_sessions
            WHERE id = ? AND student_id = ? AND session_id = ?
            """,
            (test_session_id, student_id, session_id),
        ).fetchone()
        if session_row is None:
            raise _error(404, "Sesiunea de tracking pentru test nu exista.")

        now_iso = utc_now_iso()
        connection.execute(
            """
            UPDATE test_sessions
            SET completed_at = ?,
                last_activity_at = ?,
                status = 'completed',
                score = ?,
                correct_answers = ?,
                wrong_answers = ?,
                total_questions = ?,
                progress_percent = 100,
                answered_count = ?
            WHERE id = ?
            """,
            (
                now_iso,
                now_iso,
                score,
                correct_answers,
                wrong_answers,
                total_questions,
                min(total_questions, max(correct_answers + wrong_answers, 0)),
                test_session_id,
            ),
        )
        connection.execute(
            """
            INSERT INTO test_events (
                student_id, session_id, test_session_id, event_type, event_data, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                student_id,
                session_id,
                test_session_id,
                "test_submitted",
                json.dumps(
                    {
                        "score": score,
                        "correct_answers": correct_answers,
                        "wrong_answers": wrong_answers,
                        "total_questions": total_questions,
                    },
                    ensure_ascii=False,
                ),
                now_iso,
            ),
        )
        connection.commit()

    return {"ok": True, "test_session_id": test_session_id}


def _serialize_recent_event(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "event_type": row["event_type"],
        "event_label": _event_label(row["event_type"]),
        "student_name": row["student_name"] or "Vizitator",
        "test_title": row["test_title"] or "",
        "created_at": row["created_at"],
        "event_data": _decode_json(row["event_data"], {}),
    }


def _serialize_tracked_session(row: sqlite3.Row) -> dict:
    status = _derived_status(row["status"], row["last_activity_at"])
    return {
        "id": row["id"],
        "student_id": row["student_id"],
        "session_id": row["session_id"],
        "test_id": row["test_id"],
        "test_title": row["test_title"],
        "started_at": row["started_at"],
        "last_activity_at": row["last_activity_at"],
        "completed_at": row["completed_at"] or "",
        "status": status,
        "status_label": _status_label(status),
        "score": row["score"],
        "correct_answers": row["correct_answers"],
        "wrong_answers": row["wrong_answers"],
        "total_questions": row["total_questions"],
        "current_question_index": row["current_question_index"] or 0,
        "answered_count": row["answered_count"] or 0,
        "progress_percent": row["progress_percent"] or 0,
    }


def get_admin_activity_overview(current_user: dict) -> dict:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate vedea overview-ul de tracking.")

    active_cutoff = (datetime.now(timezone.utc) - timedelta(minutes=ABANDONED_AFTER_MINUTES)).isoformat()
    with get_connection() as connection:
        total_activations = connection.execute(
            "SELECT COUNT(*) AS total FROM link_activations"
        ).fetchone()["total"]
        identified_students = connection.execute(
            "SELECT COUNT(*) AS total FROM students"
        ).fetchone()["total"]
        active_test_sessions = connection.execute(
            """
            SELECT COUNT(*) AS total
            FROM test_sessions
            WHERE status IN ('started', 'in_progress') AND last_activity_at >= ?
            """,
            (active_cutoff,),
        ).fetchone()["total"]
        completed_tests = connection.execute(
            "SELECT COUNT(*) AS total FROM test_sessions WHERE status = 'completed'"
        ).fetchone()["total"]
        recent_rows = connection.execute(
            """
            SELECT e.id, e.event_type, e.event_data, e.created_at,
                   s.name AS student_name,
                   ts.test_title
            FROM test_events e
            LEFT JOIN students s ON s.id = e.student_id
            LEFT JOIN test_sessions ts ON ts.id = e.test_session_id
            ORDER BY e.created_at DESC, e.id DESC
            LIMIT 16
            """
        ).fetchall()

    return {
        "total_activations": total_activations,
        "identified_students": identified_students,
        "active_test_sessions": active_test_sessions,
        "completed_tests": completed_tests,
        "recent_activity": [_serialize_recent_event(row) for row in recent_rows],
        "generated_at": utc_now_iso(),
    }


def get_admin_activity_students(current_user: dict) -> list[dict]:
    if current_user["role"] != "admin":
        raise _error(403, "Doar adminul poate vedea elevii urmariti.")

    with get_connection() as connection:
        student_rows = connection.execute(
            "SELECT * FROM students ORDER BY created_at DESC, id DESC"
        ).fetchall()

        students = []
        for row in student_rows:
            latest_activation = connection.execute(
                """
                SELECT *
                FROM link_activations
                WHERE student_id = ?
                ORDER BY activated_at DESC, id DESC
                LIMIT 1
                """,
                (row["id"],),
            ).fetchone()
            latest_session = connection.execute(
                """
                SELECT *
                FROM test_sessions
                WHERE student_id = ?
                ORDER BY last_activity_at DESC, id DESC
                LIMIT 1
                """,
                (row["id"],),
            ).fetchone()
            tests_started = connection.execute(
                "SELECT COUNT(*) AS total FROM test_sessions WHERE student_id = ?",
                (row["id"],),
            ).fetchone()["total"]
            tests_completed = connection.execute(
                """
                SELECT COUNT(*) AS total
                FROM test_sessions
                WHERE student_id = ? AND status = 'completed'
                """,
                (row["id"],),
            ).fetchone()["total"]

            serialized_session = _serialize_tracked_session(latest_session) if latest_session else None
            last_activity_at = (
                serialized_session["last_activity_at"]
                if serialized_session
                else (latest_activation["activated_at"] if latest_activation else row["created_at"])
            )
            students.append(
                {
                    **_serialize_student(row),
                    "device_type": latest_activation["device_type"] if latest_activation else "",
                    "last_activity_at": last_activity_at,
                    "latest_status": serialized_session["status"] if serialized_session else "started",
                    "latest_status_label": serialized_session["status_label"] if serialized_session else "Pornit",
                    "tests_started": tests_started,
                    "tests_completed": tests_completed,
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

    with get_connection() as connection:
        student_row = connection.execute(
            "SELECT * FROM students WHERE id = ?",
            (student_id,),
        ).fetchone()
        if student_row is None:
            raise _error(404, "Elevul selectat nu exista.")

        activation_rows = connection.execute(
            """
            SELECT *
            FROM link_activations
            WHERE student_id = ?
            ORDER BY activated_at DESC, id DESC
            """,
            (student_id,),
        ).fetchall()
        session_rows = connection.execute(
            """
            SELECT *
            FROM test_sessions
            WHERE student_id = ?
            ORDER BY last_activity_at DESC, id DESC
            """,
            (student_id,),
        ).fetchall()
        event_rows = connection.execute(
            """
            SELECT e.*, ts.test_title
            FROM test_events e
            LEFT JOIN test_sessions ts ON ts.id = e.test_session_id
            WHERE e.student_id = ?
            ORDER BY e.created_at DESC, e.id DESC
            LIMIT 100
            """,
            (student_id,),
        ).fetchall()

    return {
        "student": _serialize_student(student_row),
        "activations": [
            {
                "id": row["id"],
                "session_id": row["session_id"],
                "public_link_code": row["public_link_code"],
                "activated_at": row["activated_at"],
                "device_type": row["device_type"] or "",
                "browser": row["browser"] or "",
                "os": row["os"] or "",
                "is_mobile": bool(row["is_mobile"]),
            }
            for row in activation_rows
        ],
        "test_sessions": [_serialize_tracked_session(row) for row in session_rows],
        "event_timeline": [
            {
                "id": row["id"],
                "event_type": row["event_type"],
                "event_label": _event_label(row["event_type"]),
                "test_title": row["test_title"] or "",
                "created_at": row["created_at"],
                "event_data": _decode_json(row["event_data"], {}),
            }
            for row in event_rows
        ],
    }
