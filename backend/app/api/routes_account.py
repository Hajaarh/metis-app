from fastapi import APIRouter, Depends, status

from app.core.deps import get_repository
from app.core.security import get_current_user_id
from app.db.repository import Repository

router = APIRouter(prefix="/account", tags=["account"])


@router.get("/data")
def export_data(
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    return repository.export_user_data(user_id)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    repository.delete_user_account(user_id)
    return None
