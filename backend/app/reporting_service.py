from __future__ import annotations

import csv
import html
import json
import math
import re
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from .storage_paths import DATA_DIR
from .pdf_service import build_export_filename, generate_attempt_pdf

ARCHIVE_ROOT = DATA_DIR / "archive"
DEFINITIONS_DIR = ARCHIVE_ROOT / "definitions"
REPORT_JSON_DIR = ARCHIVE_ROOT / "reports"
REPORT_HTML_DIR = ARCHIVE_ROOT / "reports_html"
REPORT_PDF_DIR = ARCHIVE_ROOT / "pdfs"
EXPORTS_DIR = ARCHIVE_ROOT / "exports"
TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"
REPORT_TEMPLATE_NAME = "integrated_test_report.html.jinja2"
CANONICAL_CATEGORY_ORDER = ["Definitii", "Clasificare", "Propozitii", "Silogisme", "Erori"]
DISPLAY_CATEGORY_ORDER = ["Definiții", "Clasificare", "Propoziții", "Silogisme", "Erori"]


def ensure_archive_directories() -> None:
    for path in [
        ARCHIVE_ROOT,
        DEFINITIONS_DIR,
        REPORT_JSON_DIR,
        REPORT_HTML_DIR,
        REPORT_PDF_DIR,
        EXPORTS_DIR,
    ]:
        path.mkdir(parents=True, exist_ok=True)


def _safe_filename_component(value: str) -> str:
    normalized = re.sub(r"\s+", "_", value.strip().upper())
    normalized = re.sub(r"[^A-Z0-9_]+", "", normalized)
    return normalized or "FISIER"


def _format_duration(duration_seconds: int) -> str:
    safe_seconds = max(duration_seconds, 0)
    minutes, seconds = divmod(safe_seconds, 60)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours}h {minutes:02d}m {seconds:02d}s"
    return f"{minutes}m {seconds:02d}s"


def _format_datetime_label(value: str | None) -> str:
    if not value:
        return "-"
    try:
        dt_value = datetime.fromisoformat(value)
    except ValueError:
        return value
    return dt_value.astimezone().strftime("%Y-%m-%d %H:%M %Z")


def _parse_report_date(value: str | None) -> str:
    if not value:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        dt_value = datetime.fromisoformat(value)
    except ValueError:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return dt_value.astimezone().strftime("%Y-%m-%d")


def _build_template_environment() -> Environment:
    return Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(enabled_extensions=("html", "xml", "jinja2")),
    )


def render_report_html(report_data: dict) -> str:
    template = _build_template_environment().get_template(REPORT_TEMPLATE_NAME)
    return template.render(**_build_integrated_html_context(report_data))


def _performance_label(score_percent: int) -> str:
    if score_percent <= 20:
        return "Început"
    if score_percent <= 50:
        return "În dezvoltare"
    if score_percent <= 79:
        return "Satisfăcător"
    if score_percent <= 99:
        return "Foarte bine"
    return "Excelent"


