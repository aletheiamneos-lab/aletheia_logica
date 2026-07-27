from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import uuid
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.supabase_service import get_server_supabase  # noqa: E402

DB_PATH = BACKEND_ROOT / "data" / "logic_app.db"
QUESTION_NAMESPACE = uuid.UUID("e7741c8e-b364-4e20-a2e0-555ae954caa8")


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def decode_json(value, default):
    if value is None or value == "":
        return default
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return default


def question_uuid(legacy_id: str) -> str:
    try:
        return str(uuid.UUID(str(legacy_id)))
    except ValueError:
        return str(uuid.uuid5(QUESTION_NAMESPACE, str(legacy_id)))


def lesson_structure(question_rows: list[dict]) -> list[dict]:
    result = []
    for lesson_number in range(1, 6):
        rows = [row for row in question_rows if int(row["lesson_number"]) == lesson_number]
        result.append(
            {
                "lesson_number": lesson_number,
                "lessonNumber": lesson_number,
                "lesson_label": rows[0]["lesson_label"] if rows else f"Lectia {lesson_number}",
                "lessonLabel": rows[0]["lesson_label"] if rows else f"Lectia {lesson_number}",
                "question_count": len(rows),
                "questionCount": len(rows),
                "expected_count": 5,
                "expectedCount": 5,
                "is_complete": len(rows) == 5,
                "isComplete": len(rows) == 5,
            }
        )
    return result


def split_name(name: str) -> tuple[str, str]:
    parts = " ".join(str(name or "").split()).split()
    if len(parts) < 2:
        return (parts[0] if parts else "", "")
    return " ".join(parts[:-1]), parts[-1]


def remap_snapshot(snapshot: list, question_ids: dict[str, str], test_id: str) -> list[dict]:
    remapped = []
    for entry in snapshot:
        if not isinstance(entry, dict):
            continue
        copy = dict(entry)
        old_id = str(copy.get("id") or "")
        copy["id"] = question_ids.get(old_id, question_uuid(old_id))
        copy["test_id"] = test_id
        copy["testId"] = test_id
        remapped.append(copy)
    return remapped


