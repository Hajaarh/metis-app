from abc import ABC, abstractmethod

from app.contracts.meeting_intelligence import MeetingIntelligence
from app.contracts.transcript import Transcript


class LLMProvider(ABC):
    @abstractmethod
    async def generate_intelligence(self, transcript: Transcript) -> MeetingIntelligence:
        raise NotImplementedError
