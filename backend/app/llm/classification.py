import os

from mistralai.client import Mistral

from app.contracts.meeting_intelligence import MeetingType
from app.llm.prompts import MEETING_CLASSIFICATION_PROMPT

MISTRAL_MODEL = "mistral-large-latest"


class MeetingTypeClassifier:
    def __init__(self, api_key: str | None = None) -> None:
        key = api_key or os.environ.get("MISTRAL_API_KEY")
        if not key:
            raise ValueError(
                "MISTRAL_API_KEY manquante : a definir "
                "dans le fichier .env"
            )
        self._client = Mistral(api_key=key)

