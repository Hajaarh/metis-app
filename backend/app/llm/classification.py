import os

from mistralai.client import Mistral

from app.contracts.meeting_intelligence import MeetingType
from app.llm.prompts import MEETING_CLASSIFICATION_PROMPT

MISTRAL_MODEL = "mistral-large-latest"


