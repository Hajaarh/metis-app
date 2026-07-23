from pydantic import BaseModel


class ActionItem(BaseModel):
    label: str
    responsible: str | None = None
    due_date: str | None = None


class MeetingIntelligence(BaseModel):
    summary: str
    decisions: list[str]
    key_points: list[str]
    actions: list[ActionItem]
    themes: list[str]
    meeting_type: str
