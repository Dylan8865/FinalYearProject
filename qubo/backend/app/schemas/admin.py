from typing import Literal, Optional

from pydantic import BaseModel, Field


class AdminContentUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    subject_name: Optional[str] = Field(default=None, max_length=100)
    visibility: Optional[Literal["public", "private"]] = None


class AdminAccountActiveUpdate(BaseModel):
    is_active: bool
    reason: Optional[str] = Field(default=None, max_length=300)
