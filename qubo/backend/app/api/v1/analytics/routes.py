from typing import List

from fastapi import APIRouter, Depends
from starlette.concurrency import run_in_threadpool

from app.db.deps import get_current_student
from app.schemas.analytics import SubjectAnalyticsItem
from app.services.analytics import AnalyticsService


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/subjects", response_model=List[SubjectAnalyticsItem])
async def get_subject_analytics(current_user=Depends(get_current_student)):
    return await run_in_threadpool(
        AnalyticsService.get_subject_analytics,
        current_user["id"],
    )
