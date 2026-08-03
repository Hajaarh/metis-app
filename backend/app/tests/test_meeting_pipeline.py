import asyncio

import pytest

from app.db import models
from app.db.repository import Repository
from app.orchestrator.meeting_pipeline import AttestationManquanteError, ConsentementRefuseError, MeetingPipeline
from app.tests.fakes import FakeLLMProvider, FakeTranscriptionProvider
from app.tests.test_repository import FakeSupabase


def build_pipeline(transcription=None, llm=None):
    client = FakeSupabase()
    repository = Repository(client=client)
    transcription = transcription or FakeTranscriptionProvider()
    llm = llm or FakeLLMProvider()
    pipeline = MeetingPipeline(
        transcription_provider=transcription,
        llm_provider=llm,
        repository=repository,
        modele_llm="modele-test",
    )
    return pipeline, repository, transcription, llm


def test_pipeline_bloque_sans_attestation():
    pipeline, repository, transcription, llm = build_pipeline()
    meeting_id = repository.create_meeting("u1", "reunion test")

    with pytest.raises(AttestationManquanteError):
        asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["statut_traitement"] == models.STATUT_ATTESTATION_MANQUANTE
    assert transcription.appels == []


def test_pipeline_bloque_si_consentement_refuse():
    pipeline, repository, transcription, llm = build_pipeline()
    meeting_id = repository.create_meeting("u1", "reunion test")
    repository.save_attestation(meeting_id, "u1")
    jeton = repository.create_consent_link(meeting_id)
    repository.submit_participant_consent(jeton, accepte=False)

    with pytest.raises(ConsentementRefuseError):
        asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["statut_traitement"] == models.STATUT_CONSENTEMENT_REFUSE
    assert transcription.appels == []


def test_pipeline_traite_si_consentement_en_attente():
    pipeline, repository, transcription, llm = build_pipeline()
    meeting_id = repository.create_meeting("u1", "reunion test")
    repository.save_attestation(meeting_id, "u1")
    repository.create_consent_link(meeting_id)

    asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["statut_traitement"] == models.STATUT_TERMINE
    assert transcription.appels == [(meeting_id, "reunion.wav")]


def test_pipeline_traite_si_consentement_accepte():
    pipeline, repository, transcription, llm = build_pipeline()
    meeting_id = repository.create_meeting("u1", "reunion test")
    repository.save_attestation(meeting_id, "u1")
    jeton = repository.create_consent_link(meeting_id)
    repository.submit_participant_consent(jeton, accepte=True)

    intelligence = asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["statut_traitement"] == models.STATUT_TERMINE
    assert intelligence.summary == "resume de test"
    assert llm.appels == [meeting_id]


def test_pipeline_enregistre_le_message_derreur():
    transcription = FakeTranscriptionProvider(erreur=RuntimeError("gladia indisponible"))
    pipeline, repository, transcription, llm = build_pipeline(transcription=transcription)
    meeting_id = repository.create_meeting("u1", "reunion test")
    repository.save_attestation(meeting_id, "u1")

    with pytest.raises(RuntimeError):
        asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["statut_traitement"] == models.STATUT_ERREUR
    assert reunion["message_erreur"] == "gladia indisponible"
