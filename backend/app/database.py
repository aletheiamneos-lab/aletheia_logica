from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

from .integrated_test_seed_import import seed_bundled_integrated_tests
from .seed_content import EXERCISES, LESSONS

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "logic_app.db"

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    short_text TEXT NOT NULL,
    formal_text TEXT NOT NULL,
    example_text TEXT NOT NULL,
    topic TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY,
    lesson_id INTEGER NOT NULL,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    type TEXT NOT NULL,
    question TEXT NOT NULL,
    options_json TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    incorrect_explanations_json TEXT,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);

CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id INTEGER NOT NULL,
    was_correct INTEGER NOT NULL,
    answered_at TEXT NOT NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT NOT NULL,
    initials TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS integrated_tests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    difficulty_label TEXT NOT NULL DEFAULT 'necalibrat',
    is_active INTEGER NOT NULL DEFAULT 0,
    is_draft INTEGER NOT NULL DEFAULT 1,
    schema_version TEXT NOT NULL DEFAULT '1.0',
    subject TEXT NOT NULL DEFAULT 'Logica',
    level TEXT NOT NULL DEFAULT 'bac_admitere',
    language TEXT NOT NULL DEFAULT 'ro',
    categories_json TEXT NOT NULL DEFAULT '[]',
    report_template_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS integrated_test_questions (
    id TEXT PRIMARY KEY,
    test_id TEXT NOT NULL,
    lesson_number INTEGER NOT NULL,
    lesson_label TEXT NOT NULL,
    text TEXT NOT NULL,
    options_json TEXT NOT NULL,
    correct_option_index INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    answer_type TEXT NOT NULL DEFAULT 'single',
    justification TEXT,
    source_lesson TEXT,
    tags_json TEXT NOT NULL DEFAULT '[]',
    explanation TEXT,
    difficulty TEXT,
    order_in_lesson INTEGER NOT NULL,
    order_in_test INTEGER NOT NULL,
    FOREIGN KEY (test_id) REFERENCES integrated_tests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS integrated_attempts (
    id TEXT PRIMARY KEY,
    test_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    student_first_name TEXT,
    student_last_name TEXT,
    student_display_name TEXT NOT NULL,
    student_key TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TEXT NOT NULL,
    submitted_at TEXT,
    updated_at TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    current_question_index INTEGER NOT NULL DEFAULT 0,
    answers_json TEXT NOT NULL DEFAULT '{}',
    question_snapshot_json TEXT NOT NULL DEFAULT '[]',
    answered_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    lesson_scores_json TEXT NOT NULL DEFAULT '{}',
    teacher_comment TEXT NOT NULL DEFAULT '',
    report_json_path TEXT,
    report_html_path TEXT,
    report_pdf_path TEXT,
    unique_code TEXT NOT NULL,
    FOREIGN KEY (test_id) REFERENCES integrated_tests(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES auth_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS integrated_reports (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL UNIQUE,
    test_id TEXT NOT NULL,
    test_slug TEXT NOT NULL,
    student_name TEXT NOT NULL,
    test_title TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    score_percent INTEGER NOT NULL DEFAULT 0,
    lesson_radar_json TEXT NOT NULL DEFAULT '[]',
    teacher_comment TEXT NOT NULL DEFAULT '',
    report_json_path TEXT NOT NULL,
    report_html_path TEXT NOT NULL,
    report_pdf_path TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (attempt_id) REFERENCES integrated_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES integrated_tests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS integrated_attempt_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    answered_count INTEGER NOT NULL,
    current_question_index INTEGER NOT NULL,
    elapsed_seconds INTEGER NOT NULL,
    recorded_at TEXT NOT NULL,
    FOREIGN KEY (attempt_id) REFERENCES integrated_attempts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS integrated_student_profiles (
    student_key TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    marker_label TEXT,
    accent_color TEXT,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    class_name TEXT,
    email TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS link_activations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    session_id TEXT NOT NULL,
    public_link_code TEXT NOT NULL,
    activated_at TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    is_mobile INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS test_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,
    test_id TEXT NOT NULL,
    test_title TEXT NOT NULL,
    started_at TEXT NOT NULL,
    last_activity_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL,
    score REAL,
    correct_answers INTEGER,
    wrong_answers INTEGER,
    total_questions INTEGER,
    current_question_index INTEGER NOT NULL DEFAULT 0,
    answered_count INTEGER NOT NULL DEFAULT 0,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    session_id TEXT NOT NULL,
    test_session_id INTEGER,
    event_type TEXT NOT NULL,
    event_data TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    FOREIGN KEY (test_session_id) REFERENCES test_sessions(id) ON DELETE CASCADE
);
"""


def _normalize_answer(value: str) -> str:
    return value.strip().casefold()


def _parse_iso_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)

    return parsed


def _day_label_from_iso(day_key: str) -> str:
    parsed = _parse_iso_timestamp(f"{day_key}T00:00:00+00:00")
    if parsed is None:
        return day_key

    month_labels = [
        "ian",
        "feb",
        "mar",
        "apr",
        "mai",
        "iun",
        "iul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
    ]
    return f"{parsed.day} {month_labels[parsed.month - 1]}"


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def _ensure_column(
    connection: sqlite3.Connection,
    table_name: str,
    column_name: str,
    definition: str,
) -> bool:
    existing_columns = {
        row["name"]
        for row in connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    }

    if column_name not in existing_columns:
        connection.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}")
        return True

    return False


def initialize_database(reset: bool = False) -> Path:
    if reset and DB_PATH.exists():
        DB_PATH.unlink()

    with get_connection() as connection:
        connection.executescript(SCHEMA_SQL)
        _ensure_column(connection, "exercises", "incorrect_explanations_json", "TEXT")
        _ensure_column(
            connection,
            "integrated_tests",
            "difficulty_label",
            "TEXT NOT NULL DEFAULT 'necalibrat'",
        )
        visibility_column_added = _ensure_column(
            connection,
            "integrated_tests",
            "is_visible_to_students",
            "INTEGER NOT NULL DEFAULT 0",
        )
        _ensure_column(
            connection,
            "integrated_attempts",
            "teacher_comment",
            "TEXT NOT NULL DEFAULT ''",
        )
        _ensure_column(
            connection,
            "integrated_attempts",
            "question_snapshot_json",
            "TEXT NOT NULL DEFAULT '[]'",
        )
        if visibility_column_added:
            connection.execute(
                """
                UPDATE integrated_tests
                SET is_visible_to_students = CASE
                    WHEN is_active = 1 AND is_draft = 0 THEN 1
                    ELSE 0
                END
                """
            )
        connection.execute("UPDATE auth_sessions SET role = 'admin' WHERE role = 'teacher'")
        connection.execute("UPDATE integrated_attempts SET role = 'admin' WHERE role = 'teacher'")
        connection.execute("UPDATE integrated_attempts SET status = 'graded' WHERE status = 'finalized'")
        _ensure_column(
            connection,
            "test_sessions",
            "current_question_index",
            "INTEGER NOT NULL DEFAULT 0",
        )
        _ensure_column(
            connection,
            "test_sessions",
            "answered_count",
            "INTEGER NOT NULL DEFAULT 0",
        )
        _ensure_column(
            connection,
            "test_sessions",
            "progress_percent",
            "INTEGER NOT NULL DEFAULT 0",
        )
        connection.commit()

    seed_database()
    return DB_PATH


def _delete_missing_rows(
    connection: sqlite3.Connection,
    table_name: str,
    column_name: str,
    valid_ids: set[int],
) -> None:
    if not valid_ids:
        connection.execute(f"DELETE FROM {table_name}")
        return

    placeholders = ",".join("?" for _ in valid_ids)
    connection.execute(
        f"DELETE FROM {table_name} WHERE {column_name} NOT IN ({placeholders})",
        tuple(sorted(valid_ids)),
    )


def seed_database() -> None:
    lesson_ids = {lesson["id"] for lesson in LESSONS}
    exercise_ids = {exercise["id"] for exercise in EXERCISES}
    now_iso = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        _ensure_column(connection, "exercises", "incorrect_explanations_json", "TEXT")
        _ensure_column(
            connection,
            "integrated_tests",
            "difficulty_label",
            "TEXT NOT NULL DEFAULT 'necalibrat'",
        )
        _ensure_column(
            connection,
            "integrated_tests",
            "schema_version",
            "TEXT NOT NULL DEFAULT '1.0'",
        )
        _ensure_column(
            connection,
            "integrated_tests",
            "subject",
            "TEXT NOT NULL DEFAULT 'Logica'",
        )
        _ensure_column(
            connection,
            "integrated_tests",
            "level",
            "TEXT NOT NULL DEFAULT 'bac_admitere'",
        )
        _ensure_column(
            connection,
            "integrated_tests",
            "language",
            "TEXT NOT NULL DEFAULT 'ro'",
        )
        _ensure_column(
            connection,
            "integrated_tests",
            "categories_json",
            "TEXT NOT NULL DEFAULT '[]'",
        )
        _ensure_column(
            connection,
            "integrated_tests",
            "report_template_json",
            "TEXT NOT NULL DEFAULT '{}'",
        )
        visibility_column_added = _ensure_column(
            connection,
            "integrated_tests",
            "is_visible_to_students",
            "INTEGER NOT NULL DEFAULT 0",
        )
        _ensure_column(
            connection,
            "integrated_test_questions",
            "category",
            "TEXT NOT NULL DEFAULT ''",
        )
        _ensure_column(
            connection,
            "integrated_test_questions",
            "answer_type",
            "TEXT NOT NULL DEFAULT 'single'",
        )
        _ensure_column(
            connection,
            "integrated_test_questions",
            "justification",
            "TEXT",
        )
        _ensure_column(
            connection,
            "integrated_test_questions",
            "source_lesson",
            "TEXT",
        )
        _ensure_column(
            connection,
            "integrated_test_questions",
            "tags_json",
            "TEXT NOT NULL DEFAULT '[]'",
        )
        _ensure_column(
            connection,
            "integrated_attempts",
            "teacher_comment",
            "TEXT NOT NULL DEFAULT ''",
        )
        _ensure_column(
            connection,
            "integrated_attempts",
            "question_snapshot_json",
            "TEXT NOT NULL DEFAULT '[]'",
        )
        if visibility_column_added:
            connection.execute(
                """
                UPDATE integrated_tests
                SET is_visible_to_students = CASE
                    WHEN is_active = 1 AND is_draft = 0 THEN 1
                    ELSE 0
                END
                """
            )
        connection.execute("UPDATE auth_sessions SET role = 'admin' WHERE role = 'teacher'")
        connection.execute("UPDATE integrated_attempts SET role = 'admin' WHERE role = 'teacher'")
        connection.execute("UPDATE integrated_attempts SET status = 'graded' WHERE status = 'finalized'")
        _ensure_column(
            connection,
            "test_sessions",
            "current_question_index",
            "INTEGER NOT NULL DEFAULT 0",
        )
        _ensure_column(
            connection,
            "test_sessions",
            "answered_count",
            "INTEGER NOT NULL DEFAULT 0",
        )
        _ensure_column(
            connection,
            "test_sessions",
            "progress_percent",
            "INTEGER NOT NULL DEFAULT 0",
        )
        connection.execute(
            """
            UPDATE integrated_tests
            SET schema_version = COALESCE(NULLIF(schema_version, ''), '1.0'),
                subject = COALESCE(NULLIF(subject, ''), 'Logica'),
                level = COALESCE(NULLIF(level, ''), 'bac_admitere'),
                language = COALESCE(NULLIF(language, ''), 'ro'),
                categories_json = CASE
                    WHEN categories_json IS NULL OR categories_json = '' OR categories_json = '[]'
                        THEN '["Definitii","Clasificare","Propozitii categorice","Silogisme si rationamente","Erori de rationament"]'
                    ELSE categories_json
                END,
                report_template_json = CASE
                    WHEN report_template_json IS NULL OR report_template_json = '' OR report_template_json = '{}'
                        THEN '{"include_score":true,"include_category_breakdown":true,"include_correct_answers":true,"include_justifications":true,"include_student_answers":true,"include_recommendations":true}'
                    ELSE report_template_json
                END
            """
        )
        connection.execute(
            """
            UPDATE integrated_test_questions
            SET category = CASE
                    WHEN category IS NULL OR category = '' THEN COALESCE(NULLIF(source_lesson, ''), lesson_label)
                    ELSE category
                END,
                answer_type = COALESCE(NULLIF(answer_type, ''), 'single'),
                source_lesson = COALESCE(NULLIF(source_lesson, ''), lesson_label),
                tags_json = CASE
                    WHEN tags_json IS NULL OR tags_json = '' THEN '[]'
                    ELSE tags_json
                END,
                justification = COALESCE(justification, ''),
                explanation = COALESCE(explanation, '')
            """
        )

        _delete_missing_rows(connection, "progress", "exercise_id", exercise_ids)
        _delete_missing_rows(connection, "exercises", "id", exercise_ids)
        _delete_missing_rows(connection, "lessons", "id", lesson_ids)

        connection.executemany(
            """
            INSERT INTO lessons (id, title, short_text, formal_text, example_text, topic)
            VALUES (:id, :title, :short_text, :formal_text, :example_text, :topic)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                short_text = excluded.short_text,
                formal_text = excluded.formal_text,
                example_text = excluded.example_text,
                topic = excluded.topic
            """,
            LESSONS,
        )

        connection.executemany(
            """
            INSERT INTO exercises (
                id, lesson_id, topic, difficulty, type, question,
                options_json, correct_answer, explanation, incorrect_explanations_json
            )
            VALUES (
                :id, :lesson_id, :topic, :difficulty, :type, :question,
                :options_json, :correct_answer, :explanation, :incorrect_explanations_json
            )
            ON CONFLICT(id) DO UPDATE SET
                lesson_id = excluded.lesson_id,
                topic = excluded.topic,
                difficulty = excluded.difficulty,
                type = excluded.type,
                question = excluded.question,
                options_json = excluded.options_json,
                correct_answer = excluded.correct_answer,
                explanation = excluded.explanation,
                incorrect_explanations_json = excluded.incorrect_explanations_json
            """,
            [
                {
                    **exercise,
                    "options_json": json.dumps(exercise["options"], ensure_ascii=False),
                    "incorrect_explanations_json": json.dumps(
                        exercise.get("incorrect_explanations", {}),
                        ensure_ascii=False,
                    ),
                }
                for exercise in EXERCISES
            ],
        )

        seed_bundled_integrated_tests(connection, now_iso)

        connection.commit()


def _serialize_lesson(row: sqlite3.Row) -> dict:
    return dict(row)


def _serialize_exercise(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "lesson_id": row["lesson_id"],
        "topic": row["topic"],
        "difficulty": row["difficulty"],
        "type": row["type"],
        "question": row["question"],
        "options": json.loads(row["options_json"]),
    }


def list_lessons() -> list[dict]:
    with get_connection() as connection:
        rows = connection.execute("SELECT * FROM lessons ORDER BY id").fetchall()
    return [_serialize_lesson(row) for row in rows]


def get_lesson(lesson_id: int) -> dict:
    with get_connection() as connection:
        row = connection.execute("SELECT * FROM lessons WHERE id = ?", (lesson_id,)).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Lectia nu a fost gasita.")

    return _serialize_lesson(row)


def list_exercises() -> list[dict]:
    with get_connection() as connection:
        rows = connection.execute("SELECT * FROM exercises ORDER BY lesson_id, id").fetchall()
    return [_serialize_exercise(row) for row in rows]


def list_exercises_by_lesson(lesson_id: int) -> list[dict]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM exercises WHERE lesson_id = ? ORDER BY id",
            (lesson_id,),
        ).fetchall()
    return [_serialize_exercise(row) for row in rows]


def _decode_incorrect_explanations(raw_value: str | None) -> dict[str, str]:
    if not raw_value:
        return {}

    try:
        decoded = json.loads(raw_value)
    except json.JSONDecodeError:
        return {}

    return decoded if isinstance(decoded, dict) else {}


def _feedback_explanation(row: sqlite3.Row, answer: str, was_correct: bool) -> str:
    if was_correct:
        return row["explanation"]

    incorrect_explanations = _decode_incorrect_explanations(row["incorrect_explanations_json"])
    normalized_map = {
        _normalize_answer(option): message for option, message in incorrect_explanations.items()
    }
    return normalized_map.get(
        _normalize_answer(answer),
        row["explanation"] or "Raspuns gresit. Reciteste explicatia si incearca din nou.",
    )


def submit_answer(exercise_id: int, answer: str) -> dict:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT correct_answer, explanation, incorrect_explanations_json
            FROM exercises
            WHERE id = ?
            """,
            (exercise_id,),
        ).fetchone()

        if row is None:
            raise HTTPException(status_code=404, detail="Exercitiul nu a fost gasit.")

        was_correct = _normalize_answer(answer) == _normalize_answer(row["correct_answer"])
        answered_at = datetime.now(timezone.utc)

        connection.execute(
            """
            INSERT INTO progress (exercise_id, was_correct, answered_at)
            VALUES (?, ?, ?)
            """,
            (exercise_id, int(was_correct), answered_at.isoformat()),
        )
        connection.commit()

    return {
        "exercise_id": exercise_id,
        "was_correct": was_correct,
        "explanation": _feedback_explanation(row, answer, was_correct),
        "correct_answer": row["correct_answer"],
        "answered_at": answered_at,
    }


def get_progress_summary() -> dict:
    with get_connection() as connection:
        solved = connection.execute(
            "SELECT COUNT(DISTINCT exercise_id) AS total FROM progress"
        ).fetchone()["total"]
        correct = connection.execute(
            "SELECT COUNT(DISTINCT exercise_id) AS total FROM progress WHERE was_correct = 1"
        ).fetchone()["total"]
        total_lessons = connection.execute(
            "SELECT COUNT(*) AS total FROM lessons"
        ).fetchone()["total"]
        total_exercises = connection.execute(
            "SELECT COUNT(*) AS total FROM exercises"
        ).fetchone()["total"]
        completed_rows = connection.execute(
            """
            SELECT l.id, l.title
            FROM lessons l
            JOIN exercises e ON e.lesson_id = l.id
            LEFT JOIN progress p
              ON p.exercise_id = e.id
             AND p.was_correct = 1
            GROUP BY l.id, l.title
            HAVING COUNT(DISTINCT e.id) = COUNT(DISTINCT p.exercise_id)
            ORDER BY l.id
            """
        ).fetchall()

    success_rate = round((correct / solved) * 100, 1) if solved else 0.0

    return {
        "number_solved": solved,
        "number_correct": correct,
        "success_rate": success_rate,
        "completed_lessons_count": len(completed_rows),
        "completed_lessons": [dict(row) for row in completed_rows],
        "total_lessons": total_lessons,
        "total_exercises": total_exercises,
    }


def get_progress_insights(current_user: dict) -> dict:
    summary = get_progress_summary()
    role = (current_user or {}).get("role", "")
    student_key = ""
    if role == "student":
        student_key = f"{(current_user.get('last_name') or '').strip().casefold()}::{(current_user.get('first_name') or '').strip().casefold()}"

    with get_connection() as connection:
        timeline_rows = connection.execute(
            """
            SELECT
                substr(answered_at, 1, 10) AS day_key,
                COUNT(*) AS answered_count,
                SUM(CASE WHEN was_correct = 1 THEN 1 ELSE 0 END) AS correct_count
            FROM progress
            GROUP BY substr(answered_at, 1, 10)
            ORDER BY day_key DESC
            LIMIT 10
            """
        ).fetchall()

        lesson_rows = connection.execute(
            """
            WITH solved_exercises AS (
                SELECT DISTINCT exercise_id
                FROM progress
            ),
            correct_exercises AS (
                SELECT DISTINCT exercise_id
                FROM progress
                WHERE was_correct = 1
            )
            SELECT
                l.id AS lesson_id,
                l.title,
                COUNT(e.id) AS total_exercises,
                COUNT(DISTINCT se.exercise_id) AS solved_exercises,
                COUNT(DISTINCT ce.exercise_id) AS correct_exercises
            FROM lessons l
            JOIN exercises e ON e.lesson_id = l.id
            LEFT JOIN solved_exercises se ON se.exercise_id = e.id
            LEFT JOIN correct_exercises ce ON ce.exercise_id = e.id
            GROUP BY l.id, l.title
            ORDER BY l.id
            """
        ).fetchall()

        attempt_filters = ["role = 'student'", "status IN ('submitted', 'graded')"]
        attempt_params: list[str] = []
        if student_key:
            attempt_filters.append("student_key = ?")
            attempt_params.append(student_key)

        attempts_overview = connection.execute(
            f"""
            SELECT
                COUNT(*) AS completed_tests,
                AVG(
                    CASE
                        WHEN (correct_count + wrong_count) > 0
                            THEN (CAST(correct_count AS REAL) * 100.0) / (correct_count + wrong_count)
                        ELSE NULL
                    END
                ) AS average_score,
                MAX(updated_at) AS latest_activity_at
            FROM integrated_attempts
            WHERE {' AND '.join(attempt_filters)}
            """,
            attempt_params,
        ).fetchone()

        latest_attempt_filters = ["role = 'student'"]
        latest_attempt_params: list[str] = []
        if student_key:
            latest_attempt_filters.append("student_key = ?")
            latest_attempt_params.append(student_key)

        latest_attempt_row = connection.execute(
            f"""
            SELECT
                COALESCE(t.title, a.test_id) AS test_title,
                a.updated_at
            FROM integrated_attempts a
            LEFT JOIN integrated_tests t ON t.id = a.test_id
            WHERE {' AND '.join(f'a.{filter_clause}' if filter_clause.startswith('student_key') or filter_clause.startswith('role') else filter_clause for filter_clause in latest_attempt_filters)}
            ORDER BY a.updated_at DESC, a.id DESC
            LIMIT 1
            """,
            latest_attempt_params,
        ).fetchone()

        progress_recent_rows = connection.execute(
            """
            SELECT
                p.id,
                p.answered_at,
                p.was_correct,
                e.id AS exercise_id,
                l.id AS lesson_id,
                l.title AS lesson_title
            FROM progress p
            JOIN exercises e ON e.id = p.exercise_id
            JOIN lessons l ON l.id = e.lesson_id
            ORDER BY p.answered_at DESC, p.id DESC
            LIMIT 8
            """
        ).fetchall()

        test_recent_filters = ["role = 'student'"]
        test_recent_params: list[str] = []
        if student_key:
            test_recent_filters.append("student_key = ?")
            test_recent_params.append(student_key)

        test_recent_rows = connection.execute(
            f"""
            SELECT
                a.id,
                COALESCE(t.title, a.test_id) AS test_title,
                a.status,
                a.updated_at,
                a.answered_count,
                a.correct_count,
                a.wrong_count
            FROM integrated_attempts a
            LEFT JOIN integrated_tests t ON t.id = a.test_id
            WHERE {' AND '.join(f'a.{filter_clause}' if filter_clause.startswith('student_key') or filter_clause.startswith('role') else filter_clause for filter_clause in test_recent_filters)}
            ORDER BY a.updated_at DESC, a.id DESC
            LIMIT 6
            """,
            test_recent_params,
        ).fetchall()

    timeline = [
        {
            "day_key": row["day_key"],
            "label": _day_label_from_iso(row["day_key"]),
            "answered_count": int(row["answered_count"] or 0),
            "correct_count": int(row["correct_count"] or 0),
            "accuracy": round(
                (float(row["correct_count"] or 0) / float(row["answered_count"])) * 100,
                1,
            )
            if row["answered_count"]
            else 0.0,
        }
        for row in reversed(timeline_rows)
    ]

    if not timeline:
        timeline = [
            {
                "day_key": f"slot-{index + 1}",
                "label": f"S{index + 1}",
                "answered_count": 0,
                "correct_count": 0,
                "accuracy": 0.0,
            }
            for index in range(7)
        ]

    lesson_breakdown = []
    for row in lesson_rows:
        total_exercises = int(row["total_exercises"] or 0)
        correct_exercises = int(row["correct_exercises"] or 0)
        lesson_breakdown.append(
            {
                "lesson_id": int(row["lesson_id"]),
                "title": row["title"],
                "short_label": f"L{row['lesson_id']}",
                "solved_exercises": int(row["solved_exercises"] or 0),
                "correct_exercises": correct_exercises,
                "total_exercises": total_exercises,
                "accuracy": round((correct_exercises / total_exercises) * 100, 1)
                if total_exercises
                else 0.0,
            }
        )

    recent_activity = []
    for row in progress_recent_rows:
        recent_activity.append(
            {
                "id": f"progress-{row['id']}",
                "kind": "exercise",
                "label": (
                    f"Ai rezolvat corect un exercitiu din {row['lesson_title']}."
                    if row["was_correct"]
                    else f"Ai revenit asupra unui exercitiu din {row['lesson_title']}."
                ),
                "meta": f"Exercitiul {row['exercise_id']}",
                "occurred_at": row["answered_at"],
            }
        )

    for row in test_recent_rows:
        status_label = {
            "in_progress": "Test in lucru",
            "submitted": "Test trimis",
            "graded": "Test evaluat",
        }.get((row["status"] or "").casefold(), "Test actualizat")
        recent_activity.append(
            {
                "id": f"attempt-{row['id']}",
                "kind": "test",
                "label": f"{status_label}: {row['test_title']}.",
                "meta": f"{int(row['correct_count'] or 0)} corecte / {int((row['correct_count'] or 0) + (row['wrong_count'] or 0))} raspunsuri evaluate",
                "occurred_at": row["updated_at"],
            }
        )

    recent_activity.sort(
        key=lambda entry: _parse_iso_timestamp(entry["occurred_at"]) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    recent_activity = recent_activity[:8]

    latest_timestamps = [
        _parse_iso_timestamp(summary_entry["occurred_at"])
        for summary_entry in recent_activity
        if _parse_iso_timestamp(summary_entry["occurred_at"]) is not None
    ]
    latest_attempt_at = _parse_iso_timestamp(attempts_overview["latest_activity_at"] if attempts_overview else None)
    if latest_attempt_at is not None:
        latest_timestamps.append(latest_attempt_at)

    latest_activity_at = max(latest_timestamps).isoformat() if latest_timestamps else None
    completed_tests = int(attempts_overview["completed_tests"] or 0) if attempts_overview else 0
    average_score = (
        round(float(attempts_overview["average_score"]), 1)
        if attempts_overview and attempts_overview["average_score"] is not None
        else float(summary["success_rate"])
    )

    return {
        "average_score": average_score,
        "completed_tests": completed_tests,
        "latest_activity_at": latest_activity_at,
        "latest_test_title": latest_attempt_row["test_title"] if latest_attempt_row else None,
        "timeline": recent_activity and timeline or timeline,
        "lesson_breakdown": lesson_breakdown,
        "recent_activity": recent_activity,
    }
