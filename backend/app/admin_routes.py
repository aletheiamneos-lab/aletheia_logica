from __future__ import annotations

import re
import unicodedata
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from .auth_service import get_admin_user
from .integrated_tests_supabase_service import (
    build_admin_attempts_pdf_zip,
    delete_admin_attempts,
    get_admin_attempts_summary,
    get_admin_pdf,
    get_admin_report,
    get_admin_report_email_delivery,
    list_admin_live_attempts,
    list_admin_reports,
)
from .pdf_service import build_content_disposition
from .report_email_service import send_report_email, send_reports_email
from .schemas import AttemptBulkRequest
from .supabase_service import get_supabase_database_usage

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
    report_payload, pdf_bytes, storage_name = get_admin_pdf(current_user, report_id)
    download_name = _build_student_report_filename(report_payload, storage_name)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": build_content_disposition(download_name, "attachment"),
            "Cache-Control": "no-store",
        }
    )


@router.post("/report/{report_id}/email")
def admin_report_email(report_id: str, current_user: dict = Depends(get_admin_user)) -> dict:
    delivery_payload = get_admin_report_email_delivery(current_user, report_id)
    return send_report_email(
        delivery_payload["recipient_email"],
        delivery_payload["report"],
        pdf_bytes=delivery_payload["pdf_bytes"],
        pdf_file_name=delivery_payload["pdf_file_name"],
    )


@router.get("/attempts/summary")
def admin_attempts_summary(current_user: dict = Depends(get_admin_user)) -> dict:
    return get_admin_attempts_summary(current_user)


@router.get("/supabase-usage")
def admin_supabase_usage(current_user: dict = Depends(get_admin_user)) -> dict:
    return get_supabase_database_usage()


@router.post("/attempts/pdf-archive")
def admin_attempts_pdf_archive(
    payload: AttemptBulkRequest,
    current_user: dict = Depends(get_admin_user),
):
    archive_bytes, archive_name = build_admin_attempts_pdf_zip(current_user, payload.attempt_ids)
    return Response(
        content=archive_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": build_content_disposition(archive_name, "attachment"),
            "Cache-Control": "no-store",
        },
    )


@router.post("/attempts/email")
def admin_attempts_email(
    payload: AttemptBulkRequest,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    deliveries_by_recipient: dict[str, list[dict]] = {}
    preparation_failures = []

    for attempt_id in payload.attempt_ids:
        try:
            delivery = get_admin_report_email_delivery(current_user, attempt_id)
            recipient = str(delivery["recipient_email"]).strip().lower()
            deliveries_by_recipient.setdefault(recipient, []).append(delivery)
        except HTTPException as error:
            preparation_failures.append(
                {
                    "attempt_id": attempt_id,
                    "message": str(error.detail),
                }
            )

    sent = []
    failed = list(preparation_failures)
    for recipient, deliveries in deliveries_by_recipient.items():
        try:
            sent.append(send_reports_email(recipient, deliveries))
        except HTTPException as error:
            failed.append(
                {
                    "recipient_email": recipient,
                    "attempt_ids": [
                        str(delivery["report"].get("attemptId") or delivery["report"].get("id"))
                        for delivery in deliveries
                    ],
                    "message": str(error.detail),
                }
            )

    return {
        "requested_attempts_count": len(payload.attempt_ids),
        "recipients_count": len(deliveries_by_recipient),
        "sent_recipients_count": len(sent),
        "failed_count": len(failed),
        "sent": sent,
        "failed": failed,
    }


@router.post("/attempts/delete")
def admin_attempts_delete(
    payload: AttemptBulkRequest,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    return delete_admin_attempts(current_user, payload.attempt_ids)
