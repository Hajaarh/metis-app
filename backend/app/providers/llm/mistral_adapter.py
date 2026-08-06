from mistralai.client import Mistral

from app.contracts.meeting_intelligence import MeetingIntelligence
from app.contracts.transcript import Transcript
from app.providers.llm.base import LLMProvider

SYSTEM_PROMPT = (
    "Tu analyses la transcription d'une reunion professionnelle. "
    "Tu ne restitues que ce qui est explicitement present dans la transcription. "
    "Tu n'inventes aucune decision, aucune action, aucun responsable, aucune date. "
    "Tu ne proposes jamais de conseil ni de recommandation. "
    "Tu ne modifies jamais le sens des propos et tu ne reformules pas le fond. "
    "Tu ne generes aucune information absente de la reunion. "
    "Si un responsable n'est pas nomme, laisse responsible a null. "
    "Si une date n'est pas dite, laisse due_date a null. "
    "Tu ne completes pas les passages marques inaudible. "
    "Tu produis entre 1 et 6 themes. "
    "Tu classes la reunion dans meeting_type selon une seule de ces quatre categories : "
    "commercial pour un echange avec un prospect ou un client vise a vendre ou negocier, "
    "interne pour un echange entre collegues de la meme organisation, "
    "client pour un suivi avec un client deja engage sans dimension de vente, "
    "administratif pour un sujet organisationnel interne comme les conges ou les notes de frais. "
    "Si la transcription ne permet pas de trancher clairement entre ces quatre categories, "
    "tu mets meeting_type a non_determine. "
    "Tu reponds uniquement avec l'objet JSON demande, sans texte autour."
)


def build_dialogue(transcript: Transcript) -> str:
    lignes = [f"{segment.speaker_label}: {segment.text}" for segment in transcript.segments]
    return "\n".join(lignes)


class MistralAdapter(LLMProvider):
    def __init__(self, api_key: str, model: str):
        self.client = Mistral(api_key=api_key)
        self.model = model

    async def generate_intelligence(self, transcript: Transcript) -> MeetingIntelligence:
        response = await self.client.chat.parse_async(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_dialogue(transcript)},
            ],
            response_format=MeetingIntelligence,
            temperature=0,
        )
        return response.choices[0].message.parsed
