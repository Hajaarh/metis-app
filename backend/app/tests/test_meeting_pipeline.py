import asyncio

import pytest

from app.contracts.meeting_intelligence import ActionItem, DecisionItem, MeetingIntelligence, MeetingType
from app.contracts.transcript import Segment, Transcript
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


def creer_reunion(repository, mode=models.MODE_DICTAPHONE):
    return repository.create_meeting("u1", "reunion test", mode=mode)


def test_pipeline_bloque_sans_attestation():
    pipeline, repository, transcription, llm = build_pipeline()
    meeting_id = creer_reunion(repository)["id"]

    with pytest.raises(AttestationManquanteError):
        asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["statut_traitement"] == models.STATUT_ATTESTATION_MANQUANTE
    assert transcription.appels == []


def test_pipeline_bloque_si_consentement_refuse():
    pipeline, repository, transcription, llm = build_pipeline()
    reunion_creee = creer_reunion(repository, mode="visio")
    meeting_id = reunion_creee["id"]
    repository.save_attestation(meeting_id, "u1")
    repository.submit_participant_consent(reunion_creee["jeton_consentement"], accepte=False)

    with pytest.raises(ConsentementRefuseError):
        asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["statut_traitement"] == models.STATUT_CONSENTEMENT_REFUSE
    assert transcription.appels == []


def test_pipeline_traite_si_consentement_en_attente():
    pipeline, repository, transcription, llm = build_pipeline()
    meeting_id = creer_reunion(repository, mode="visio")["id"]
    repository.save_attestation(meeting_id, "u1")

    asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["statut_traitement"] == models.STATUT_TERMINE
    assert transcription.appels == [(meeting_id, "reunion.wav")]


def test_pipeline_traite_si_consentement_accepte():
    pipeline, repository, transcription, llm = build_pipeline()
    reunion_creee = creer_reunion(repository, mode="visio")
    meeting_id = reunion_creee["id"]
    repository.save_attestation(meeting_id, "u1")
    repository.submit_participant_consent(reunion_creee["jeton_consentement"], accepte=True)

    intelligence = asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["statut_traitement"] == models.STATUT_TERMINE
    assert intelligence.summary == "resume de test"
    assert llm.appels == [meeting_id]


def test_pipeline_enregistre_le_message_derreur():
    transcription = FakeTranscriptionProvider(erreur=RuntimeError("gladia indisponible"))
    pipeline, repository, transcription, llm = build_pipeline(transcription=transcription)
    meeting_id = creer_reunion(repository)["id"]
    repository.save_attestation(meeting_id, "u1")

    with pytest.raises(RuntimeError):
        asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["statut_traitement"] == models.STATUT_ERREUR
    assert reunion["message_erreur"] == "gladia indisponible"


def test_pipeline_transitionne_par_chaque_statut_attendu():
    pipeline, repository, transcription, llm = build_pipeline()
    meeting_id = creer_reunion(repository)["id"]
    repository.save_attestation(meeting_id, "u1")

    asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    historique = repository.client.tables[models.TABLE_REUNION].historique_maj
    statuts = [maj["statut_traitement"] for maj in historique if "statut_traitement" in maj]
    assert statuts == [models.STATUT_TRANSCRIPTION, models.STATUT_ANALYSE, models.STATUT_TERMINE]


def test_pipeline_erreur_a_l_analyse_conserve_la_transcription_deja_enregistree():
    llm = FakeLLMProvider(erreur=RuntimeError("mistral indisponible"))
    pipeline, repository, transcription, llm = build_pipeline(llm=llm)
    meeting_id = creer_reunion(repository)["id"]
    repository.save_attestation(meeting_id, "u1")

    with pytest.raises(RuntimeError):
        asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["statut_traitement"] == models.STATUT_ERREUR
    segments = repository.client.table(models.TABLE_SEGMENT).select("*").eq("reunion_id", meeting_id).execute()
    assert len(segments.data) == 1
    comptes_rendus = (
        repository.client.table(models.TABLE_COMPTE_RENDU).select("*").eq("reunion_id", meeting_id).execute()
    )
    assert comptes_rendus.data == []


