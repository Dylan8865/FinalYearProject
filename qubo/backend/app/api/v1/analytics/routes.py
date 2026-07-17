from typing import List

from fastapi import APIRouter, Depends, Query, status
from starlette.concurrency import run_in_threadpool

from app.db.deps import get_current_educator, get_current_student
from app.schemas.analytics import (
    EducatorDashboardResponse,
    PredictionSettings,
    PredictionSettingsResponse,
    StudentLinkRequest,
    StudentLinkResponse,
    StudySessionCreate,
    StudySessionItem,
    SubjectAnalyticsItem,
)
from app.services.analytics import AnalyticsService


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/subjects", response_model=List[SubjectAnalyticsItem])
async def get_subject_analytics(current_user=Depends(get_current_student)):
    return await run_in_threadpool(AnalyticsService.get_subject_analytics, current_user["id"])


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


@router.get("/educator/dashboard", response_model=EducatorDashboardResponse)
async def get_educator_dashboard(current_user=Depends(get_current_educator)):
    return await run_in_threadpool(AnalyticsService.get_educator_dashboard, current_user["id"])


@router.post("/educator/students", response_model=StudentLinkResponse, status_code=status.HTTP_201_CREATED)
async def link_student(payload: StudentLinkRequest, current_user=Depends(get_current_educator)):
    return await run_in_threadpool(AnalyticsService.link_student, current_user["id"], payload.username)


@router.delete("/educator/students/{student_id}", response_model=StudentLinkResponse)
async def unlink_student(student_id: str, current_user=Depends(get_current_educator)):
    return await run_in_threadpool(AnalyticsService.unlink_student, current_user["id"], student_id)
