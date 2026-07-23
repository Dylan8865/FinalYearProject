from fastapi import APIRouter, Depends, Query, Response, status

from app.db.deps import get_current_educator
from app.schemas.collection import CollectionCreate, CollectionItemCreate, CollectionShareCreate, CollectionUpdate
from app.services.collection import CollectionService

router = APIRouter(prefix='/collections', tags=['collections'])

@router.get('/mine')
async def list_collections(status_filter: str | None = None, current_user=Depends(get_current_educator)):
    return CollectionService.list_mine(current_user['id'], status_filter)

@router.get('/linked-students')
async def linked_students(current_user=Depends(get_current_educator)):
    return CollectionService.linked_students(current_user['id'])

@router.get('/student-search')
async def search_students(
    email: str = Query(min_length=2, max_length=160),
    current_user=Depends(get_current_educator),
):
    # current_user intentionally authenticates the educator before exposing
    # any student contact details.
    return CollectionService.search_students_by_email(email)

@router.get('/content-options')
async def content_options(current_user=Depends(get_current_educator)):
    return CollectionService.content_options(current_user['id'])

@router.get('/{collection_id}/editor')
async def collection_editor(collection_id: str, current_user=Depends(get_current_educator)):
    return CollectionService.editor_data(collection_id, current_user['id'])

@router.post('', status_code=status.HTTP_201_CREATED)
async def create_collection(payload: CollectionCreate, current_user=Depends(get_current_educator)):
    return CollectionService.create(current_user['id'], payload.model_dump())

@router.put('/{collection_id}')
async def update_collection(collection_id: str, payload: CollectionUpdate, current_user=Depends(get_current_educator)):
    return CollectionService.update(collection_id, current_user['id'], payload.model_dump())

@router.post('/{collection_id}/items', status_code=status.HTTP_201_CREATED)
async def add_item(collection_id: str, payload: CollectionItemCreate, current_user=Depends(get_current_educator)):
    return CollectionService.add_item(collection_id, current_user['id'], payload.model_dump())

@router.delete('/{collection_id}/items/{collection_item_id}', status_code=204)
async def remove_item(collection_id: str, collection_item_id: str, current_user=Depends(get_current_educator)):
    CollectionService.remove_item(collection_id, collection_item_id, current_user['id'])
    return Response(status_code=204)

@router.post('/{collection_id}/share', status_code=status.HTTP_204_NO_CONTENT)
async def share_collection(collection_id: str, payload: CollectionShareCreate, current_user=Depends(get_current_educator)):
    CollectionService.share(collection_id, current_user['id'], payload.model_dump(mode='json'))
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post('/{collection_id}/archive', status_code=status.HTTP_204_NO_CONTENT)
async def archive_collection(collection_id: str, current_user=Depends(get_current_educator)):
    CollectionService.archive(collection_id, current_user['id'])
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.delete('/{collection_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(collection_id: str, current_user=Depends(get_current_educator)):
    CollectionService.delete(collection_id, current_user['id'])
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post('/{collection_id}/duplicate', status_code=status.HTTP_201_CREATED)
async def duplicate_collection(collection_id: str, current_user=Depends(get_current_educator)):
    return CollectionService.duplicate(collection_id, current_user['id'])
