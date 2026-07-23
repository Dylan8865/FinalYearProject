from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.db.deps import get_current_admin
from app.schemas.admin import AdminBlacklistUpdate, AdminContentUpdate, AdminEmailResetRequest, AdminLockUpdate, AdminTemporaryPassword
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
async def list_users(search: str | None = Query(default=None, max_length=100), _admin=Depends(get_current_admin)):
    return AdminService.list_users(search)


@router.patch("/users/{user_id}/lock", status_code=status.HTTP_204_NO_CONTENT)
async def update_lock(user_id: str, payload: AdminLockUpdate, admin=Depends(get_current_admin)):
    AdminService.set_lock(admin["id"], user_id, payload.locked, payload.reason)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/users/{user_id}/blacklist", status_code=status.HTTP_204_NO_CONTENT)
async def update_blacklist(user_id: str, payload: AdminBlacklistUpdate, admin=Depends(get_current_admin)):
    AdminService.set_blacklist(admin["id"], user_id, payload.blacklisted, payload.reason)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/users/{user_id}/temporary-password", status_code=status.HTTP_204_NO_CONTENT)
async def set_temporary_password(user_id: str, payload: AdminTemporaryPassword, admin=Depends(get_current_admin)):
    AdminService.set_temporary_password(admin["id"], user_id, payload.new_password)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/users/password-reset-email", status_code=status.HTTP_204_NO_CONTENT)
async def send_password_reset_email(payload: AdminEmailResetRequest, admin=Depends(get_current_admin)):
    AdminService.send_password_reset(admin["id"], payload.email)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, admin=Depends(get_current_admin)):
    AdminService.delete_user(admin["id"], user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/audit-logs")
async def audit_logs(_admin=Depends(get_current_admin)):
    return AdminService.audit_logs()