def test_pipeline_purge_automatiquement_l_audio_apres_le_compte_rendu():
    pipeline, repository, transcription, llm = build_pipeline()
    meeting_id = creer_reunion(repository)["id"]
    repository.save_attestation(meeting_id, "u1")

    asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["audio_purge"] is True
    assert reunion["date_purge_audio"] is not None


def test_pipeline_ne_purge_pas_si_l_analyse_echoue():
    llm = FakeLLMProvider(erreur=RuntimeError("mistral indisponible"))
    pipeline, repository, transcription, llm = build_pipeline(llm=llm)
    meeting_id = creer_reunion(repository)["id"]
    repository.save_attestation(meeting_id, "u1")

    with pytest.raises(RuntimeError):
        asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["audio_purge"] is False
    assert reunion.get("date_purge_audio") is None


def test_pipeline_enregistre_le_type_de_reunion_classifie():
    intelligence = MeetingIntelligence(
        summary="resume de test",
        decisions=[],
        key_points=[],
        actions=[],
        themes=[],
        meeting_type=MeetingType.COMMERCIAL,
    )
    llm = FakeLLMProvider(intelligence=intelligence)
    pipeline, repository, transcription, llm = build_pipeline(llm=llm)
    meeting_id = creer_reunion(repository)["id"]
    repository.save_attestation(meeting_id, "u1")

    asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["type_reunion"] == "commercial"


def test_pipeline_enregistre_la_valeur_de_repli_si_type_non_determine():
    intelligence = MeetingIntelligence(
        summary="resume de test",
        decisions=[],
        key_points=[],
        actions=[],
        themes=[],
        meeting_type=MeetingType.NON_DETERMINE,
    )
    llm = FakeLLMProvider(intelligence=intelligence)
    pipeline, repository, transcription, llm = build_pipeline(llm=llm)
    meeting_id = creer_reunion(repository)["id"]
    repository.save_attestation(meeting_id, "u1")

    asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    reunion = repository.get_meeting(meeting_id, "u1")
    assert reunion["type_reunion"] == "non_determine"


def test_pipeline_relie_les_actions_et_decisions_a_leur_segment_source():
    pipeline, repository, transcription, llm = build_pipeline()
    meeting_id = creer_reunion(repository)["id"]
    repository.save_attestation(meeting_id, "u1")

    pipeline.transcription_provider = FakeTranscriptionProvider(
        transcript=Transcript(
            meeting_id=meeting_id,
            language="fr",
            segments=[
                Segment(speaker_label="Intervenant A", text="premier segment", start_time=0.0, end_time=2.0),
                Segment(speaker_label="Intervenant B", text="deuxieme segment", start_time=2.0, end_time=4.0),
            ],
        )
    )
    pipeline.llm_provider = FakeLLMProvider(
        intelligence=MeetingIntelligence(
            summary="resume de test",
            decisions=[DecisionItem(content="decision test", source_segment_index=1)],
            key_points=[],
            actions=[ActionItem(label="action test", source_segment_index=0)],
            themes=[],
            meeting_type=MeetingType.INTERNE,
        )
    )

    asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    detail = repository.get_meeting_detail(meeting_id, "u1")
    segments = detail["segments"]
    assert detail["actions"][0]["segment_id"] == segments[0]["id"]
    assert detail["decisions"][0]["segment_id"] == segments[1]["id"]


def test_pipeline_parcours_complet_jusqu_au_compte_rendu():
    pipeline, repository, transcription, llm = build_pipeline()
    reunion_creee = creer_reunion(repository, mode="visio")
    meeting_id = reunion_creee["id"]
    repository.save_attestation(meeting_id, "u1")
    repository.submit_participant_consent(reunion_creee["jeton_consentement"], accepte=True)

    asyncio.run(pipeline.run(meeting_id, b"audio", "reunion.wav"))

    detail = repository.get_meeting_detail(meeting_id, "u1")
    assert detail["reunion"]["statut_traitement"] == models.STATUT_TERMINE
    assert detail["compte_rendu"]["resume"] == "resume de test"
    assert len(detail["segments"]) == 1
