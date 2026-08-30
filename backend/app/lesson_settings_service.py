from __future__ import annotations

import json

from fastapi import HTTPException

from .auth_service import get_setting, set_setting
from .seed_content import LESSONS

LESSON_VISIBILITY_SETTING_KEY = "lesson_visibility_v1"
LESSON_IDS = tuple(int(lesson["id"]) for lesson in LESSONS)


def _default_visibility() -> dict[int, bool]:
    return {lesson_id: False for lesson_id in LESSON_IDS}


def _load_visibility() -> dict[int, bool]:
    visibility = _default_visibility()
    raw_value = get_setting(LESSON_VISIBILITY_SETTING_KEY)
    if not raw_value:
        return visibility

    try:
        stored_visibility = json.loads(raw_value)
    except (json.JSONDecodeError, TypeError):
        return visibility

    if not isinstance(stored_visibility, dict):
        return visibility

    for lesson_id in LESSON_IDS:
        stored_value = stored_visibility.get(str(lesson_id))
        if isinstance(stored_value, bool):
            visibility[lesson_id] = stored_value
    return visibility


def visible_lesson_ids(current_user: dict) -> set[int]:
    if current_user.get("role") == "admin":
        return set(LESSON_IDS)

    visibility = _load_visibility()
    return {lesson_id for lesson_id, is_visible in visibility.items() if is_visible}


def ensure_lesson_access(lesson_id: int, current_user: dict) -> None:
    normalized_lesson_id = int(lesson_id)
    if normalized_lesson_id not in LESSON_IDS:
        raise HTTPException(status_code=404, detail="Lectia nu a fost gasita.")
    if normalized_lesson_id not in visible_lesson_ids(current_user):
        raise HTTPException(
            status_code=403,
            detail="Aceasta lectie nu este disponibila momentan. Adminul trebuie sa iti ofere acces.",
        )


def get_lessons_visibility(current_user: dict) -> dict:
    visibility = _load_visibility()
    can_manage = current_user.get("role") == "admin"
    lesson_ids = (
        LESSON_IDS
        if can_manage
        else tuple(lesson_id for lesson_id in LESSON_IDS if visibility[lesson_id])
    )
    return {
        "can_manage": can_manage,
        "lessons": [
            {
                "lesson_id": lesson_id,
                "is_visible_to_students": visibility[lesson_id],
            }
            for lesson_id in lesson_ids
        ],
    }


def update_lesson_visibility(lesson_id: int, is_visible_to_students: bool) -> dict:
    normalized_lesson_id = int(lesson_id)
    if normalized_lesson_id not in LESSON_IDS:
        raise HTTPException(status_code=404, detail="Lectia nu a fost gasita.")

    visibility = _load_visibility()
    visibility[normalized_lesson_id] = is_visible_to_students
    set_setting(
        LESSON_VISIBILITY_SETTING_KEY,
        json.dumps(visibility, ensure_ascii=False, sort_keys=True),
    )
    return {
        "lesson_id": normalized_lesson_id,
        "is_visible_to_students": is_visible_to_students,
    }
