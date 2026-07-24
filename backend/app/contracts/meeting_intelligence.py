from enum import Enum

from pydantic import BaseModel


class MeetingType(str, Enum):

    COMMERCIAL = "commercial"
    INTERNE = "interne"
    CLIENT = "client"
    ADMINISTRATIF = "administratif"
    NON_DETERMINE = "non_determine"


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
    meeting_type: MeetingType