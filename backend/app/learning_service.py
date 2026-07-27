from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone

from fastapi import HTTPException

from .seed_content import EXERCISES, LESSONS
from .supabase_service import get_server_supabase

LEGACY_PROGRESS_OWNER = "legacy-global"
FINAL_ATTEMPT_STATUSES = {"submitted", "graded", "finalized"}

_LESSONS_BY_ID = {int(lesson["id"]): lesson for lesson in LESSONS}
_EXERCISES_BY_ID = {int(exercise["id"]): exercise for exercise in EXERCISES}


def _public_exercise(exercise: dict) -> dict:
    return {
        "id": int(exercise["id"]),
        "lesson_id": int(exercise["lesson_id"]),
        "topic": exercise["topic"],
        "difficulty": exercise["difficulty"],
        "type": exercise["type"],
        "question": exercise["question"],
        "options": list(exercise["options"]),
    }


def list_lessons() -> list[dict]:
    return [dict(lesson) for lesson in LESSONS]


def get_lesson(lesson_id: int) -> dict:
    lesson = _LESSONS_BY_ID.get(int(lesson_id))
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lectia nu a fost gasita.")
    return dict(lesson)


def list_exercises() -> list[dict]:
    return [_public_exercise(exercise) for exercise in EXERCISES]


def list_exercises_by_lesson(lesson_id: int) -> list[dict]:
    return [
        _public_exercise(exercise)
        for exercise in EXERCISES
        if int(exercise["lesson_id"]) == int(lesson_id)
    ]


def _normalize_answer(value: str) -> str:
    return " ".join(str(value or "").strip().casefold().split())


def _feedback_explanation(exercise: dict, answer: str, was_correct: bool) -> str:
    if was_correct:
        return str(exercise.get("explanation") or "")
    explanations = exercise.get("incorrect_explanations") or {}
    normalized = {_normalize_answer(key): value for key, value in explanations.items()}
    return str(
        normalized.get(
            _normalize_answer(answer),
            exercise.get("explanation")
            or "Raspuns gresit. Reciteste explicatia si incearca din nou.",
        )
    )


def _owner_key(current_user: dict) -> str:
    role = str((current_user or {}).get("role") or "")
    if role == "student":
        email = str(current_user.get("email") or "").strip().casefold()
        if email:
            return f"student:{email}"
        first_name = str(current_user.get("first_name") or "").strip().casefold()
        last_name = str(current_user.get("last_name") or "").strip().casefold()
        return f"student-name:{last_name}::{first_name}"
    return "admin"


def _progress_rows(current_user: dict) -> list[dict]:
    owners = list(dict.fromkeys([_owner_key(current_user), LEGACY_PROGRESS_OWNER]))
    return (
        get_server_supabase()
        .table("learning_progress")
        .select("id,owner_key,session_id,student_email,exercise_id,was_correct,answered_at")
        .in_("owner_key", owners)
        .order("answered_at", desc=True)
        .execute()
        .data
        or []
    )


def submit_answer(exercise_id: int, answer: str, current_user: dict) -> dict:
    exercise = _EXERCISES_BY_ID.get(int(exercise_id))
    if exercise is None:
        raise HTTPException(status_code=404, detail="Exercitiul nu a fost gasit.")

    was_correct = _normalize_answer(answer) == _normalize_answer(exercise["correct_answer"])
    answered_at = datetime.now(timezone.utc).isoformat()
    get_server_supabase().table("learning_progress").insert(
        {
            "owner_key": _owner_key(current_user),
            "session_id": current_user.get("session_id") or current_user.get("id"),
            "student_email": str(current_user.get("email") or "").strip().casefold(),
            "exercise_id": int(exercise_id),
            "was_correct": was_correct,
            "answered_at": answered_at,
        }
    ).execute()

    return {
        "exercise_id": int(exercise_id),
        "was_correct": was_correct,
        "explanation": _feedback_explanation(exercise, answer, was_correct),
        "correct_answer": exercise["correct_answer"],
        "answered_at": answered_at,
    }


def _summary_from_rows(rows: list[dict]) -> dict:
    solved_ids = {int(row["exercise_id"]) for row in rows}
    correct_ids = {int(row["exercise_id"]) for row in rows if bool(row.get("was_correct"))}
    completed_lessons = []
    for lesson in LESSONS:
        exercise_ids = {
            int(exercise["id"])
            for exercise in EXERCISES
            if int(exercise["lesson_id"]) == int(lesson["id"])
        }
        if exercise_ids and exercise_ids.issubset(correct_ids):
            completed_lessons.append({"id": int(lesson["id"]), "title": lesson["title"]})

    solved = len(solved_ids)
    correct = len(correct_ids)
    return {
        "number_solved": solved,
        "number_correct": correct,
        "success_rate": round((correct / solved) * 100, 1) if solved else 0.0,
        "completed_lessons_count": len(completed_lessons),
        "completed_lessons": completed_lessons,
        "total_lessons": len(LESSONS),
        "total_exercises": len(EXERCISES),
    }


def get_progress_summary(current_user: dict) -> dict:
    return _summary_from_rows(_progress_rows(current_user))


def _parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _day_label(day_key: str) -> str:
    parsed = _parse_iso(day_key)
    if parsed is None:
        return day_key
    month_labels = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "nov", "dec"]
    return f"{parsed.day} {month_labels[parsed.month - 1]}"


