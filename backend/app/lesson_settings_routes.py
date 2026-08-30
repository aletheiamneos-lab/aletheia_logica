from __future__ import annotations

from fastapi import APIRouter, Depends

from .auth_service import get_admin_user, get_current_user
from .lesson_settings_service import get_lessons_visibility, update_lesson_visibility
from .schemas import LessonVisibility, LessonsVisibilityResponse, LessonVisibilityUpdate

router = APIRouter(prefix="/lesson-settings", tags=["lesson-settings"])


@router.get("/lessons", response_model=LessonsVisibilityResponse)
def read_lessons_visibility(
    current_user: dict = Depends(get_current_user),
) -> dict:
    return get_lessons_visibility(current_user)


@router.patch("/lessons/{lesson_id}", response_model=LessonVisibility)
def change_lesson_visibility(
    lesson_id: int,
    payload: LessonVisibilityUpdate,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    return update_lesson_visibility(lesson_id, payload.is_visible_to_students)
