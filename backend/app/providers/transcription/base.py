from abc import ABC, abstractmethod

from app.contracts.transcript import Transcript


class TranscriptionProvider(ABC):
    @abstractmethod
    async def transcribe(
        self, meeting_id: str, audio_file: bytes, file_name: str,
        langue: str = "fr", nombre_locuteurs: int | None = None,
    ) -> Transcript:
        raise NotImplementedError
