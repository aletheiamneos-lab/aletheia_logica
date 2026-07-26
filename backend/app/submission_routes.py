from __future__ import annotations

from fastapi import APIRouter, Depends

from .auth_service import get_current_user
from .integrated_tests_supabase_service import submit_test
from .schemas import SubmitTestRequest

router = APIRouter(tags=["submission"])


@router.post("/submit-test")
def submit_test_route(
    payload: SubmitTestRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    return submit_test(current_user, payload.attempt_id)
