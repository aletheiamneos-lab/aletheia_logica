from datetime import datetime

from pydantic import BaseModel, Field, model_validator

DEFAULT_STANDARD_CATEGORIES = [
    "Definitii",
    "Clasificare",
    "Propozitii categorice",
    "Silogisme si rationamente",
    "Erori de rationament",
]

DEFAULT_STANDARD_REPORT_TEMPLATE = {
    "include_score": True,
    "include_category_breakdown": True,
    "include_correct_answers": True,
    "include_justifications": True,
    "include_student_answers": True,
    "include_recommendations": True,
}


class Lesson(BaseModel):
    id: int
    title: str
    short_text: str
    formal_text: str
    example_text: str
    topic: str


class Exercise(BaseModel):
    id: int
    lesson_id: int
    topic: str
    difficulty: str
    type: str
    question: str
    options: list[str]


class SubmitAnswerRequest(BaseModel):
    exercise_id: int = Field(..., ge=1)
    answer: str = Field(..., min_length=1)


class SubmitAnswerResponse(BaseModel):
    exercise_id: int
    was_correct: bool
    explanation: str
    correct_answer: str
    answered_at: datetime


class CompletedLesson(BaseModel):
    id: int
    title: str


class ProgressSummary(BaseModel):
    number_solved: int
    number_correct: int
    success_rate: float
    completed_lessons_count: int
    completed_lessons: list[CompletedLesson]
    total_lessons: int
    total_exercises: int


class ProgressTimelinePoint(BaseModel):
    day_key: str
    label: str
    answered_count: int
    correct_count: int
    accuracy: float


class ProgressLessonBreakdown(BaseModel):
    lesson_id: int
    title: str
    short_label: str
    solved_exercises: int
    correct_exercises: int
    total_exercises: int
    accuracy: float


class ProgressRecentActivity(BaseModel):
    id: str
    kind: str
    label: str
    meta: str = ""
    occurred_at: str


class ProgressInsights(BaseModel):
    average_score: float
    completed_tests: int
    latest_activity_at: str | None = None
    latest_test_title: str | None = None
    timeline: list[ProgressTimelinePoint]
    lesson_breakdown: list[ProgressLessonBreakdown]
    recent_activity: list[ProgressRecentActivity]


class SessionResponse(BaseModel):
    session_id: str
    role: str
    first_name: str
    last_name: str
    display_name: str
    initials: str
    created_at: datetime
    last_seen_at: datetime


class StudentLoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    name: str = Field(..., min_length=1, max_length=160)

    @model_validator(mode="after")
    def validate_student_identity(self) -> "StudentLoginRequest":
        self.email = self.email.strip().casefold()
        self.name = " ".join(self.name.strip().split())
        if "@" not in self.email or self.email.startswith("@") or self.email.endswith("@"):
            raise ValueError("Adresa de email nu este valida.")
        if not self.name:
            raise ValueError("Numele este obligatoriu.")
        return self


class AllowedStudentCreateRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    name: str = Field(..., min_length=1, max_length=160)

    @model_validator(mode="after")
    def normalize_values(self) -> "AllowedStudentCreateRequest":
        self.email = self.email.strip().casefold()
        self.name = " ".join(self.name.strip().split())
        if "@" not in self.email or self.email.startswith("@") or self.email.endswith("@"):
            raise ValueError("Adresa de email nu este valida.")
        return self


class AllowedStudentPatchRequest(BaseModel):
    is_blocked: bool | None = None
    force_logout: bool | None = None

    @model_validator(mode="after")
    def require_change(self) -> "AllowedStudentPatchRequest":
        if self.is_blocked is None and self.force_logout is None:
            raise ValueError("Trimite is_blocked sau force_logout.")
        return self


class AllowedStudentsBulkBlockRequest(BaseModel):
    is_blocked: bool


class TeacherLoginRequest(BaseModel):
    password: str = Field(..., min_length=1, max_length=128)


