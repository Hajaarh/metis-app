import io

from gladiaio_sdk import GladiaClient

from app.contracts.transcript import Segment, Transcript
from app.providers.transcription.base import TranscriptionProvider

SPEAKER_LETTERS = "ABCDEFGHIJKLMNOP"


def build_transcription_options(langue: str, nombre_locuteurs: int | None) -> dict:
    options: dict = {
        "diarization": True,
        "language_config": {"languages": [langue]},
    }
    if nombre_locuteurs:
        options["diarization_config"] = {"number_of_speakers": nombre_locuteurs}
    return options


def build_speaker_label(speaker_index):
    if speaker_index is None or speaker_index >= len(SPEAKER_LETTERS):
        return "Intervenant inconnu"
    return f"Intervenant {SPEAKER_LETTERS[speaker_index]}"


def build_audio_stream(audio_file: bytes, file_name: str) -> io.BytesIO:
    flux = io.BytesIO(audio_file)
    flux.name = file_name
    return flux


class GladiaAdapter(TranscriptionProvider):
    def __init__(self, api_key: str):
        self.client = GladiaClient(api_key=api_key).prerecorded_async()

    async def transcribe(
        self, meeting_id: str, audio_file: bytes, file_name: str,
        langue: str = "fr", nombre_locuteurs: int | None = None,
    ) -> Transcript:
        flux = build_audio_stream(audio_file, file_name)
        options = build_transcription_options(langue, nombre_locuteurs)
        reponse = await self.client.transcribe(flux, options)
        return self.to_transcript(meeting_id, reponse)

    def to_transcript(self, meeting_id: str, reponse) -> Transcript:
        transcription = reponse.result.transcription
        segments = [self.to_segment(utterance) for utterance in transcription.utterances]
        langues = transcription.languages or ["fr"]
        return Transcript(meeting_id=meeting_id, segments=segments, language=langues[0])

    def to_segment(self, utterance) -> Segment:
        texte = (utterance.text or "").strip()
        return Segment(
            speaker_label=build_speaker_label(utterance.speaker),
            text=texte if texte else "[inaudible]",
            start_time=float(utterance.start),
            end_time=float(utterance.end),
            is_inaudible=texte == "",
        )
