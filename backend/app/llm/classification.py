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

    def classify(self, transcript: str) -> MeetingType:
        response = self._client.chat.complete(
            model=MISTRAL_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": MEETING_CLASSIFICATION_PROMPT,
                },
                {"role": "user", "content": transcript},
            ],
        )
        raw_type = response.choices[0].message.content.strip()
        return self._to_meeting_type(raw_type)

    @staticmethod
    def _to_meeting_type(raw_type: str) -> MeetingType:
        try:
            return MeetingType(raw_type.lower())
        except ValueError:
            return MeetingType.NON_DETERMINE