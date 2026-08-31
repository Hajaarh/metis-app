from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.ws_manager import manager
from app.core.deps import get_repository
from app.db.repository import Repository

router = APIRouter(prefix="/consent", tags=["consent"])


class ReponseConsentement(BaseModel):
    accepte: bool


@router.get("/{jeton}")
def get_consent(
    jeton: str,
    repository: Repository = Depends(get_repository),
):
    context = repository.get_consent_context(jeton)
    if context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="jeton introuvable")
    return context


@router.post("/{jeton}")
async def submit_consent(
    jeton: str,
    reponse: ReponseConsentement,
    repository: Repository = Depends(get_repository),
):
    result = repository.submit_participant_consent(jeton, reponse.accepte)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="jeton introuvable")
    choix = "accepte" if reponse.accepte else "refuse"
    counts = repository.get_consent_count(result["reunion_id"])
    await manager.broadcast(result["reunion_id"], {
        "type": "consentement",
        "choix": choix,
        "signes": counts["signes"],
        "total": counts["total"],
        "retractation": False,
    })
    return {"statut": "enregistre", "jeton_retractation": result["jeton_retractation"]}


@router.delete("/{jeton_retractation}")
async def retract_consent(
    jeton_retractation: str,
    repository: Repository = Depends(get_repository),
):
    reunion_id = repository.retract_consent(jeton_retractation)
    if reunion_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="jeton introuvable")
    counts = repository.get_consent_count(reunion_id)
    await manager.broadcast(reunion_id, {
        "type": "consentement",
        "choix": "refuse",
        "signes": counts["signes"],
        "total": counts["total"],
        "retractation": True,
    })
    return {"statut": "retracte"}