def _format_clock_duration(duration_seconds: int) -> str:
    safe_seconds = max(int(duration_seconds or 0), 0)
    hours, remainder = divmod(safe_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def _build_radar_svg(zones: list[dict]) -> str:
    width = 310
    height = 238
    center_x = 155
    center_y = 118
    radius = 76
    count = 5

    def point(index: int, scale: float) -> tuple[float, float]:
        angle = -math.pi / 2 + (2 * math.pi * index / count)
        return (
            center_x + radius * scale * math.cos(angle),
            center_y + radius * scale * math.sin(angle),
        )

    grid_polygons = []
    for level in (0.25, 0.5, 0.75, 1):
        points = " ".join(f"{x:.1f},{y:.1f}" for x, y in (point(index, level) for index in range(count)))
        grid_polygons.append(f'<polygon points="{points}" fill="none" stroke="#d7dedb" stroke-width="1"/>')

    axes = []
    labels = []
    values = []
    for index, zone in enumerate(zones[:count]):
        axis_x, axis_y = point(index, 1)
        axes.append(
            f'<line x1="{center_x}" y1="{center_y}" x2="{axis_x:.1f}" y2="{axis_y:.1f}" '
            'stroke="#d7dedb" stroke-width="1"/>'
        )
        label_x, label_y = point(index, 1.28)
        label = html.escape(str(zone["label"]))
        labels.append(
            f'<text x="{label_x:.1f}" y="{label_y + 3:.1f}" text-anchor="middle" '
            f'font-size="10" fill="#17353a">{label}</text>'
        )
        values.append(point(index, max(0, min(100, int(zone["percent"]))) / 100))

    value_points = " ".join(f"{x:.1f},{y:.1f}" for x, y in values)
    value_markers = "".join(
        f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3" fill="#0b665f"/>' for x, y in values
    )
    level_labels = "".join(
        f'<text x="{center_x + 4}" y="{center_y - radius * level + 3:.1f}" '
        f'font-size="8" fill="#68716f">{round(level * 100)}%</text>'
        for level in (0.25, 0.5, 0.75, 1)
    )

    return (
        f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="Performanță pe cele cinci zone">'
        + "".join(grid_polygons)
        + "".join(axes)
        + level_labels
        + f'<polygon points="{value_points}" fill="rgba(11,102,95,.28)" stroke="#0b665f" stroke-width="2"/>'
        + value_markers
        + "".join(labels)
        + "</svg>"
    )


def _estimate_html_question_height_mm(question: dict) -> float:
    question_lines = max(1, math.ceil(len(str(question.get("text") or "")) / 90))
    option_lines = sum(
        max(1, math.ceil((len(str(option_text)) + 3) / 105))
        for option_text in (question.get("options") or {}).values()
    )
    return 23 + question_lines * 3.2 + option_lines * 3.2


def _paginate_html_review_sections(review_sections: list[dict]) -> list[dict]:
    pages: list[dict] = []
    available_height_mm = 235
    card_gap_mm = 3.2

    for section in review_sections:
        current_questions: list[dict] = []
        used_height_mm = 0.0
        for question in section["questions"]:
            question_height_mm = _estimate_html_question_height_mm(question)
            required_height_mm = question_height_mm + (card_gap_mm if current_questions else 0)
            if current_questions and used_height_mm + required_height_mm > available_height_mm:
                pages.append({**section, "questions": current_questions})
                current_questions = [question]
                used_height_mm = question_height_mm
            else:
                current_questions.append(question)
                used_height_mm += required_height_mm
        if current_questions:
            pages.append({**section, "questions": current_questions})

    for page_number, page in enumerate(pages, start=2):
        page["page_number"] = page_number
    return pages


def _build_integrated_html_context(report_data: dict) -> dict:
    raw_questions = report_data.get("questions") or report_data.get("questionRows") or []
    categories = list(DISPLAY_CATEGORY_ORDER)
    category_accents = ["#0b665f", "#e77716", "#2c7fc1", "#7351b6", "#b81f3a"]
    review_sections = [
        {
            "code": f"L{index + 1}",
            "title": category.upper(),
            "questions": [],
        }
        for index, category in enumerate(categories)
    ]

    for position, question in enumerate(raw_questions):
        if not isinstance(question, dict):
            continue
        number = int(question.get("index") or question.get("orderInTest") or position + 1)
        section_index = min(max((number - 1) // 5, 0), 4)
        selected_index = question.get("selectedOptionIndex")
        if not isinstance(selected_index, int):
            selected_index = question.get("selected_option_index")
        correct_index = question.get("correctOptionIndex")
        if not isinstance(correct_index, int):
            correct_index = question.get("correct_option_index")
        is_answered = isinstance(selected_index, int)
        is_correct = is_answered and selected_index == correct_index
        status = "correct" if is_correct else "wrong" if is_answered else "incomplete"
        options = {}
        raw_options = question.get("options") or []
        for option_index, option_text in enumerate(raw_options):
            options[_option_label(option_index)] = str(option_text)

        review_sections[section_index]["questions"].append(
            {
                "number": number,
                "text": question.get("text") or question.get("questionText") or "",
                "status": status,
                "student_answer": _option_label(selected_index) if is_answered else None,
                "correct_answer": _option_label(correct_index) if isinstance(correct_index, int) else None,
                "options": options,
            }
        )

    zones = []
    for index, category in enumerate(categories):
        questions = review_sections[index]["questions"]
        correct = sum(1 for question in questions if question["status"] == "correct")
        total = len(questions)
        zones.append(
            {
                "key": category.lower(),
                "label": category,
                "correct": correct,
                "total": total,
                "percent": round((correct / total) * 100) if total else 0,
                "accent": category_accents[index],
            }
        )

    total_questions = len(raw_questions)
    correct_count = sum(zone["correct"] for zone in zones)
    score_percent = round((correct_count / total_questions) * 100) if total_questions else 0
    review_pages = _paginate_html_review_sections(review_sections)
    page_count = 1 + len(review_pages)

    return {
        "brand": {
            "title": "Logica",
            "subtitle": "by A mentor",
            "top_right_label": "TEST INTEGRAT",
            "footer_brand": "A mentor",
            "footer_tagline": "Excelență prin evaluare",
        },
        "report": {
            "title": "RAPORT FINALIZARE TEST",
            "test_name": report_data.get("testTitle") or report_data.get("test_title") or "Test integrat",
            "candidate_name": report_data.get("studentName") or report_data.get("student_name") or "Elev",
            "test_date": _parse_report_date(report_data.get("submittedAt") or report_data.get("submitted_at")),
            "question_count": total_questions,
            "score_percent": score_percent,
            "correct_count": correct_count,
            "score_fraction": f"{correct_count} / {total_questions}",
            "performance_label": _performance_label(score_percent),
            "completion_time": _format_clock_duration(
                report_data.get("durationSeconds") or report_data.get("duration_seconds") or 0
            ),
            "intro_text": (
                "Raportul afișează doar rezultatul elevului. Pentru itemii greșiți apare varianta corectă, "
                "fără explicații sau rezolvare profesor."
            ),
            "page_count_display": page_count,
        },
        "zones": zones,
        "review_sections": review_sections,
        "review_pages": review_pages,
        "radar_svg": _build_radar_svg(zones),
    }


def _option_label(index: int) -> str:
    labels = ["A", "B", "C", "D", "E"]
    if 0 <= index < len(labels):
        return labels[index]
    return str(index + 1)


def _format_option_answer(options: list[str], option_index: int | None) -> str:
    if not isinstance(option_index, int) or option_index < 0 or option_index >= len(options):
        return "Fara raspuns"
    return f"{_option_label(option_index)}. {options[option_index]}"


def _build_option_rows(options: list[str], selected_index: int | None, correct_index: int) -> list[dict]:
    option_rows = []
    for index, option_text in enumerate(options):
        option_label = _option_label(index)
        option_rows.append(
            {
                "index": index,
                "optionIndex": index,
                "option_index": index,
                "key": option_label,
                "optionKey": option_label,
                "option_key": option_label,
                "text": option_text,
                "label": f"{option_label}. {option_text}",
                "isSelected": selected_index == index,
                "is_selected": selected_index == index,
                "isCorrect": correct_index == index,
                "is_correct": correct_index == index,
            }
        )
    return option_rows


def _canonical_category_for_question_index(index: int) -> str:
    if 1 <= index <= 5:
        return "Definitii"
    if 6 <= index <= 10:
        return "Clasificare"
    if 11 <= index <= 15:
        return "Propozitii"
    if 16 <= index <= 20:
        return "Silogisme"
    if 21 <= index <= 25:
        return "Erori"
    return "Categorie"


def build_attempt_report_payload(
    test: dict,
    attempt: dict,
    questions: list[dict],
    teacher_comment: str,
    report_id: str | None = None,
) -> dict:
    answers = attempt.get("answers", {})
    lesson_scores = []
    lesson_radar = []
    category_order = list(CANONICAL_CATEGORY_ORDER)
    category_stats_map = {
        label: {
            "category": label,
            "label": label,
            "correct_count": 0,
            "total_count": 0,
            "percentage": 0,
        }
        for label in category_order
    }
    question_rows = []

    for lesson_number in range(1, 6):
        lesson_questions = [question for question in questions if question["lesson_number"] == lesson_number]
        correct_count = sum(
            1
            for question in lesson_questions
            if answers.get(question["id"]) == question["correct_option_index"]
        )
        total_count = len(lesson_questions)
        lesson_label = lesson_questions[0]["lesson_label"] if lesson_questions else f"Lectia {lesson_number}"
        percentage = round((correct_count / total_count) * 100) if total_count else 0
        lesson_scores.append(
            {
                "lesson_number": lesson_number,
                "lesson_label": lesson_label,
                "correct_count": correct_count,
                "total_count": total_count,
                "percentage": percentage,
            }
        )
        lesson_radar.append(
            {
                "lesson": lesson_number,
                "label": lesson_label,
                "percent": percentage,
                "correctCount": correct_count,
                "totalCount": total_count,
            }
        )

    for question in sorted(questions, key=lambda item: item["order_in_test"]):
        selected_index = answers.get(question["id"])
        category_label = _canonical_category_for_question_index(int(question["order_in_test"]))
        if category_label not in category_stats_map:
            category_stats_map[category_label] = {
                "category": category_label,
                "label": category_label,
                "correct_count": 0,
                "total_count": 0,
                "percentage": 0,
            }

        category_stats_map[category_label]["total_count"] += 1

        selected_label = _format_option_answer(question["options"], selected_index)
        correct_label = _format_option_answer(question["options"], question["correct_option_index"])
        is_correct = selected_index == question["correct_option_index"]
        option_rows = _build_option_rows(
            list(question["options"]),
            selected_index if isinstance(selected_index, int) else None,
            question["correct_option_index"],
        )
        if is_correct:
            category_stats_map[category_label]["correct_count"] += 1

        is_answered = isinstance(selected_index, int)
        status_label = "Corect" if is_correct else "Greșit" if is_answered else "Necompletat"

        question_rows.append(
            {
                "id": question["id"],
                "index": question["order_in_test"],
                "orderInTest": question["order_in_test"],
                "order_in_test": question["order_in_test"],
                "lesson": category_label,
                "lesson_label": category_label,
                "lessonLabel": category_label,
                "category": category_label,
                "category_label": category_label,
                "categoryLabel": category_label,
                "text": question["text"],
                "questionText": question["text"],
                "question_text": question["text"],
                "options": list(question["options"]),
                "optionRows": option_rows,
                "option_rows": option_rows,
                "selected_answer": selected_label,
                "studentAnswerLabel": selected_label,
                "student_answer_label": selected_label,
                "correct_answer": correct_label,
                "correctAnswerLabel": correct_label,
                "correct_answer_label": correct_label,
                "selectedOptionIndex": selected_index if isinstance(selected_index, int) else None,
                "selected_option_index": selected_index if isinstance(selected_index, int) else None,
                "correctOptionIndex": question["correct_option_index"],
                "correct_option_index": question["correct_option_index"],
                "selectedOptionKey": _option_label(selected_index)
                if isinstance(selected_index, int) and 0 <= selected_index < len(question["options"])
                else "",
                "selected_option_key": _option_label(selected_index)
                if isinstance(selected_index, int) and 0 <= selected_index < len(question["options"])
                else "",
                "correctOptionKey": _option_label(question["correct_option_index"]),
                "correct_option_key": _option_label(question["correct_option_index"]),
                "statusLabel": status_label,
                "status_label": status_label,
                "status": "correct" if is_correct else "wrong" if is_answered else "incomplete",
                "isAnswered": is_answered,
                "is_answered": is_answered,
                "isCorrect": is_correct,
                "is_correct": is_correct,
            }
        )

    category_breakdown = []
    for category_label in category_order + [label for label in category_stats_map if label not in category_order]:
        entry = category_stats_map[category_label]
        entry["percentage"] = round((entry["correct_count"] / entry["total_count"]) * 100) if entry["total_count"] else 0
        category_breakdown.append(
            {
                "category": entry["category"],
                "label": entry["label"],
                "correct": entry["correct_count"],
                "correctCount": entry["correct_count"],
                "correct_count": entry["correct_count"],
                "total": entry["total_count"],
                "totalCount": entry["total_count"],
                "total_count": entry["total_count"],
                "percentage": entry["percentage"],
            }
        )

    score_percent = round((attempt["correct_count"] / len(questions)) * 100) if questions else 0
    normalized_report_id = report_id or str(uuid.uuid4())
    student_name = attempt["student_display_name"]
    submitted_at_label = _format_datetime_label(attempt["submitted_at"])
    duration_label = _format_duration(attempt["duration_seconds"])
    status_value = attempt["status"]
    status_label = {
        "in_progress": "In lucru",
        "submitted": "Trimis",
        "graded": "Corectat",
    }.get(status_value, status_value)

    return {
        "id": normalized_report_id,
        "testType": "integrated",
        "test_type": "integrated",
        "attemptId": attempt["id"],
        "attempt_id": attempt["id"],
        "studentName": student_name,
        "student_name": student_name,
        "studentFirstName": attempt["student_first_name"],
        "student_first_name": attempt["student_first_name"],
        "studentLastName": attempt["student_last_name"],
        "student_last_name": attempt["student_last_name"],
        "student_display_name": student_name,
        "testId": test["id"],
        "test_id": test["id"],
        "testTitle": test["title"],
        "test_title": test["title"],
        "testSlug": test["slug"],
        "test_slug": test["slug"],
        "durationSeconds": attempt["duration_seconds"],
        "duration_seconds": attempt["duration_seconds"],
        "durationLabel": duration_label,
        "duration_label": duration_label,
        "scorePercent": score_percent,
        "score_percentage": score_percent,
        "lessonRadar": lesson_radar,
        "lesson_radar": lesson_radar,
        "lesson_scores": lesson_scores,
        "categoryBreakdown": category_breakdown,
        "category_breakdown": category_breakdown,
        "categories": category_breakdown,
        "teacherComment": teacher_comment,
        "teacher_comment": teacher_comment,
        "submittedAt": attempt["submitted_at"],
        "submitted_at": attempt["submitted_at"],
        "submittedAtLabel": submitted_at_label,
        "submitted_at_label": submitted_at_label,
        "status": status_value,
        "statusLabel": status_label,
        "status_label": status_label,
        "correctCount": attempt["correct_count"],
        "correct_count": attempt["correct_count"],
        "wrongCount": attempt["wrong_count"],
        "wrong_count": attempt["wrong_count"],
        "totalQuestions": len(questions),
        "total_questions": len(questions),
        "uniqueCode": attempt["unique_code"],
        "unique_code": attempt["unique_code"],
        "questionRows": question_rows,
        "questions": question_rows,
    }


def persist_report_bundle(report_data: dict) -> dict[str, str]:
    ensure_archive_directories()

    bundle_paths = _report_bundle_paths(report_data)
    json_path = bundle_paths["json_path"]
    html_path = bundle_paths["html_path"]
    pdf_path = bundle_paths["pdf_path"]
    flat_pdf_path = bundle_paths["flat_pdf_path"]

    rendered_html = render_report_html(report_data)

    json_path.write_text(json.dumps(report_data, ensure_ascii=False, indent=2), encoding="utf-8")
    html_path.write_text(rendered_html, encoding="utf-8")
    generate_attempt_pdf(report_data, pdf_path)
    shutil.copy2(pdf_path, flat_pdf_path)

    return {key: str(path.resolve()) for key, path in bundle_paths.items()}


def _report_bundle_paths(report_data: dict) -> dict[str, Path]:
    report_date = _parse_report_date(report_data.get("submittedAt") or report_data.get("submitted_at"))
    report_id = report_data["id"]
    attempt_id = report_data["attemptId"]
    test_slug = report_data.get("testSlug") or report_data.get("test_slug") or "test"

    json_path = REPORT_JSON_DIR / f"{report_id}.json"
    html_path = REPORT_HTML_DIR / f"{report_id}.html"
    pdf_dir = REPORT_PDF_DIR / _safe_filename_component(test_slug).lower() / report_date / attempt_id
    pdf_file_name = build_export_filename(
        report_data.get("studentName") or report_data.get("student_name"),
        report_data.get("submittedAt") or report_data.get("submitted_at"),
        student_first_name=report_data.get("studentFirstName") or report_data.get("student_first_name"),
        student_last_name=report_data.get("studentLastName") or report_data.get("student_last_name"),
    )
    pdf_path = pdf_dir / pdf_file_name
    flat_pdf_path = REPORT_PDF_DIR / f"{report_id}.pdf"

    return {
        "json_path": json_path,
        "html_path": html_path,
        "pdf_path": pdf_path,
        "flat_pdf_path": flat_pdf_path,
    }


def delete_persisted_report_bundle(report_data: dict) -> list[str]:
    removed_paths = []
    bundle_paths = _report_bundle_paths(report_data)
    for target_path in bundle_paths.values():
        if target_path.exists() and target_path.is_file():
            target_path.unlink()
            removed_paths.append(str(target_path.resolve()))

    nested_pdf_dir = bundle_paths["pdf_path"].parent
    if nested_pdf_dir.exists() and nested_pdf_dir.is_dir() and not any(nested_pdf_dir.iterdir()):
        nested_pdf_dir.rmdir()

    return removed_paths


def save_test_definition_snapshot(test_data: dict) -> str:
    ensure_archive_directories()
    target_path = DEFINITIONS_DIR / f"{_safe_filename_component(test_data['slug'])}.json"
    target_path.write_text(json.dumps(test_data, ensure_ascii=False, indent=2), encoding="utf-8")
    return str(target_path.resolve())


def build_centralized_csv_export(report_rows: list[dict]) -> str:
    ensure_archive_directories()
    timestamp_label = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    export_path = EXPORTS_DIR / f"export_centralizat_{timestamp_label}.csv"

    with export_path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(
            csv_file,
            fieldnames=[
                "report_id",
                "attempt_id",
                "student_name",
                "test_title",
                "status",
                "submitted_at",
                "duration_seconds",
                "score_percent",
                "pdf_path",
            ],
        )
        writer.writeheader()
        for row in report_rows:
            writer.writerow(row)

    return str(export_path.resolve())
