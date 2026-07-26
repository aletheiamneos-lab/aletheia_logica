from __future__ import annotations

import logging
import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from fastapi import HTTPException
from postgrest.exceptions import APIError
from supabase import Client, create_client

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")
LOGGER = logging.getLogger("uvicorn.error")


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
