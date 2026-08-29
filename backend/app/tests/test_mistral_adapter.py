from app.contracts.meeting_intelligence import MeetingIntelligence
from app.contracts.transcript import Segment, Transcript
from app.providers.llm.mistral_adapter import SYSTEM_PROMPT, build_dialogue

import pytest


def test_prompt_mentionne_les_quatre_categories():
    assert "commercial" in SYSTEM_PROMPT
    assert "interne" in SYSTEM_PROMPT
    assert "client" in SYSTEM_PROMPT
    assert "administratif" in SYSTEM_PROMPT


def test_prompt_mentionne_la_valeur_de_repli():
    assert "non_determine" in SYSTEM_PROMPT


def test_prompt_distingue_decision_point_cle_et_action():
    assert "choix" in SYSTEM_PROMPT and "acte" in SYSTEM_PROMPT
    assert "discute" in SYSTEM_PROMPT
    assert "reste a faire" in SYSTEM_PROMPT


def test_prompt_interdit_de_convertir_une_date_relative_en_date_absolue():
    assert "date absolue" in SYSTEM_PROMPT


def test_prompt_demande_le_segment_source_des_actions_et_decisions():
    assert "source_segment_index" in SYSTEM_PROMPT


def test_build_dialogue_numerote_chaque_segment():
    transcript = Transcript(
        meeting_id="reunion-1",
        language="fr",
        segments=[
            Segment(speaker_label="Intervenant A", text="premier segment", start_time=0.0, end_time=2.0),
            Segment(speaker_label="Intervenant B", text="deuxieme segment", start_time=2.0, end_time=4.0),
        ],
    )
    dialogue = build_dialogue(transcript)
    assert "[0] Intervenant A: premier segment" in dialogue
    assert "[1] Intervenant B: deuxieme segment" in dialogue


def test_meeting_type_est_obligatoire_dans_la_sortie_structuree():
    with pytest.raises(ValueError):
        MeetingIntelligence(
            summary="resume",
            decisions=[],
            key_points=[],
            actions=[],
            themes=[],
        )
