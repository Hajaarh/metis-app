from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.core.config import settings
from app.core.deps import get_pipeline, get_repository
from app.core.security import get_current_user_id
from app.db.repository import Repository
from app.orchestrator.meeting_pipeline import MeetingPipeline

router = APIRouter(prefix="/meetings", tags=["meetings"])


class NouvelleReunion(BaseModel):
    titre: str
    client_id: str | None = None
    mode: str = "dictaphone"


TYPES_AUDIO_AUTORISES = (
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
    "audio/webm",
    "audio/ogg",
    "audio/opus",
    "audio/flac",
    "audio/x-flac",
)
TAILLE_MAX_OCTETS = settings.max_upload_mb * 1024 * 1024


def reunion_introuvable() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="reunion introuvable")


@router.post("", status_code=status.HTTP_201_CREATED)
def create_meeting(
    nouvelle_reunion: NouvelleReunion,
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    meeting_id = repository.create_meeting(user_id, nouvelle_reunion.titre, nouvelle_reunion.client_id, nouvelle_reunion.mode)
    jeton = repository.create_consent_link(meeting_id)
    return {"meeting_id": meeting_id, "jeton_consentement": jeton}


@router.post("/{meeting_id}/audio", status_code=status.HTTP_202_ACCEPTED)
async def upload_audio(
    meeting_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    consentement_organisateur: bool = Form(...),
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
    pipeline: MeetingPipeline = Depends(get_pipeline),
):
    if repository.get_meeting(meeting_id, user_id) is None:
        raise reunion_introuvable()
    if file.content_type not in TYPES_AUDIO_AUTORISES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="format audio non supporte"
        )
    audio_file = await file.read()
    if len(audio_file) > TAILLE_MAX_OCTETS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="fichier trop volumineux"
        )
    if not consentement_organisateur:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="consentement organisateur obligatoire"
        )
    repository.set_audio_metadata(meeting_id, file.filename, len(audio_file), file.content_type)
    repository.save_attestation(meeting_id, user_id)
    background_tasks.add_task(pipeline.run, meeting_id, audio_file, file.filename)
    return {"meeting_id": meeting_id, "statut": "en_attente"}


@router.get("")
def list_meetings(
    recherche: str | None = None,
    client_id: str | None = None,
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    return repository.list_meetings(user_id, recherche, client_id)


@router.get("/{meeting_id}")
def get_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    detail = repository.get_meeting_detail(meeting_id, user_id)
    if detail is None:
        raise reunion_introuvable()
    return detail


class RenommerLocuteur(BaseModel):
    label: str


@router.patch("/{meeting_id}/locuteurs/{locuteur_id}")
def rename_locuteur(
    meeting_id: str,
    locuteur_id: str,
    body: RenommerLocuteur,
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    if repository.get_meeting(meeting_id, user_id) is None:
        raise reunion_introuvable()
    result = repository.update_locuteur_label(locuteur_id, meeting_id, body.label)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="locuteur introuvable")
    return result


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    if not repository.delete_meeting(meeting_id, user_id):
        raise reunion_introuvable()
    return None
