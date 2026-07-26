from __future__ import annotations

import json
import re
import sqlite3
import unicodedata
import uuid
from pathlib import Path

DEFAULT_SEED_CATEGORIES = [
    "Definitii",
    "Clasificare",
    "Propozitii categorice",
    "Silogisme si rationamente",
    "Erori de rationament",
]

DEFAULT_REPORT_TEMPLATE = {
    "include_score": True,
    "include_category_breakdown": True,
    "include_correct_answers": True,
    "include_justifications": True,
    "include_student_answers": True,
    "include_recommendations": True,
}

SEED_SOURCES_DIR = Path(__file__).resolve().parent / "seed_sources" / "integrated_tests"
SEED_SOURCE_GLOB = "test_logica_set*.json"


def _safe_slug(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value.strip().lower())
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    return slug or f"test-{uuid.uuid4().hex[:8]}"


def _read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _iter_seed_source_paths() -> list[Path]:
    return sorted(
        (path for path in SEED_SOURCES_DIR.glob(SEED_SOURCE_GLOB) if path.is_file()),
        key=lambda path: path.name.lower(),
    )


def _normalize_categories(raw_payload: dict) -> tuple[list[str], dict[int, str]]:
    raw_categories = raw_payload.get("categories")
    if isinstance(raw_categories, list) and raw_categories:
        if all(isinstance(entry, dict) for entry in raw_categories):
            categories = [str(entry.get("name", "")).strip() for entry in raw_categories]
            categories = [entry for entry in categories if entry]
            question_to_category = {}
            for category_entry in raw_categories:
                category_name = str(category_entry.get("name", "")).strip()
                for question_id in category_entry.get("question_ids", []):
                    if category_name:
                        question_to_category[int(question_id)] = category_name
            if len(categories) == 5:
                return categories, question_to_category
        elif all(isinstance(entry, str) and entry.strip() for entry in raw_categories):
            categories = [str(entry).strip() for entry in raw_categories]
            if len(categories) == 5:
                return categories, {}

    return list(DEFAULT_SEED_CATEGORIES), {}


def _build_description(payload: dict, title: str) -> str:
    description = str(payload.get("description", "")).strip()
    if description:
        return description
    return f"Set integrat importat automat pentru {title}."


def _extract_options(question_payload: dict, question_id: int) -> tuple[list[str], int]:
    raw_options = question_payload.get("options")
    if not isinstance(raw_options, dict):
        raise ValueError(f"Intrebarea {question_id} nu are optiuni valide.")

    option_order = question_payload.get("option_order") or list(raw_options.keys())
    normalized_option_order = [str(entry).strip().upper() for entry in option_order if str(entry).strip()]
    if not normalized_option_order:
        normalized_option_order = sorted(str(key).strip().upper() for key in raw_options.keys())

    options = [str(raw_options[key]).strip() for key in normalized_option_order if key in raw_options]
    if len(options) not in {4, 5}:
        raise ValueError(f"Intrebarea {question_id} trebuie sa aiba 4 sau 5 variante.")

    correct_answer_label = str(question_payload.get("correct_answer", "")).strip().upper()
    if correct_answer_label not in normalized_option_order:
        raise ValueError(f"Intrebarea {question_id} nu are correct_answer valid.")

    return options, normalized_option_order.index(correct_answer_label)


def _normalize_questions(
    test_id: str,
    categories: list[str],
    question_category_map: dict[int, str],
    raw_questions: list[dict],
) -> list[dict]:
    if len(raw_questions) != 25:
        raise ValueError("Fiecare test integrat importat trebuie sa aiba exact 25 de intrebari.")

    per_category_order = {category: 0 for category in categories}
    questions = []

    for index, raw_question in enumerate(raw_questions):
        raw_question_id = int(raw_question.get("id", index + 1))
        category = (
            str(raw_question.get("category", "")).strip()
            or question_category_map.get(raw_question_id)
            or categories[index // 5]
        )
        if category not in categories:
            category = categories[index // 5]

        lesson_number = categories.index(category) + 1
        per_category_order[category] += 1
        options, correct_option_index = _extract_options(raw_question, raw_question_id)
        justification = str(raw_question.get("justification", "")).strip()

        questions.append(
            {
                "id": f"{test_id}-q{index + 1}",
                "test_id": test_id,
                "lesson_number": lesson_number,
                "lesson_label": category,
                "text": str(raw_question.get("question", "")).strip(),
                "options": options,
                "correct_option_index": correct_option_index,
                "category": category,
                "answer_type": "single",
                "justification": justification,
                "source_lesson": str(raw_question.get("source_lesson", "")).strip() or f"Lectia {lesson_number}",
                "tags": [str(tag).strip() for tag in raw_question.get("tags", []) if str(tag).strip()],
                "explanation": justification,
                "difficulty": str(raw_question.get("difficulty", "")).strip(),
                "order_in_lesson": per_category_order[category],
                "order_in_test": index + 1,
            }
        )

    return questions


def _normalize_seed_test(path: Path) -> dict:
    payload = _read_json(path)
    title = (
        str(payload.get("title", "")).strip()
        or str(payload.get("test_name", "")).strip()
        or str(payload.get("test_id", "")).strip()
        or path.stem
    )
    slug = _safe_slug(
        str(payload.get("test_id", "")).strip()
        or str(payload.get("test_name", "")).strip()
        or title
    )
    test_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"logica.integrated::{slug}"))
    categories, question_category_map = _normalize_categories(payload)
    normalized_questions = _normalize_questions(
        test_id,
        categories,
        question_category_map,
        payload.get("questions", []),
    )

    return {
        "id": test_id,
        "title": title,
        "slug": slug,
        "description": _build_description(payload, title),
        "duration_minutes": 50,
        "difficulty_label": "importat",
        "is_active": 1,
        "is_draft": 0,
        "is_visible_to_students": 0,
        "schema_version": str(payload.get("schema_version", "1.0")).strip() or "1.0",
        "subject": str(payload.get("subject", "Logica")).strip() or "Logica",
        "level": str(payload.get("level", "bac_admitere")).strip() or "bac_admitere",
        "language": str(payload.get("language", "ro")).strip() or "ro",
        "categories_json": json.dumps(categories, ensure_ascii=False),
        "report_template_json": json.dumps(DEFAULT_REPORT_TEMPLATE, ensure_ascii=False),
        "questions": normalized_questions,
    }


def seed_bundled_integrated_tests(connection: sqlite3.Connection, now_iso: str) -> None:
    for source_path in _iter_seed_source_paths():
        normalized_test = _normalize_seed_test(source_path)
        existing_row = connection.execute(
            "SELECT id FROM integrated_tests WHERE slug = ?",
            (normalized_test["slug"],),
        ).fetchone()

        if existing_row is not None:
            continue

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
                normalized_test["id"],
                normalized_test["title"],
                normalized_test["slug"],
                normalized_test["description"],
                normalized_test["duration_minutes"],
                normalized_test["difficulty_label"],
                normalized_test["is_active"],
                normalized_test["is_draft"],
                normalized_test["is_visible_to_students"],
                normalized_test["schema_version"],
                normalized_test["subject"],
                normalized_test["level"],
                normalized_test["language"],
                normalized_test["categories_json"],
                normalized_test["report_template_json"],
                now_iso,
                now_iso,
            ),
        )

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
                    "tags_json": json.dumps(question["tags"], ensure_ascii=False),
                }
                for question in normalized_test["questions"]
            ],
        )
