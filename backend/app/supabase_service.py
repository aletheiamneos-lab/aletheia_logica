from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from fastapi import HTTPException
from postgrest.exceptions import APIError
from supabase import Client, create_client

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")
LOGGER = logging.getLogger("uvicorn.error")
FREE_PLAN_DATABASE_LIMIT_BYTES = 500 * 1024 * 1024


def _configuration_error() -> HTTPException:
    return HTTPException(
        status_code=503,
        detail=(
            "Supabase nu este configurat complet. Completeaza SUPABASE_URL, "
            "si SUPABASE_SERVICE_ROLE_KEY in backend/.env."
        ),
    )


@lru_cache(maxsize=1)
def get_server_supabase() -> Client:
    url = os.getenv("SUPABASE_URL", "").strip()
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not service_key:
        raise _configuration_error()
    LOGGER.info(
        "[Supabase client] initializare backend key_source=SUPABASE_SERVICE_ROLE_KEY "
        "url_configured=true"
    )
    return create_client(url, service_key)


def get_supabase_database_usage() -> dict:
    LOGGER.info("[Supabase usage] START rpc=get_database_usage")
    try:
        response = get_server_supabase().rpc("get_database_usage").execute()
    except APIError as error:
        LOGGER.exception(
            "[Supabase usage] ERROR rpc=get_database_usage code=%s message=%s",
            getattr(error, "code", ""),
            getattr(error, "message", str(error)),
        )
        if getattr(error, "code", "") == "PGRST202":
            raise HTTPException(
                status_code=503,
                detail=(
                    "Metrica de utilizare Supabase nu este instalata. "
                    "Ruleaza migrarea supabase/migrations/20260727_add_database_usage_function.sql."
                ),
            ) from error
        raise HTTPException(
            status_code=502,
            detail=f"Utilizarea Supabase nu a putut fi citita: {error.message}",
        ) from error
    except Exception as error:
        LOGGER.exception("[Supabase usage] UNEXPECTED_ERROR rpc=get_database_usage")
        raise HTTPException(
            status_code=502,
            detail="Utilizarea Supabase nu a putut fi citita.",
        ) from error

    raw_payload = response.data
    if isinstance(raw_payload, list):
        raw_payload = raw_payload[0] if raw_payload else {}
    payload = raw_payload if isinstance(raw_payload, dict) else {}

    database_size_bytes = max(0, int(payload.get("database_size_bytes") or 0))
    public_tables_size_bytes = max(0, int(payload.get("public_tables_size_bytes") or 0))
    usage_percent = round((database_size_bytes / FREE_PLAN_DATABASE_LIMIT_BYTES) * 100, 2)
    remaining_bytes = max(0, FREE_PLAN_DATABASE_LIMIT_BYTES - database_size_bytes)
    LOGGER.info(
        "[Supabase usage] SUCCESS database_size_bytes=%s public_tables_size_bytes=%s "
        "limit_bytes=%s usage_percent=%.2f",
        database_size_bytes,
        public_tables_size_bytes,
        FREE_PLAN_DATABASE_LIMIT_BYTES,
        usage_percent,
    )
    return {
        "plan": "Free",
        "database_size_bytes": database_size_bytes,
        "public_tables_size_bytes": public_tables_size_bytes,
        "limit_bytes": FREE_PLAN_DATABASE_LIMIT_BYTES,
        "remaining_bytes": remaining_bytes,
        "usage_percent": usage_percent,
        "is_over_limit": database_size_bytes >= FREE_PLAN_DATABASE_LIMIT_BYTES,
        "measured_at": datetime.now(timezone.utc).isoformat(),
    }


def normalize_allowed_student(row: dict) -> dict:
    return {
        "id": str(row.get("id", "")),
        "email": str(row.get("email", "")).strip().casefold(),
        "name": str(row.get("name", "")).strip(),
        "is_blocked": bool(row.get("is_blocked", False)),
        "force_logout": bool(row.get("force_logout", False)),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def find_allowed_student(email: str) -> dict | None:
    try:
        response = (
            get_server_supabase()
            .table("allowed_students")
            .select("*")
            .ilike("email", email.strip().casefold())
            .limit(1)
            .execute()
        )
    except APIError as error:
        raise HTTPException(status_code=502, detail=f"Eroare Supabase: {error.message}") from error
    rows = response.data or []
    return normalize_allowed_student(rows[0]) if rows else None


def list_allowed_students() -> list[dict]:
    try:
        response = (
            get_server_supabase()
            .table("allowed_students")
            .select("*")
            .order("name")
            .order("email")
            .execute()
        )
    except APIError as error:
        raise HTTPException(status_code=502, detail=f"Eroare Supabase: {error.message}") from error
    return [normalize_allowed_student(row) for row in response.data or []]


def add_allowed_student(email: str, name: str) -> dict:
    payload = {
        "email": email.strip().casefold(),
        "name": " ".join(name.strip().split()),
        "is_blocked": False,
        "force_logout": False,
    }
    try:
        response = get_server_supabase().table("allowed_students").insert(payload).execute()
    except APIError as error:
        if getattr(error, "code", "") == "23505":
            raise HTTPException(status_code=409, detail="Adresa de email exista deja.") from error
        raise HTTPException(status_code=502, detail=f"Eroare Supabase: {error.message}") from error
    return normalize_allowed_student(response.data[0])


def update_allowed_student(student_id: str, changes: dict) -> dict:
    try:
        response = (
            get_server_supabase()
            .table("allowed_students")
            .update(changes)
            .eq("id", student_id)
            .execute()
        )
    except APIError as error:
        raise HTTPException(status_code=502, detail=f"Eroare Supabase: {error.message}") from error
    if not response.data:
        raise HTTPException(status_code=404, detail="Elevul nu a fost gasit.")
    return normalize_allowed_student(response.data[0])


def update_all_allowed_students(is_blocked: bool) -> list[dict]:
    students = list_allowed_students()
    student_ids = [student["id"] for student in students if student.get("id")]
    if not student_ids:
        return []

    LOGGER.info(
        "[Supabase write] START table=allowed_students operation=bulk_block count=%s is_blocked=%s",
        len(student_ids),
        is_blocked,
    )
    try:
        response = (
            get_server_supabase()
            .table("allowed_students")
            .update({"is_blocked": is_blocked})
            .in_("id", student_ids)
            .execute()
        )
    except APIError as error:
        LOGGER.exception(
            "[Supabase write] ERROR table=allowed_students operation=bulk_block count=%s",
            len(student_ids),
        )
        raise HTTPException(status_code=502, detail=f"Eroare Supabase: {error.message}") from error

    updated_students = [normalize_allowed_student(row) for row in response.data or []]
    LOGGER.info(
        "[Supabase write] SUCCESS table=allowed_students operation=bulk_block affected=%s",
        len(updated_students),
    )
    return updated_students


def delete_allowed_student(student_id: str) -> None:
    try:
        response = (
            get_server_supabase()
            .table("allowed_students")
            .delete()
            .eq("id", student_id)
            .execute()
        )
    except APIError as error:
        raise HTTPException(status_code=502, detail=f"Eroare Supabase: {error.message}") from error
    if not response.data:
        raise HTTPException(status_code=404, detail="Elevul nu a fost gasit.")
