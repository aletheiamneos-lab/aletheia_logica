"""Continutul local pentru lectii si exercitii, sincronizat cu cursul din frontend."""

from __future__ import annotations

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
LESSON1_JSON_PATH = PROJECT_ROOT / "frontend" / "src" / "content" / "lesson1Exercises.json"
PRACTICE_ADDITIONS_PATH = (
    PROJECT_ROOT / "frontend" / "src" / "content" / "lessonPracticeAdditions.json"
)
COURSE_MANIFEST_PATH = PROJECT_ROOT / "frontend" / "src" / "data" / "courseManifest.json"


def _load_json(path: Path) -> dict | list:
    with path.open("r", encoding="utf-8-sig") as source_file:
        return json.load(source_file)


def _map_difficulty(value: str) -> str:
    mapping = {
        "easy": "usor",
        "medium": "mediu",
        "hard": "greu",
    }
    return mapping.get(value, value)


def _map_type(value: str) -> str:
    mapping = {
        "mcq": "multiple_choice",
        "true_false": "true_false",
    }
    return mapping.get(value, value)


LESSON1_PACK = _load_json(LESSON1_JSON_PATH)
PRACTICE_ADDITIONS = _load_json(PRACTICE_ADDITIONS_PATH)
COURSE_MANIFEST = _load_json(COURSE_MANIFEST_PATH)

LESSONS = [
    {
        "id": lesson["id"],
        "title": lesson["title"],
        "short_text": lesson["shortText"],
        "formal_text": lesson["formalText"],
        "example_text": lesson["exampleText"],
        "topic": lesson["topic"],
    }
    for lesson in COURSE_MANIFEST
]


def _build_lesson1_exercises() -> list[dict]:
    exercises = []

    for index, exercise in enumerate(LESSON1_PACK.get("exercises", []), start=1):
        exercises.append(
            {
                "id": index,
                "lesson_id": 1,
                "topic": exercise["topic"],
                "difficulty": _map_difficulty(exercise["difficulty"]),
                "type": _map_type(exercise["type"]),
                "question": exercise["question"],
                "options": exercise["options"],
                "correct_answer": exercise["correct"],
                "explanation": exercise["correct_explanation"],
                "incorrect_explanations": exercise.get("incorrect_explanations", {}),
            }
        )

    return exercises


EXERCISES = _build_lesson1_exercises() + [
    {
        **exercise,
        "incorrect_explanations": exercise.get("incorrect_explanations", {}),
    }
    for exercise in PRACTICE_ADDITIONS.get("exercises", [])
]
