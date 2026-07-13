from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.db.deps import get_current_student
from app.schemas.quiz import GeneratedQuizResponse
from app.services.quiz import GeminiQuizService


router = APIRouter(prefix="/quiz", tags=["quiz"])
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "application/pdf"}
MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024
MAX_TOTAL_SIZE_BYTES = 16 * 1024 * 1024


@router.post("/generate", response_model=GeneratedQuizResponse)
async def generate_quiz(
    files: List[UploadFile] = File(...),
    question_type: str = Form("mcq"),
    difficulty: str = Form("Intermediate"),
    question_count: int = Form(5),
    current_user=Depends(get_current_student),
):
    if question_type not in {"mcq", "fill", "short"}:
        raise HTTPException(status_code=400, detail="Unsupported question type")
    if difficulty not in {"Beginner", "Intermediate", "Advanced"}:
        raise HTTPException(status_code=400, detail="Unsupported difficulty level")
    if question_count < 1 or question_count > 10:
        raise HTTPException(status_code=400, detail="Question count must be between 1 and 10")
    if not files or len(files) > 4:
        raise HTTPException(status_code=400, detail="Upload between one and four files")

    prepared_files = []
    total_size = 0
    for upload in files:
        if upload.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file type: {upload.filename}",
            )
        content = await upload.read(MAX_FILE_SIZE_BYTES + 1)
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=413, detail=f"File is too large: {upload.filename}")
        total_size += len(content)
        if total_size > MAX_TOTAL_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="Combined uploads must be 16 MB or less")
        prepared_files.append((upload.filename or "study-material", upload.content_type, content))

    return await run_in_threadpool(
        GeminiQuizService.generate_quiz,
        prepared_files,
        question_type,
        difficulty,
        question_count,
    )

