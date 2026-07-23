from functools import lru_cache

from app.core.config import settings
from app.db.repository import Repository
from app.orchestrator.meeting_pipeline import MeetingPipeline
from app.providers.llm.mistral_adapter import MistralAdapter
from app.providers.transcription.gladia_adapter import GladiaAdapter


@lru_cache
def get_repository() -> Repository:
    return Repository()


@lru_cache
def get_pipeline() -> MeetingPipeline:
    return MeetingPipeline(
        transcription_provider=GladiaAdapter(settings.gladia_api_key),
        llm_provider=MistralAdapter(settings.mistral_api_key, settings.mistral_model),
        repository=get_repository(),
        modele_llm=settings.mistral_model,
    )
