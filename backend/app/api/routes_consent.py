from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.deps import get_repository
from app.db.repository import Repository

router = APIRouter(prefix="/consent", tags=["consent"])


class ReponseConsentement(BaseModel):
    accepte: bool


@router.post("/{jeton}")
def submit_consent(
    jeton: str,
    reponse: ReponseConsentement,
    repository: Repository = Depends(get_repository),
):
    if not repository.submit_participant_consent(jeton, reponse.accepte):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="jeton introuvable")
    return {"statut": "enregistre"}