def collect_payloads() -> tuple[list[dict], list[dict], list[dict]]:
    with get_connection() as connection:
        test_rows = [dict(row) for row in connection.execute("SELECT * FROM integrated_tests").fetchall()]
        question_rows = [
            dict(row)
            for row in connection.execute(
                "SELECT * FROM integrated_test_questions ORDER BY test_id, order_in_test"
            ).fetchall()
        ]
        attempt_rows = [
            dict(row)
            for row in connection.execute(
                "SELECT * FROM integrated_attempts ORDER BY started_at"
            ).fetchall()
        ]
        session_emails = {
            row["id"]: (row["email"] or "").strip().casefold()
            for row in connection.execute("SELECT id, email FROM auth_sessions").fetchall()
        }
        student_emails = {
            " ".join((row["name"] or "").split()).casefold(): (row["email"] or "").strip().casefold()
            for row in connection.execute(
                "SELECT name, email FROM students WHERE COALESCE(TRIM(email), '') <> ''"
            ).fetchall()
        }

    questions_by_test: dict[str, list[dict]] = {}
    question_ids = {str(row["id"]): question_uuid(str(row["id"])) for row in question_rows}
    supabase_questions = []
    for row in question_rows:
        test_id = str(row["test_id"])
        payload = {
            "id": question_ids[str(row["id"])],
            "test_id": test_id,
            "lesson_number": int(row["lesson_number"]),
            "lesson_label": row["lesson_label"],
            "text": row["text"],
            "options": decode_json(row.get("options_json"), []),
            "correct_option_index": int(row["correct_option_index"]),
            "explanation": row.get("explanation") or row.get("justification") or "",
            "difficulty": row.get("difficulty") or "",
            "order_in_lesson": int(row["order_in_lesson"]),
            "order_in_test": int(row["order_in_test"]),
            "created_at": row.get("created_at"),
        }
        # created_at was not present in older SQLite schemas.
        if not payload["created_at"]:
            payload.pop("created_at")
        supabase_questions.append(payload)
        questions_by_test.setdefault(test_id, []).append(payload)

    supabase_tests = []
    valid_test_ids = set()
    for row in test_rows:
        test_id = str(row["id"])
        valid_test_ids.add(test_id)
        questions = questions_by_test.get(test_id, [])
        supabase_tests.append(
            {
                "id": test_id,
                "title": row["title"],
                "slug": row["slug"],
                "description": row["description"],
                "duration_minutes": int(row["duration_minutes"]),
                "difficulty_label": row.get("difficulty_label") or "necalibrat",
                "is_active": bool(row["is_active"]) and bool(row.get("is_visible_to_students", 1)),
                "is_draft": bool(row["is_draft"]),
                "total_questions": len(questions),
                "lesson_structure": lesson_structure(questions),
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
        )

    supabase_attempts = []
    for row in attempt_rows:
        test_id = str(row["test_id"])
        if test_id not in valid_test_ids:
            continue
        display_name = row.get("student_display_name") or "Elev"
        email = session_emails.get(str(row.get("session_id") or ""), "")
        email = email or student_emails.get(" ".join(display_name.split()).casefold(), "")
        role = "admin" if row.get("role") in {"admin", "teacher"} else "student"
        if not email:
            email = (
                f"admin-preview-{row['id']}@local.invalid"
                if role == "admin"
                else f"legacy-{row['id']}@migration.invalid"
            )
        raw_answers = decode_json(row.get("answers_json"), {})
        mapped_answers = {
            question_ids.get(str(question_id), question_uuid(str(question_id))): selected
            for question_id, selected in raw_answers.items()
        }
        snapshot = remap_snapshot(
            decode_json(row.get("question_snapshot_json"), []),
            question_ids,
            test_id,
        )
        if not snapshot:
            snapshot = questions_by_test.get(test_id, [])
        first_name = row.get("student_first_name") or split_name(display_name)[0]
        last_name = row.get("student_last_name") or split_name(display_name)[1]
        meta = {
            "session_id": row.get("session_id") or "",
            "role": role,
            "student_first_name": first_name,
            "student_last_name": last_name,
            "student_key": row.get("student_key") or "",
            "duration_seconds": int(row.get("duration_seconds") or 0),
            "current_question_index": int(row.get("current_question_index") or 0),
            "unique_code": row.get("unique_code") or str(row["id"]).replace("-", "")[:10].upper(),
            "question_snapshot": snapshot,
            "progress_events": [],
        }
        total_questions = len(snapshot)
        correct_count = int(row.get("correct_count") or 0)
        score_total = round((correct_count / total_questions) * 100) if total_questions else 0
        status = "graded" if row.get("status") in {"graded", "finalized"} else row.get("status") or "in_progress"
        supabase_attempts.append(
            {
                "id": str(row["id"]),
                "test_id": test_id,
                "student_email": email,
                "student_name": display_name,
                "status": status,
                "started_at": row["started_at"],
                "submitted_at": row.get("submitted_at"),
                "score_total": score_total if status != "in_progress" else None,
                "scores_per_lesson": decode_json(row.get("lesson_scores_json"), {}),
                "raw_answers": {"answers": mapped_answers, "_meta": meta},
                "teacher_comment": row.get("teacher_comment") or "",
                "pdf_generated_at": row.get("submitted_at") if row.get("report_pdf_path") else None,
                "created_at": row["created_at"] if row.get("created_at") else row["started_at"],
                "updated_at": row["updated_at"],
            }
        )
    return supabase_tests, supabase_questions, supabase_attempts


def batches(rows: list[dict], size: int = 100):
    for index in range(0, len(rows), size):
        yield rows[index : index + size]


def migrate(apply_changes: bool) -> None:
    tests, questions, attempts = collect_payloads()
    print(f"SQLite: {DB_PATH}")
    print(f"Teste pregatite: {len(tests)}")
    print(f"Intrebari pregatite: {len(questions)}")
    print(f"Incercari pregatite: {len(attempts)}")
    if not apply_changes:
        print("DRY RUN: nu s-a scris nimic in Supabase.")
        print("Ruleaza din nou cu --apply pentru transfer.")
        return

    client = get_server_supabase()
    for batch in batches(tests):
        client.table("tests").upsert(batch, on_conflict="id").execute()
    for batch in batches(questions):
        client.table("questions").upsert(batch, on_conflict="id").execute()
    for batch in batches(attempts):
        client.table("attempts").upsert(batch, on_conflict="id").execute()
    print("Migrare finalizata cu succes.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Transfera Testele integrate din SQLite in tabelele Supabase existente."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Scrie efectiv datele. Fara acest flag scriptul ruleaza doar verificarea.",
    )
    args = parser.parse_args()
    migrate(args.apply)
