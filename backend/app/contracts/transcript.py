from pydantic import BaseModel


class Segment(BaseModel):
    speaker_label: str
    text: str
    start_time: float
    end_time: float
    is_inaudible: bool = False


class Transcript(BaseModel):
    meeting_id: str
    segments: list[Segment]
    language: str
