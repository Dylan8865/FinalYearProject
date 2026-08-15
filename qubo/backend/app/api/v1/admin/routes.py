from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.db.deps import get_current_admin
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
