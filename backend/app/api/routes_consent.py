from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_repository
from app.core.security import get_current_user_id
from app.db.repository import Repository

router = APIRouter(prefix="/meetings", tags=["consent"])


@router.post("/{meeting_id}/consent", status_code=status.HTTP_201_CREATED)
def create_consent(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    if repository.get_meeting(meeting_id, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="reunion introuvable")
    if repository.has_attestation(meeting_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="attestation deja enregistree")
    return repository.save_attestation(meeting_id, user_id)