class SubmitTestRequest(BaseModel):
    attempt_id: str = Field(..., min_length=1, alias="attemptId")


class ChangeTeacherPasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    @model_validator(mode="after")
    def validate_confirmation(self) -> "ChangeTeacherPasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("Confirmarea parolei noi nu corespunde.")
        return self


class HomepageStudyPlanRow(BaseModel):
    row_id: str = Field(..., min_length=1, max_length=160)
    lesson_id: int | None = Field(default=None, ge=1)
    title: str = Field(default="", max_length=160)
    helper: str = Field(default="", max_length=280)
    start: int = Field(..., ge=0, le=24)
    duration: int = Field(..., ge=1, le=12)
    progress_percent: int = Field(default=0, ge=0, le=100)


class HomepageStudyPlanPayload(BaseModel):
    start_date: str = Field(default="", max_length=20)
    rows: list[HomepageStudyPlanRow] = Field(default_factory=list)


class IntegratedTestQuestionInput(BaseModel):
    id: str | None = None
    lesson_number: int = Field(..., ge=1, le=5)
    lesson_label: str = Field(..., min_length=1, max_length=64)
    text: str = ""
    options: list[str] = Field(..., min_length=4, max_length=5)
    correct_option_index: int = Field(..., ge=0)
    category: str = Field(default="", min_length=1, max_length=128)
    answer_type: str = Field(default="single", min_length=1, max_length=32)
    justification: str | None = None
    source_lesson: str | None = Field(default=None, max_length=128)
    tags: list[str] = Field(default_factory=list)
    explanation: str | None = None
    difficulty: str | None = None
    order_in_lesson: int = Field(..., ge=1)
    order_in_test: int = Field(..., ge=1)

    @model_validator(mode="after")
    def validate_options(self) -> "IntegratedTestQuestionInput":
        if len(self.options) not in {4, 5}:
            raise ValueError("Fiecare intrebare trebuie sa aiba 4 sau 5 variante.")
        if self.correct_option_index >= len(self.options):
            raise ValueError("Varianta corecta depaseste numarul de optiuni disponibile.")
        if self.answer_type not in {"single", "multiple"}:
            raise ValueError("answer_type trebuie sa fie single sau multiple.")
        return self


class IntegratedTestPayload(BaseModel):
    title: str = Field(..., min_length=1, max_length=180)
    slug: str | None = Field(default=None, max_length=180)
    description: str = Field(..., min_length=1)
    duration_minutes: int = Field(..., ge=5, le=240)
    difficulty_label: str = Field(default="necalibrat", min_length=1, max_length=64)
    is_active: bool = False
    is_draft: bool = True
    is_visible_to_students: bool = False
    schema_version: str = Field(default="1.0", min_length=1, max_length=16)
    subject: str = Field(default="Logica", min_length=1, max_length=64)
    level: str = Field(default="bac_admitere", min_length=1, max_length=64)
    language: str = Field(default="ro", min_length=1, max_length=16)
    categories: list[str] = Field(default_factory=lambda: list(DEFAULT_STANDARD_CATEGORIES))
    report_template: dict[str, bool] = Field(
        default_factory=lambda: dict(DEFAULT_STANDARD_REPORT_TEMPLATE),
    )
    questions: list[IntegratedTestQuestionInput] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_categories(self) -> "IntegratedTestPayload":
        if len(self.categories) != 5:
            raise ValueError("Testul trebuie sa aiba exact 5 categorii standard.")
        normalized_categories = [category.strip() for category in self.categories if category.strip()]
        if len(normalized_categories) != 5:
            raise ValueError("Toate categoriile standard trebuie completate.")
        self.categories = normalized_categories
        return self


class AttemptStartRequest(BaseModel):
    test_id: str = Field(..., min_length=1)


