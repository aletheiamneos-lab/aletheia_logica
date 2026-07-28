from __future__ import annotations

import logging

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import Response

from .admitere_student_reports_service import (
    build_admitere_student_reports_pdf_zip,
    create_admitere_student_report,
    delete_admitere_student_reports,
    get_admitere_student_report,
    get_admitere_student_report_email_delivery,
    generate_admitere_student_report_pdf,
    generate_admitere_student_report_pdf_for_user,
    list_admitere_student_reports,
)
from .auth_service import get_admin_user, get_current_user
from .pdf_service import build_content_disposition
from .report_email_service import send_report_email, send_reports_email
from .schemas import ReportBulkRequest

router = APIRouter(prefix="/admitere/student-reports", tags=["admitere-student-reports"])
LOGGER = logging.getLogger("uvicorn.error")


def _pdf_response(pdf_bytes: bytes, download_name: str) -> Response:
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": build_content_disposition(download_name),
            "Cache-Control": "no-store",
        },
    )


@router.post("")
def create_report(
    payload: dict = Body(...),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return create_admitere_student_report(current_user, payload)


@router.get("/admin")
def admin_reports(current_user: dict = Depends(get_admin_user)) -> list[dict]:
    return list_admitere_student_reports(current_user)


@router.get("/admin/{report_id}")
def admin_report(report_id: str, current_user: dict = Depends(get_admin_user)) -> dict:
    return get_admitere_student_report(current_user, report_id)


@router.get("/admin/{report_id}/pdf")
def admin_report_pdf(report_id: str, current_user: dict = Depends(get_admin_user)):
    _report, pdf_bytes, download_name = generate_admitere_student_report_pdf(current_user, report_id)
    return _pdf_response(pdf_bytes, download_name)


@router.get("/{report_id}/pdf")
def own_report_pdf(report_id: str, current_user: dict = Depends(get_current_user)):
    _report, pdf_bytes, download_name = generate_admitere_student_report_pdf_for_user(current_user, report_id)
    return _pdf_response(pdf_bytes, download_name)


@router.post("/admin/{report_id}/email")
def admin_report_email(report_id: str, current_user: dict = Depends(get_admin_user)) -> dict:
    LOGGER.info("[Admitere email endpoint] START report_id=%s", report_id)
    try:
        delivery = get_admitere_student_report_email_delivery(current_user, report_id)
        response = send_report_email(
            delivery["recipient_email"],
            delivery["report"],
            pdf_bytes=delivery["pdf_bytes"],
            pdf_file_name=delivery["pdf_file_name"],
        )
        LOGGER.info(
            "[Admitere email endpoint] SUCCESS report_id=%s recipient=%s",
            report_id,
            delivery["recipient_email"],
        )
        return response
    except HTTPException as error:
        LOGGER.exception(
            "[Admitere email endpoint] ERROR report_id=%s status=%s detail=%s",
            report_id,
            error.status_code,
            error.detail,
        )
        raise
    except Exception as error:
        LOGGER.exception("[Admitere email endpoint] ERROR report_id=%s unexpected=%s", report_id, error)
        raise HTTPException(status_code=500, detail=f"Emailul Admitere nu a putut fi trimis: {error}") from error


@router.post("/admin/bulk/reports/pdf-archive")
def admin_reports_pdf_archive(
    payload: ReportBulkRequest,
    current_user: dict = Depends(get_admin_user),
):
    archive_bytes, archive_name = build_admitere_student_reports_pdf_zip(current_user, payload.report_ids)
    return Response(
        content=archive_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": build_content_disposition(archive_name), "Cache-Control": "no-store"},
    )


@router.post("/admin/bulk/reports/email")
def admin_reports_email(
    payload: ReportBulkRequest,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    LOGGER.info("[Admitere bulk email endpoint] START reports=%s", len(payload.report_ids))
    deliveries_by_recipient: dict[str, list[dict]] = {}
    failed = []
    for report_id in payload.report_ids:
        try:
            delivery = get_admitere_student_report_email_delivery(current_user, report_id)
            recipient = delivery["recipient_email"].strip().lower()
            deliveries_by_recipient.setdefault(recipient, []).append(delivery)
        except HTTPException as error:
            failed.append({"report_id": report_id, "message": str(error.detail)})
        except Exception as error:
            LOGGER.exception(
                "[Admitere bulk email endpoint] PREPARE_ERROR report_id=%s message=%s",
                report_id,
                error,
            )
            failed.append(
                {"report_id": report_id, "message": f"Raportul Admitere nu a putut fi pregatit: {error}"}
            )

    sent = []
    for recipient, deliveries in deliveries_by_recipient.items():
        try:
            sent.append(send_reports_email(recipient, deliveries))
        except HTTPException as error:
            failed.append(
                {
                    "recipient_email": recipient,
                    "report_ids": [str(delivery["report"].get("id")) for delivery in deliveries],
                    "message": str(error.detail),
                }
            )
        except Exception as error:
            LOGGER.exception(
                "[Admitere bulk email endpoint] SEND_ERROR recipient=%s message=%s",
                recipient,
                error,
            )
            failed.append(
                {
                    "recipient_email": recipient,
                    "report_ids": [str(delivery["report"].get("id")) for delivery in deliveries],
                    "message": f"Emailul Admitere nu a putut fi trimis: {error}",
                }
            )

    LOGGER.info(
        "[Admitere bulk email endpoint] DONE recipients=%s sent=%s failed=%s",
        len(deliveries_by_recipient),
        len(sent),
        len(failed),
    )
    return {
        "requested_reports_count": len(payload.report_ids),
        "recipients_count": len(deliveries_by_recipient),
        "sent_recipients_count": len(sent),
        "failed_count": len(failed),
        "sent": sent,
        "failed": failed,
    }


@router.post("/admin/bulk/reports/delete")
def admin_reports_delete(
    payload: ReportBulkRequest,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    return delete_admitere_student_reports(current_user, payload.report_ids)