def _attempt_rows(current_user: dict) -> list[dict]:
    query = (
        get_server_supabase()
        .table("attempts")
        .select("id,test_id,student_email,student_name,status,score_total,updated_at")
        .order("updated_at", desc=True)
    )
    if current_user.get("role") == "student":
        email = str(current_user.get("email") or "").strip().casefold()
        if email:
            query = query.eq("student_email", email)
    return query.execute().data or []


def _test_titles(test_ids: set[str]) -> dict[str, str]:
    if not test_ids:
        return {}
    rows = (
        get_server_supabase()
        .table("tests")
        .select("id,title")
        .in_("id", sorted(test_ids))
        .execute()
        .data
        or []
    )
    return {str(row["id"]): str(row.get("title") or row["id"]) for row in rows}


def get_progress_insights(current_user: dict) -> dict:
    progress_rows = _progress_rows(current_user)
    summary = _summary_from_rows(progress_rows)
    attempts = _attempt_rows(current_user)
    test_titles = _test_titles({str(row["test_id"]) for row in attempts})

    daily = defaultdict(lambda: {"answered_count": 0, "correct_count": 0})
    for row in progress_rows:
        day_key = str(row.get("answered_at") or "")[:10]
        if not day_key:
            continue
        daily[day_key]["answered_count"] += 1
        daily[day_key]["correct_count"] += int(bool(row.get("was_correct")))
    day_keys = sorted(daily)[-10:]
    timeline = [
        {
            "day_key": day_key,
            "label": _day_label(day_key),
            "answered_count": daily[day_key]["answered_count"],
            "correct_count": daily[day_key]["correct_count"],
            "accuracy": round(
                daily[day_key]["correct_count"] / daily[day_key]["answered_count"] * 100,
                1,
            ),
        }
        for day_key in day_keys
    ]
    if not timeline:
        timeline = [
            {
                "day_key": f"slot-{index + 1}",
                "label": f"S{index + 1}",
                "answered_count": 0,
                "correct_count": 0,
                "accuracy": 0.0,
            }
            for index in range(7)
        ]

    solved_ids = {int(row["exercise_id"]) for row in progress_rows}
    correct_ids = {int(row["exercise_id"]) for row in progress_rows if bool(row.get("was_correct"))}
    lesson_breakdown = []
    for lesson in LESSONS:
        exercise_ids = {
            int(exercise["id"])
            for exercise in EXERCISES
            if int(exercise["lesson_id"]) == int(lesson["id"])
        }
        solved_count = len(exercise_ids & solved_ids)
        correct_count = len(exercise_ids & correct_ids)
        total = len(exercise_ids)
        lesson_breakdown.append(
            {
                "lesson_id": int(lesson["id"]),
                "title": lesson["title"],
                "short_label": f"L{lesson['id']}",
                "solved_exercises": solved_count,
                "correct_exercises": correct_count,
                "total_exercises": total,
                "accuracy": round(correct_count / total * 100, 1) if total else 0.0,
            }
        )

    recent_activity = []
    for row in progress_rows[:8]:
        exercise = _EXERCISES_BY_ID.get(int(row["exercise_id"]))
        lesson = _LESSONS_BY_ID.get(int(exercise["lesson_id"])) if exercise else None
        recent_activity.append(
            {
                "id": f"progress-{row['id']}",
                "kind": "exercise",
                "label": (
                    f"Ai rezolvat corect un exercitiu din {lesson['title']}."
                    if row.get("was_correct")
                    else f"Ai revenit asupra unui exercitiu din {lesson['title']}."
                )
                if lesson
                else "Ai lucrat la un exercitiu.",
                "meta": f"Exercitiul {row['exercise_id']}",
                "occurred_at": str(row["answered_at"]),
            }
        )

    for row in attempts[:6]:
        status = str(row.get("status") or "").casefold()
        status_label = {
            "in_progress": "Test in lucru",
            "submitted": "Test trimis",
            "graded": "Test evaluat",
            "finalized": "Test evaluat",
        }.get(status, "Test actualizat")
        recent_activity.append(
            {
                "id": f"attempt-{row['id']}",
                "kind": "test",
                "label": f"{status_label}: {test_titles.get(str(row['test_id']), str(row['test_id']))}.",
                "meta": f"Scor {int(row['score_total'])}%" if row.get("score_total") is not None else "",
                "occurred_at": str(row["updated_at"]),
            }
        )
    recent_activity.sort(
        key=lambda entry: _parse_iso(entry["occurred_at"])
        or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    recent_activity = recent_activity[:8]

    completed_attempts = [
        row for row in attempts if str(row.get("status") or "").casefold() in FINAL_ATTEMPT_STATUSES
    ]
    scored_attempts = [row for row in completed_attempts if row.get("score_total") is not None]
    average_score = (
        round(sum(float(row["score_total"]) for row in scored_attempts) / len(scored_attempts), 1)
        if scored_attempts
        else float(summary["success_rate"])
    )
    latest_activity_dates = [
        parsed
        for parsed in (_parse_iso(entry["occurred_at"]) for entry in recent_activity)
        if parsed is not None
    ]

    return {
        "average_score": average_score,
        "completed_tests": len(completed_attempts),
        "latest_activity_at": max(latest_activity_dates).isoformat() if latest_activity_dates else None,
        "latest_test_title": (
            test_titles.get(str(attempts[0]["test_id"]), str(attempts[0]["test_id"]))
            if attempts
            else None
        ),
        "timeline": timeline,
        "lesson_breakdown": lesson_breakdown,
        "recent_activity": recent_activity,
    }
