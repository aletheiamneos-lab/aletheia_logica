from __future__ import annotations

from fastapi import APIRouter, Depends

from .auth_service import get_admin_user, get_current_user
from .homepage_settings_service import get_homepage_study_plan, save_homepage_study_plan
from .schemas import HomepageStudyPlanPayload

router = APIRouter(prefix="/homepage-settings", tags=["homepage-settings"])


@router.get("/study-plan", response_model=HomepageStudyPlanPayload)
def read_homepage_study_plan(current_user: dict = Depends(get_current_user)) -> dict:
    return get_homepage_study_plan()


@router.put("/study-plan", response_model=HomepageStudyPlanPayload)
def update_homepage_study_plan(
    payload: HomepageStudyPlanPayload,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    return save_homepage_study_plan(payload.model_dump())
