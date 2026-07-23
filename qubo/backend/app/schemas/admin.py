from typing import Literal, Optional

from pydantic import BaseModel, Field


class AdminContentUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    subject_name: Optional[str] = Field(default=None, max_length=100)
    visibility: Optional[Literal["public", "private"]] = None


class AdminLockUpdate(BaseModel):
    locked: bool
    reason: Optional[str] = Field(default=None, max_length=300)


class AdminBlacklistUpdate(BaseModel):
    blacklisted: bool
    reason: Optional[str] = Field(default=None, max_length=300)


class AdminTemporaryPassword(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)


class AdminEmailResetRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
