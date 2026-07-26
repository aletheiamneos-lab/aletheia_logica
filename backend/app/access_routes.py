from __future__ import annotations

from fastapi import APIRouter

from .auth_service import create_admin_session, create_student_session
from .schemas import StudentLoginRequest, TeacherLoginRequest

router = APIRouter(tags=["access"])


@router.post("/login/student")
def login_student(payload: StudentLoginRequest) -> dict:
    return create_student_session(payload.first_name, payload.last_name)


@router.post("/login/admin")
def login_admin(payload: TeacherLoginRequest) -> dict:
    return create_admin_session(payload.password)
