from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Response, status

from app.db.deps import get_current_admin, get_current_educator
from app.schemas.admin import AdminAccountActiveUpdate, AdminContentUpdate
from app.services.admin import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


def valid_content_type(content_type: str) -> str:
    if content_type not in {"video", "model"}:
        raise HTTPException(status_code=422, detail="Content type must be video or model.")
    return content_type


@router.get("/content")
async def list_content(content_type: str = Query(default="video"), _admin=Depends(get_current_admin)):
    return AdminService.list_content(valid_content_type(content_type))


@router.put("/content/{content_type}/{content_id}")
async def update_content(content_type: str, content_id: str, payload: AdminContentUpdate, admin=Depends(get_current_admin)):
    return AdminService.update_content(admin["id"], valid_content_type(content_type), content_id, payload.model_dump())


@router.delete("/content/{content_type}/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(content_type: str, content_id: str, admin=Depends(get_current_admin)):
    AdminService.delete_content(admin["id"], valid_content_type(content_type), content_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/content/{content_type}/{content_id}/lock", status_code=status.HTTP_204_NO_CONTENT)
async def lock_content(
    content_type: str,
    content_id: str,
    reason: str = Body(..., embed=True, min_length=5, max_length=500),
    admin=Depends(get_current_admin),
):
    AdminService.lock_content(admin["id"], valid_content_type(content_type), content_id, reason)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/content/{content_type}/{content_id}/unlock", status_code=status.HTTP_204_NO_CONTENT)
async def unlock_content(
    content_type: str,
    content_id: str,
    reason: Optional[str] = Body(default=None, embed=True, max_length=500),
    admin=Depends(get_current_admin),
):
    AdminService.unlock_content(admin["id"], valid_content_type(content_type), content_id, reason)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/content/{content_type}/{content_id}/soft-delete", status_code=status.HTTP_204_NO_CONTENT)
async def soft_delete_content(
    content_type: str,
    content_id: str,
    reason: str = Body(..., embed=True, min_length=5, max_length=500),
    admin=Depends(get_current_admin),
):
    AdminService.soft_delete_content(admin["id"], valid_content_type(content_type), content_id, reason)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/educator/moderation-logs")
async def educator_moderation_logs(educator=Depends(get_current_educator)):
    """Educators call this to see their own moderation alerts from admin."""
    return AdminService.educator_moderation_logs(educator["id"])


@router.get("/analytics")
async def analytics(_admin=Depends(get_current_admin)):
    return AdminService.analytics()


@router.get("/users")
async def list_users(search: Optional[str] = Query(default=None, max_length=100), _admin=Depends(get_current_admin)):
    return AdminService.list_users(search)


@router.patch("/users/{user_id}/active", status_code=status.HTTP_204_NO_CONTENT)
async def update_active_status(user_id: str, payload: AdminAccountActiveUpdate, admin=Depends(get_current_admin)):
    AdminService.set_active_status(admin["id"], user_id, payload.is_active, payload.reason)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, admin=Depends(get_current_admin)):
    AdminService.delete_user(admin["id"], user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/audit-logs")
async def audit_logs(_admin=Depends(get_current_admin)):
    return AdminService.audit_logs()
