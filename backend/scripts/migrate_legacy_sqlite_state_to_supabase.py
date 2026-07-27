from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.supabase_service import get_server_supabase  # noqa: E402

DB_PATH = BACKEND_ROOT / "data" / "logic_app.db"


def _table_exists(connection: sqlite3.Connection, table_name: str) -> bool:
    return (
        connection.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
            (table_name,),
        ).fetchone()
        is not None
    )


def _rows(connection: sqlite3.Connection, table_name: str) -> list[dict]:
    if not _table_exists(connection, table_name):
        return []
    return [dict(row) for row in connection.execute(f'SELECT * FROM "{table_name}"').fetchall()]


def _decode_json(value) -> dict | list:
    if isinstance(value, (dict, list)):
        return value
    if value in (None, ""):
        return {}
    try:
        decoded = json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return {}
    return decoded if isinstance(decoded, (dict, list)) else {}


def _identity_key(name: str, class_name: str, email: str) -> str:
    normalized = (
        " ".join(str(name or "").strip().split()).casefold(),
        " ".join(str(class_name or "").strip().split()).casefold(),
        " ".join(str(email or "").strip().split()).casefold(),
    )
    return hashlib.sha256("\x1f".join(normalized).encode("utf-8")).hexdigest()


def _batches(rows: list[dict], size: int = 100):
    for index in range(0, len(rows), size):
        yield rows[index : index + size]


def collect_payloads(database_path: Path) -> dict[str, list[dict]]:
    if not database_path.exists():
        raise FileNotFoundError(f"Fisierul SQLite nu exista: {database_path}")

    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    try:
        settings = [
            {
                "key": row["key"],
                "value": row["value"],
                "updated_at": row["updated_at"],
            }
            for row in _rows(connection, "app_settings")
        ]
        sessions = [
            {
                "id": row["id"],
                "role": "admin" if row["role"] in {"admin", "teacher"} else "student",
                "first_name": row.get("first_name") or "",
                "last_name": row.get("last_name") or "",
                "display_name": row["display_name"],
                "initials": row["initials"],
                "email": (row.get("email") or "").strip().casefold(),
                "created_at": row["created_at"],
                "last_seen_at": row["last_seen_at"],
                "is_active": bool(row["is_active"]),
            }
            for row in _rows(connection, "auth_sessions")
        ]
        progress = [
            {
                "id": int(row["id"]),
                "owner_key": "legacy-global",
                "session_id": None,
                "student_email": "",
                "exercise_id": int(row["exercise_id"]),
                "was_correct": bool(row["was_correct"]),
                "answered_at": row["answered_at"],
            }
            for row in _rows(connection, "progress")
        ]
        students = [
            {
                "id": int(row["id"]),
                "identity_key": _identity_key(
                    row["name"],
                    row.get("class_name") or "",
                    row.get("email") or "",
                ),
                "name": row["name"],
                "class_name": row.get("class_name") or "",
                "email": row.get("email") or "",
                "created_at": row["created_at"],
            }
            for row in _rows(connection, "students")
        ]
        activations = [
            {
                "id": int(row["id"]),
                "student_id": int(row["student_id"]) if row.get("student_id") is not None else None,
                "session_id": row["session_id"],
                "public_link_code": row["public_link_code"],
                "activated_at": row["activated_at"],
                "ip_address": row.get("ip_address") or "",
                "user_agent": row.get("user_agent") or "",
                "device_type": row.get("device_type") or "",
                "browser": row.get("browser") or "",
                "os": row.get("os") or "",
                "is_mobile": bool(row.get("is_mobile")),
            }
            for row in _rows(connection, "link_activations")
        ]
        test_sessions = [
            {
                "id": int(row["id"]),
                "student_id": int(row["student_id"]),
                "session_id": row["session_id"],
                "test_id": row["test_id"],
                "test_title": row["test_title"],
                "started_at": row["started_at"],
                "last_activity_at": row["last_activity_at"],
                "completed_at": row.get("completed_at"),
                "status": (
                    row["status"]
                    if row["status"] in {"started", "in_progress", "completed", "abandoned"}
                    else "started"
                ),
                "score": row.get("score"),
                "correct_answers": row.get("correct_answers"),
                "wrong_answers": row.get("wrong_answers"),
                "total_questions": row.get("total_questions"),
                "current_question_index": int(row.get("current_question_index") or 0),
                "answered_count": int(row.get("answered_count") or 0),
                "progress_percent": max(0, min(100, int(row.get("progress_percent") or 0))),
            }
            for row in _rows(connection, "test_sessions")
        ]
        events = [
            {
                "id": int(row["id"]),
                "student_id": int(row["student_id"]) if row.get("student_id") is not None else None,
                "session_id": row["session_id"],
                "test_session_id": (
                    int(row["test_session_id"]) if row.get("test_session_id") is not None else None
                ),
                "event_type": row["event_type"],
                "event_data": _decode_json(row.get("event_data")),
                "created_at": row["created_at"],
            }
            for row in _rows(connection, "test_events")
        ]
    finally:
        connection.close()

    return {
        "app_settings": settings,
        "auth_sessions": sessions,
        "learning_progress": progress,
        "tracked_students": students,
        "activity_link_activations": activations,
        "activity_test_sessions": test_sessions,
        "activity_events": events,
    }


def migrate(database_path: Path, apply_changes: bool) -> None:
    payloads = collect_payloads(database_path)
    print(f"SQLite: {database_path.resolve()}")
    for table_name, rows in payloads.items():
        print(f"{table_name}: {len(rows)} randuri pregatite")

    if not apply_changes:
        print("DRY RUN: nu s-a scris nimic in Supabase.")
        print("Ruleaza din nou cu --apply dupa executarea migrarii SQL 20260728.")
        return

    client = get_server_supabase()
    for table_name, rows in payloads.items():
        for batch in _batches(rows):
            client.table(table_name).upsert(batch, on_conflict="id" if "id" in batch[0] else "key").execute()
    client.rpc("sync_legacy_identity_sequences").execute()
    print("Migrarea datelor persistente legacy s-a incheiat cu succes.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=(
            "Transfera setarile, sesiunile, progresul si tracking-ul public "
            "din SQLite in Supabase."
        )
    )
    parser.add_argument(
        "--database",
        type=Path,
        default=DB_PATH,
        help=f"Calea bazei SQLite (implicit: {DB_PATH}).",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Scrie efectiv datele. Fara acest flag ruleaza doar inventarierea.",
    )
    args = parser.parse_args()
    migrate(args.database, args.apply)
