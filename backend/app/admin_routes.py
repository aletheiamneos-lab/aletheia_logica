from __future__ import annotations

import re
import unicodedata
from pathlib import Path

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from .auth_service import get_admin_user
from .integrated_tests_supabase_service import (
    get_admin_pdf_path,
    get_admin_report,
    get_admin_report_email_delivery,
    list_admin_live_attempts,
    list_admin_reports,
)
from .pdf_service import build_content_disposition
from .report_email_service import send_report_email

router = APIRouter(prefix="/admin", tags=["admin"])


def _safe_download_component(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", str(value or ""))
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_value = re.sub(r"[^A-Za-z0-9]+", "_", ascii_value).strip("_")
    return ascii_value or "Raport"


def _report_date(value: str | None) -> str:
    if not value:
        return "data"
    return str(value)[:10] or "data"


def _build_student_report_filename(report: dict, fallback_name: str) -> str:
    student_name = (
        report.get("studentName")
        or report.get("student_name")
        or report.get("student_display_name")
        or "Elev"
    )
    test_type = (report.get("testType") or report.get("test_type") or "integrated").upper()
    test_title = report.get("testTitle") or report.get("test_title") or "Test"
    submitted_at = report.get("submittedAt") or report.get("submitted_at")
    parts = [
        _safe_download_component(student_name),
        _safe_download_component(test_type),
        _safe_download_component(test_title),
        _safe_download_component(_report_date(submitted_at)),
    ]
    file_name = "_".join(part for part in parts if part)
    return f"{file_name}.pdf" if file_name else fallback_name


@router.get("/live-attempts")
def admin_live_attempts(current_user: dict = Depends(get_admin_user)) -> list[dict]:
    return list_admin_live_attempts(current_user)


@router.get("/reports")
def admin_reports(current_user: dict = Depends(get_admin_user)) -> list[dict]:
    return list_admin_reports(current_user)


@router.get("/report/{report_id}")
def admin_report(report_id: str, current_user: dict = Depends(get_admin_user)) -> dict:
    return get_admin_report(current_user, report_id)


@router.get("/pdf/{report_id}")
def admin_pdf(report_id: str, current_user: dict = Depends(get_admin_user)):
    target_path = Path(get_admin_pdf_path(current_user, report_id))
    report_payload = get_admin_report(current_user, report_id)
    download_name = _build_student_report_filename(report_payload, target_path.name)
    return FileResponse(
        path=target_path,
        media_type="application/pdf",
        filename=download_name,
        headers={
            "Content-Disposition": build_content_disposition(download_name, "attachment")
        }
    )


@router.post("/report/{report_id}/email")
def admin_report_email(report_id: str, current_user: dict = Depends(get_admin_user)) -> dict:
    delivery_payload = get_admin_report_email_delivery(current_user, report_id)
    return send_report_email(
        delivery_payload["recipient_email"],
        delivery_payload["report"],
        Path(delivery_payload["pdf_path"]),
    )
