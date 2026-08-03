from app.contracts.meeting_intelligence import MeetingIntelligence
from app.contracts.transcript import Segment, Transcript
from app.providers.llm.base import LLMProvider
from app.providers.transcription.base import TranscriptionProvider


class FakeTranscriptionProvider(TranscriptionProvider):
    def __init__(self, transcript: Transcript | None = None):
        self.transcript = transcript
        self.appels = []

    async def transcribe(self, meeting_id: str, audio_file: bytes, file_name: str) -> Transcript:
        self.appels.append((meeting_id, file_name))
        if self.transcript is not None:
            return self.transcript
        return Transcript(
            meeting_id=meeting_id,
            language="fr",
            segments=[
                Segment(
                    speaker_label="Intervenant A",
                    text="bonjour a tous",
                    start_time=0.0,
                    end_time=2.0,
                    is_inaudible=False,
                )
            ],
        )


class FakeLLMProvider(LLMProvider):
    def __init__(self, intelligence: MeetingIntelligence | None = None):
        self.intelligence = intelligence
        self.appels = []

    async def generate_intelligence(self, transcript: Transcript) -> MeetingIntelligence:
        self.appels.append(transcript.meeting_id)
        if self.intelligence is not None:
            return self.intelligence
        return MeetingIntelligence(
            summary="resume de test",
            decisions=[],
            key_points=[],
            actions=[],
            themes=[],
            meeting_type="interne",
        )
