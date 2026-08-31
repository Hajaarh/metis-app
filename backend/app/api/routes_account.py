from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.deps import get_repository
from app.core.security import get_current_user_id
from app.db.client import get_supabase_client
from app.db.repository import Repository

router = APIRouter(prefix="/account", tags=["account"])


class UpdateProfile(BaseModel):
    duree_retention_jours: int


@router.get("/profile")
def get_profile(
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    profile = repository.get_user_profile(user_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="profil introuvable")
    return profile


@router.patch("/profile")
def update_profile(
    data: UpdateProfile,
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    return repository.update_user_profile(user_id, data.duree_retention_jours)


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
    client=Depends(get_supabase_client),
):
    try:
        client.auth.admin.delete_user(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="suppression impossible")
    repository.delete_user_account(user_id)
    return None