class AttemptProgressRequest(BaseModel):
    current_question_index: int = Field(..., ge=0)
    answers: dict[str, int] = Field(default_factory=dict)
    elapsed_seconds: int = Field(..., ge=0)


class TeacherCommentUpdateRequest(BaseModel):
    teacher_comment: str = Field(default="", max_length=5000)


class StudentMarkerUpdateRequest(BaseModel):
    marker_label: str | None = Field(default=None, max_length=12)
    accent_color: str | None = Field(default=None, max_length=32)


class AttemptBulkRequest(BaseModel):
    attempt_ids: list[str] = Field(..., min_length=1, max_length=200)

    @model_validator(mode="after")
    def normalize_attempt_ids(self) -> "AttemptBulkRequest":
        normalized_ids = list(
            dict.fromkeys(str(attempt_id).strip() for attempt_id in self.attempt_ids if str(attempt_id).strip())
        )
        if not normalized_ids:
            raise ValueError("Selecteaza cel putin o incercare.")
        self.attempt_ids = normalized_ids
        return self


class ReportBulkRequest(BaseModel):
    report_ids: list[str] = Field(..., min_length=1, max_length=200)

    @model_validator(mode="after")
    def normalize_report_ids(self) -> "ReportBulkRequest":
        normalized_ids = list(
            dict.fromkeys(str(report_id).strip() for report_id in self.report_ids if str(report_id).strip())
        )
        if not normalized_ids:
            raise ValueError("Selecteaza cel putin un raport.")
        self.report_ids = normalized_ids
        return self


class PdfCategoryStat(BaseModel):
    label: str = Field(..., min_length=1, max_length=160)
    correct: int = Field(default=0, ge=0)
    total: int = Field(default=0, ge=0)


class PdfQuestionRow(BaseModel):
    index: int = Field(..., ge=1)
    lesson: str = Field(..., min_length=1, max_length=160)
    question_text: str = Field(default="", max_length=5000)
    selected_answer: str = Field(default="", max_length=2000)
    correct_answer: str = Field(default="", max_length=2000)
    is_correct: bool = False


class TestReportPdfRequest(BaseModel):
    student_name: str = Field(..., min_length=1, max_length=180)
    test_title: str = Field(..., min_length=1, max_length=240)
    attempt_id: str = Field(default="", max_length=180)
    submitted_at: str = Field(default="", max_length=180)
    duration_seconds: int = Field(default=0, ge=0)
    admin_comment: str | None = Field(default="", max_length=5000)
    categories: list[PdfCategoryStat] = Field(default_factory=list)
    questions: list[PdfQuestionRow] = Field(default_factory=list)


class ActivityLinkOpenRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)
    public_link_code: str = Field(..., min_length=1, max_length=128)


class ActivityStudentIdentifyRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)
    name: str = Field(..., min_length=1, max_length=160)
    class_name: str | None = Field(default=None, max_length=80)
    email: str | None = Field(default=None, max_length=180)


class ActivityTestStartRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)
    student_id: int = Field(..., ge=1)
    test_id: str = Field(..., min_length=1, max_length=180)
    test_title: str = Field(..., min_length=1, max_length=220)


class ActivityTestProgressRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)
    student_id: int = Field(..., ge=1)
    test_session_id: int = Field(..., ge=1)
    question_index: int = Field(..., ge=0)
    selected_answer: str | None = Field(default=None, max_length=20)
    is_correct: bool | None = None
    answered_count: int | None = Field(default=None, ge=0)
    total_questions: int | None = Field(default=None, ge=0)
    event_type: str | None = Field(default=None, max_length=40)


class ActivityTestSubmitRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)
    student_id: int = Field(..., ge=1)
    test_session_id: int = Field(..., ge=1)
    score: float = Field(..., ge=0)
    correct_answers: int = Field(..., ge=0)
    wrong_answers: int = Field(..., ge=0)
    total_questions: int = Field(..., ge=1)
