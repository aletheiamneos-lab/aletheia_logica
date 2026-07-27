from __future__ import annotations

from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from .access_routes import router as access_router
from .activity_tracking_routes import router as activity_tracking_router
from .admitere_student_reports_routes import router as admitere_student_reports_router
from .admin_routes import router as admin_router
from .allowed_students_routes import router as allowed_students_router
from .auth_routes import router as auth_router
from .bac_student_reports_routes import router as bac_student_reports_router
from .bac_teacher_solution_routes import router as bac_teacher_solution_router
from .auth_service import get_current_user
from .learning_service import (
    get_lesson,
    get_progress_insights,
    get_progress_summary,
    list_exercises,
    list_exercises_by_lesson,
    list_lessons,
    submit_answer,
)
from .homepage_settings_routes import router as homepage_settings_router
from .integrated_tests_routes import router as integrated_tests_router
from .pdf_service import (
    build_content_disposition,
    build_export_filename,
    create_temp_pdf_path,
    generate_test_report_pdf,
)
from .submission_routes import router as submission_router
from .schemas import (
    Exercise,
    Lesson,
    ProgressInsights,
    ProgressSummary,
    TestReportPdfRequest,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
FRONTEND_ASSETS = FRONTEND_DIST / "assets"
INDEX_FILE = FRONTEND_DIST / "index.html"
LAN_ORIGIN_REGEX = (
    r"^https?://("
    r"localhost"
    r"|127(?:\.\d{1,3}){3}"
    r"|10(?:\.\d{1,3}){3}"
    r"|192\.168(?:\.\d{1,3}){2}"
    r"|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}"
    r"|[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*"
    r")(?::\d+)?$"
)


def frontend_build_exists() -> bool:
    return INDEX_FILE.exists()


app = FastAPI(
    title="Logica BAC",
    description="Aplicație locală pentru învățarea logicii.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_origin_regex=LAN_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type"],
)

app.include_router(access_router)
app.include_router(activity_tracking_router)
app.include_router(admitere_student_reports_router)
app.include_router(admin_router)
app.include_router(allowed_students_router)
app.include_router(auth_router)
app.include_router(bac_student_reports_router)
app.include_router(bac_teacher_solution_router)
app.include_router(homepage_settings_router)
app.include_router(integrated_tests_router)
app.include_router(submission_router)

if FRONTEND_ASSETS.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS), name="assets")


@app.get("/health")
def healthcheck() -> dict:
    return {"status": "ok"}


@app.post("/export/test-report-pdf")
def export_test_report_pdf(
    payload: TestReportPdfRequest,
):
    target_path = create_temp_pdf_path(payload.student_name, payload.submitted_at)
    generate_test_report_pdf(payload.model_dump(), target_path)
    return Response(
        content=target_path.read_bytes(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": build_content_disposition(
                build_export_filename(payload.student_name, payload.submitted_at)
            )
        },
    )


@app.get("/lessons", response_model=list[Lesson])
def read_lessons() -> list[dict]:
    return list_lessons()


@app.get("/lessons/{lesson_id}", response_model=Lesson)
def read_lesson(lesson_id: int) -> dict:
    return get_lesson(lesson_id)


@app.get("/exercises", response_model=list[Exercise])
def read_exercises() -> list[dict]:
    return list_exercises()


@app.get("/exercises/by-lesson/{lesson_id}", response_model=list[Exercise])
def read_exercises_by_lesson(lesson_id: int) -> list[dict]:
    return list_exercises_by_lesson(lesson_id)


@app.post("/submit-answer", response_model=SubmitAnswerResponse)
def submit_answer_route(
    payload: SubmitAnswerRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    return submit_answer(payload.exercise_id, payload.answer, current_user)


@app.get("/progress/summary", response_model=ProgressSummary)
def progress_summary(current_user: dict = Depends(get_current_user)) -> dict:
    return get_progress_summary(current_user)


@app.get("/progress/insights", response_model=ProgressInsights)
def progress_insights(current_user: dict = Depends(get_current_user)) -> dict:
    return get_progress_insights(current_user)


@app.get("/", include_in_schema=False)
def serve_root():
    if frontend_build_exists():
        return FileResponse(INDEX_FILE)
    return JSONResponse(
        status_code=503,
        content={
            "message": "Build-ul frontend lipsește. Rulează `npm run build` în folderul frontend."
        },
    )


@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    if not frontend_build_exists():
        return JSONResponse(status_code=404, content={"detail": "Resursa nu a fost găsită."})

    requested_path = FRONTEND_DIST / full_path
    if requested_path.is_file():
        return FileResponse(requested_path)

    return FileResponse(INDEX_FILE)
