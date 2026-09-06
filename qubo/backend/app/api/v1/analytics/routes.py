from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Response, status
from starlette.concurrency import run_in_threadpool

from app.db.deps import get_current_educator, get_current_student
from app.schemas.analytics import (
    EducatorDashboardResponse,
    PredictionSettings,
    PredictionSettingsResponse,
    ReviewScheduleItem,
    StudentLinkRequest,
    StudentLinkResponse,
    StudentSearchResponse,
    StudySessionCreate,
    StudySessionItem,
    SubjectAnalyticsItem,
    LearningRecommendationItem,
    StudyPlanResponse,
    LearningRecommendationAcceptResponse,
)
from app.services.analytics import AnalyticsService


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/subjects", response_model=List[SubjectAnalyticsItem])
async def get_subject_analytics(
    subject_id: Optional[str] = None,
    topic_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user=Depends(get_current_student),
):
    return await run_in_threadpool(
        AnalyticsService.get_subject_analytics,
        current_user["id"],
        subject_id,
        topic_id,
        date_from,
        date_to,
    )


@router.post("/study-sessions", response_model=StudySessionItem, status_code=status.HTTP_201_CREATED)
async def create_study_session(payload: StudySessionCreate, current_user=Depends(get_current_student)):
    return await run_in_threadpool(AnalyticsService.create_study_session, current_user["id"], payload)


@router.get("/study-sessions", response_model=List[StudySessionItem])
async def list_study_sessions(
    limit: int = Query(default=10, ge=1, le=50),
    current_user=Depends(get_current_student),
):
    return await run_in_threadpool(AnalyticsService.list_study_sessions, current_user["id"], limit)


@router.get("/prediction-settings", response_model=PredictionSettingsResponse)
async def get_prediction_settings(current_user=Depends(get_current_student)):
    return await run_in_threadpool(AnalyticsService.get_prediction_settings, current_user["id"])


@router.put("/prediction-settings", response_model=PredictionSettingsResponse)
async def update_prediction_settings(payload: PredictionSettings, current_user=Depends(get_current_student)):
    return await run_in_threadpool(AnalyticsService.update_prediction_settings, current_user["id"], payload.threshold)


@router.get("/recommendations", response_model=List[LearningRecommendationItem])
async def get_learning_recommendations(current_user=Depends(get_current_student)):
    return await run_in_threadpool(AnalyticsService.get_learning_recommendations, current_user["id"])


@router.post("/recommendations/generate-plan", response_model=StudyPlanResponse)
async def generate_study_plan(current_user=Depends(get_current_student)):
    return await run_in_threadpool(AnalyticsService.generate_study_plan, current_user["id"])


@router.post("/recommendations/{recommendation_id}/accept", response_model=LearningRecommendationAcceptResponse)
async def accept_learning_recommendation(recommendation_id: str, current_user=Depends(get_current_student)):
    return await run_in_threadpool(AnalyticsService.accept_learning_recommendation, current_user["id"], recommendation_id)


@router.get("/review-schedule", response_model=List[ReviewScheduleItem])
async def get_review_schedule(
    due_only: bool = False,
    current_user=Depends(get_current_student),
):
    return await run_in_threadpool(AnalyticsService.list_review_schedule, current_user["id"], due_only)


@router.get("/export/pdf")
async def export_progress_pdf(
    language: str = Query(default="en", pattern="^(en|ms)$"),
    subject_id: Optional[str] = None,
    topic_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user=Depends(get_current_student),
):
    pdf_bytes = await run_in_threadpool(
        AnalyticsService.export_progress_report,
        current_user["id"],
        language,
        subject_id,
        topic_id,
        date_from,
        date_to,
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=qubo-progress-report.pdf"},
    )


@router.get("/educator/dashboard", response_model=EducatorDashboardResponse)
async def get_educator_dashboard(current_user=Depends(get_current_educator)):
    return await run_in_threadpool(AnalyticsService.get_educator_dashboard, current_user["id"])


@router.get("/educator/students/search", response_model=StudentSearchResponse)
async def search_student_for_linking(username: str, current_user=Depends(get_current_educator)):
    return await run_in_threadpool(AnalyticsService.search_student_for_linking, current_user["id"], username)


@router.post("/educator/students", response_model=StudentLinkResponse, status_code=status.HTTP_201_CREATED)
async def link_student(payload: StudentLinkRequest, current_user=Depends(get_current_educator)):
    return await run_in_threadpool(AnalyticsService.link_student, current_user["id"], payload.username)


@router.delete("/educator/students/{student_id}", response_model=StudentLinkResponse)
async def unlink_student(student_id: str, current_user=Depends(get_current_educator)):
    return await run_in_threadpool(AnalyticsService.unlink_student, current_user["id"], student_id)
