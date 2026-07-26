from __future__ import annotations

from fastapi import APIRouter, Depends

from .auth_service import (
    change_admin_password,
    create_student_session,
    create_admin_session,
    create_teacher_session,
    get_admin_user,
    get_current_user,
    logout_session,
)
from .schemas import (
    ChangeTeacherPasswordRequest,
    StudentLoginRequest,
    TeacherLoginRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/student-login")
def student_login(payload: StudentLoginRequest) -> dict:
    return create_student_session(payload.first_name, payload.last_name)


@router.post("/teacher-login")
def teacher_login(payload: TeacherLoginRequest) -> dict:
    return create_teacher_session(payload.password)


@router.post("/admin-login")
def admin_login(payload: TeacherLoginRequest) -> dict:
    return create_admin_session(payload.password)


@router.get("/session")
def current_session(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user


@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)) -> dict:
    logout_session(current_user["session_id"])
    return {"message": "Sesiunea a fost inchisa."}


@router.post("/change-password")
def update_teacher_password(
    payload: ChangeTeacherPasswordRequest,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    return change_admin_password(
        current_user["session_id"],
        payload.current_password,
        payload.new_password,
    )
