from app.api.ws_manager import manager
from app.contracts.meeting_intelligence import MeetingIntelligence
from app.contracts.transcript import Transcript
from app.db import models
from app.db.repository import Repository
from app.providers.llm.base import LLMProvider
from app.providers.transcription.base import TranscriptionProvider


class AttestationManquanteError(Exception):
    pass


class ConsentementRefuseError(Exception):
    pass


def duree_totale(transcript: Transcript) -> int | None:
    if not transcript.segments:
        return None
    return round(max(segment.end_time for segment in transcript.segments))


class MeetingPipeline:
    def __init__(
        self,
        transcription_provider: TranscriptionProvider,
        llm_provider: LLMProvider,
        repository: Repository,
        modele_llm: str,
    ):
        self.transcription_provider = transcription_provider
        self.llm_provider = llm_provider
        self.repository = repository
        self.modele_llm = modele_llm

    async def run(
        self, reunion_id: str, audio_file: bytes, file_name: str,
        langue: str = "fr", nombre_locuteurs: int | None = None,
    ) -> MeetingIntelligence:
        base_legale = self.repository.get_meeting_base_legale(reunion_id)
        if base_legale != models.BASE_LEGALE_INTERET_LEGITIME:
            if not self.repository.has_attestation(reunion_id):
                self.repository.set_meeting_status(reunion_id, models.STATUT_ATTESTATION_MANQUANTE)
                raise AttestationManquanteError(reunion_id)
            if self.repository.has_refused_consent(reunion_id):
                self.repository.set_meeting_status(reunion_id, models.STATUT_CONSENTEMENT_REFUSE)
                raise ConsentementRefuseError(reunion_id)
        try:
            self.repository.set_meeting_status(reunion_id, models.STATUT_TRANSCRIPTION)
            await manager.broadcast(reunion_id, {"type": "reunion", "statut_traitement": models.STATUT_TRANSCRIPTION, "message_erreur": None})

            transcript = await self.transcription_provider.transcribe(
                reunion_id, audio_file, file_name, langue, nombre_locuteurs
            )
            segment_ids = self.repository.save_transcript(transcript)
            duree = duree_totale(transcript)
            if duree is not None:
                self.repository.set_meeting_duration(reunion_id, duree)

            self.repository.set_meeting_status(reunion_id, models.STATUT_ANALYSE)
            await manager.broadcast(reunion_id, {"type": "reunion", "statut_traitement": models.STATUT_ANALYSE, "message_erreur": None})

            intelligence = await self.llm_provider.generate_intelligence(transcript)
            self.repository.save_intelligence(reunion_id, intelligence, self.modele_llm, segment_ids)

            self.repository.log_audio_purge(reunion_id)
            self.repository.set_meeting_status(reunion_id, models.STATUT_TERMINE)
            await manager.broadcast(reunion_id, {"type": "reunion", "statut_traitement": models.STATUT_TERMINE, "message_erreur": None})
            return intelligence
        except Exception as exception:
            self.repository.set_meeting_error(reunion_id, str(exception))
            await manager.broadcast(reunion_id, {"type": "reunion", "statut_traitement": models.STATUT_ERREUR, "message_erreur": str(exception)})
            raise
