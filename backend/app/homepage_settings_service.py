from __future__ import annotations

import json

from .auth_service import get_setting, set_setting

HOMEPAGE_STUDY_PLAN_SETTING_KEY = "homepage_study_plan_v1"
EMPTY_STUDY_PLAN = {
    "start_date": "",
    "rows": [],
}


def get_homepage_study_plan() -> dict:
    raw_value = get_setting(HOMEPAGE_STUDY_PLAN_SETTING_KEY)
    if not raw_value:
        return dict(EMPTY_STUDY_PLAN)

    try:
        parsed = json.loads(raw_value)
    except json.JSONDecodeError:
        return dict(EMPTY_STUDY_PLAN)

    if not isinstance(parsed, dict):
        return dict(EMPTY_STUDY_PLAN)

    rows = parsed.get("rows")
    return {
        "start_date": str(parsed.get("start_date", "")).strip(),
        "rows": rows if isinstance(rows, list) else [],
    }


def save_homepage_study_plan(payload: dict) -> dict:
    normalized_payload = {
        "start_date": str(payload.get("start_date", "")).strip(),
        "rows": payload.get("rows", []) if isinstance(payload.get("rows"), list) else [],
    }
    set_setting(
        HOMEPAGE_STUDY_PLAN_SETTING_KEY,
        json.dumps(normalized_payload, ensure_ascii=False),
    )
    return normalized_payload
