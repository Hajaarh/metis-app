from app.contracts.transcript import Segment, Transcript
from app.contracts.meeting_intelligence import ActionItem
from app.db import models
from app.db.repository import Repository


class FakeReponse:
    def __init__(self, data):
        self.data = data


class FakeRequete:
    def __init__(self, lignes, action="select", payload=None):
        self.lignes = lignes
        self.action = action
        self.payload = payload
        self.filtres = []

    def select(self, colonnes="*"):
        return self

    def eq(self, colonne, valeur):
        self.filtres.append(lambda ligne: ligne.get(colonne) == valeur)
        return self

    def in_(self, colonne, valeurs):
        self.filtres.append(lambda ligne: ligne.get(colonne) in valeurs)
        return self

    def ilike(self, colonne, motif):
        motif_nettoye = motif.strip("%").lower()
        self.filtres.append(lambda ligne: motif_nettoye in str(ligne.get(colonne, "")).lower())
        return self

    def order(self, colonne, desc=False):
        self.lignes = sorted(self.lignes, key=lambda ligne: ligne.get(colonne), reverse=desc)
        return self

    def execute(self):
        resultat = [ligne for ligne in self.lignes if all(filtre(ligne) for filtre in self.filtres)]
        if self.action == "update":
            for ligne in resultat:
                ligne.update(self.payload)
        if self.action == "delete":
            for ligne in resultat:
                self.lignes.remove(ligne)
        return FakeReponse(resultat)


class FakeTable:
    def __init__(self):
        self.lignes = []
        self.compteur = 0
        self.dernieres_lignes = []
        self.historique_maj = []

    def seed(self, lignes):
        for ligne in lignes:
            if "id" not in ligne:
                self.compteur += 1
                ligne = {"id": str(self.compteur), **ligne}
            self.lignes.append(ligne)

    def insert(self, payload):
        a_inserer = payload if isinstance(payload, list) else [payload]
        inserees = []
        for ligne in a_inserer:
            self.compteur += 1
            nouvelle = {"id": str(self.compteur), **ligne}
            self.lignes.append(nouvelle)
            inserees.append(nouvelle)
        self.dernieres_lignes = inserees
        return FakeRequete(inserees)

    def select(self, colonnes="*"):
        return FakeRequete(list(self.lignes))

    def update(self, payload):
        self.historique_maj.append(dict(payload))
        return FakeRequete(self.lignes, action="update", payload=payload)

    def delete(self):
        return FakeRequete(self.lignes, action="delete")


class FakeSupabase:
    def __init__(self):
        self.tables = {}

    def table(self, nom):
        if nom not in self.tables:
            self.tables[nom] = FakeTable()
        return self.tables[nom]


def repository():
    return Repository(client=FakeSupabase())


def test_save_actions_conserve_responsable_et_echeance_absents():
    repo = repository()
    actions = [ActionItem(label="relancer le fournisseur", responsible=None, due_date=None)]
    repo.save_actions("compte-rendu-1", actions)
    ligne = repo.client.tables["action"].dernieres_lignes[0]
    assert ligne["responsable"] is None
    assert ligne["echeance"] is None


def test_save_actions_conserve_les_valeurs_presentes():
    repo = repository()
    actions = [ActionItem(label="envoyer le devis", responsible="Alice", due_date="2026-08-01")]
    repo.save_actions("compte-rendu-1", actions)
    ligne = repo.client.tables["action"].dernieres_lignes[0]
    assert ligne["responsable"] == "Alice"
    assert ligne["echeance"] == "2026-08-01"


def test_save_actions_insere_exactement_le_nombre_d_actions():
    repo = repository()
    actions = [
        ActionItem(label="action 1"),
        ActionItem(label="action 2"),
        ActionItem(label="action 3"),
    ]
    repo.save_actions("compte-rendu-1", actions)
    lignes = repo.client.tables["action"].dernieres_lignes
    assert len(lignes) == 3
    assert [ligne["intitule"] for ligne in lignes] == ["action 1", "action 2", "action 3"]


def test_save_ordered_conserve_le_contenu_et_l_ordre():
    repo = repository()
    repo.save_ordered("point_cle", "compte-rendu-1", ["premier point", "deuxieme point"])
    lignes = repo.client.tables["point_cle"].dernieres_lignes
    assert [ligne["contenu"] for ligne in lignes] == ["premier point", "deuxieme point"]
    assert [ligne["ordre"] for ligne in lignes] == [0, 1]


def test_save_ordered_liste_vide_n_insere_rien():
    repo = repository()
    repo.save_ordered("decision", "compte-rendu-1", [])
    assert "decision" not in repo.client.tables


def test_save_transcript_conserve_segment_inaudible_sans_modification():
    repo = repository()
    transcript = Transcript(
        meeting_id="reunion-1",
        language="fr",
        segments=[
            Segment(
                speaker_label="Intervenant A",
                text="[inaudible]",
                start_time=1.0,
                end_time=2.0,
                is_inaudible=True,
            )
        ],
    )
    repo.save_transcript(transcript)
    ligne = repo.client.tables["segment"].dernieres_lignes[0]
    assert ligne["texte"] == "[inaudible]"
    assert ligne["inaudible"] is True


def test_save_transcript_conserve_texte_normal_inchange():
    repo = repository()
    transcript = Transcript(
        meeting_id="reunion-1",
        language="fr",
        segments=[
            Segment(
                speaker_label="Intervenant A",
                text="on livre vendredi",
                start_time=1.0,
                end_time=2.0,
                is_inaudible=False,
            )
        ],
    )
    repo.save_transcript(transcript)
    ligne = repo.client.tables["segment"].dernieres_lignes[0]
    assert ligne["texte"] == "on livre vendredi"
    assert ligne["inaudible"] is False


def test_dashboard_metrics_sans_aucune_reunion():
    repo = repository()
    metrics = repo.dashboard_metrics("u1")
    assert metrics == {
        "nombre_reunions": 0,
        "nombre_reunions_terminees": 0,
        "nombre_actions": 0,
        "duree_totale_secondes": 0,
        "repartition_par_type": {},
        "repartition_par_theme": {},
    }


def test_dashboard_metrics_duree_totale():
    repo = repository()
    repo.client.table(models.TABLE_REUNION).seed(
        [
            {"id": "r1", "utilisateur_id": "u1", "statut_traitement": "termine", "duree_secondes": 120, "type_reunion": "interne"},
            {"id": "r2", "utilisateur_id": "u1", "statut_traitement": "en_attente", "duree_secondes": 300, "type_reunion": None},
            {"id": "r3", "utilisateur_id": "autre", "statut_traitement": "termine", "duree_secondes": 999, "type_reunion": "client"},
        ]
    )
    metrics = repo.dashboard_metrics("u1")
    assert metrics["duree_totale_secondes"] == 420


def test_dashboard_metrics_repartition_par_type():
    repo = repository()
    repo.client.table(models.TABLE_REUNION).seed(
        [
            {"id": "r1", "utilisateur_id": "u1", "statut_traitement": "termine", "duree_secondes": 100, "type_reunion": "interne"},
            {"id": "r2", "utilisateur_id": "u1", "statut_traitement": "termine", "duree_secondes": 100, "type_reunion": "interne"},
            {"id": "r3", "utilisateur_id": "u1", "statut_traitement": "en_attente", "duree_secondes": None, "type_reunion": None},
        ]
    )
    metrics = repo.dashboard_metrics("u1")
    assert metrics["repartition_par_type"] == {"interne": 2}


def test_dashboard_metrics_repartition_par_theme():
    repo = repository()
    repo.client.table(models.TABLE_REUNION).seed(
        [
            {"id": "r1", "utilisateur_id": "u1", "statut_traitement": "termine", "duree_secondes": 100, "type_reunion": "interne"},
            {"id": "r2", "utilisateur_id": "u1", "statut_traitement": "termine", "duree_secondes": 100, "type_reunion": "interne"},
        ]
    )
    repo.client.table(models.TABLE_THEME).seed(
        [
            {"id": "t1", "nom": "budget"},
            {"id": "t2", "nom": "recrutement"},
        ]
    )
    repo.client.table(models.TABLE_REUNION_THEME).seed(
        [
            {"id": "rt1", "reunion_id": "r1", "theme_id": "t1"},
            {"id": "rt2", "reunion_id": "r2", "theme_id": "t1"},
            {"id": "rt3", "reunion_id": "r2", "theme_id": "t2"},
        ]
    )
    metrics = repo.dashboard_metrics("u1")
    assert metrics["repartition_par_theme"] == {"budget": 2, "recrutement": 1}


def test_create_meeting_sans_metadonnees_audio():
    repo = repository()
    meeting_id = repo.create_meeting("u1", "reunion test")
    ligne = repo.client.tables[models.TABLE_REUNION].lignes[0]
    assert ligne["id"] == meeting_id
    assert "audio_nom_fichier" not in ligne


def test_set_audio_metadata_renseigne_la_reunion():
    repo = repository()
    meeting_id = repo.create_meeting("u1", "reunion test")
    repo.set_audio_metadata(meeting_id, "reunion.wav", 12345, "audio/wav")
    ligne = repo.client.tables[models.TABLE_REUNION].lignes[0]
    assert ligne["audio_nom_fichier"] == "reunion.wav"
    assert ligne["audio_taille_octets"] == 12345
    assert ligne["audio_mime_type"] == "audio/wav"


def test_create_consent_link_genere_un_jeton_en_attente():
    repo = repository()
    meeting_id = repo.create_meeting("u1", "reunion test")
    jeton = repo.create_consent_link(meeting_id)
    ligne = repo.client.tables[models.TABLE_CONSENTEMENT_PARTICIPANT].lignes[0]
    assert ligne["jeton"] == jeton
    assert ligne["reunion_id"] == meeting_id
    assert ligne["choix"] == models.CHOIX_EN_ATTENTE


def test_submit_participant_consent_accepte():
    repo = repository()
    meeting_id = repo.create_meeting("u1", "reunion test")
    jeton = repo.create_consent_link(meeting_id)
    resultat = repo.submit_participant_consent(jeton, accepte=True)
    assert resultat is True
    ligne = repo.client.tables[models.TABLE_CONSENTEMENT_PARTICIPANT].lignes[0]
    assert ligne["choix"] == models.CHOIX_ACCEPTE


def test_submit_participant_consent_refuse():
    repo = repository()
    meeting_id = repo.create_meeting("u1", "reunion test")
    jeton = repo.create_consent_link(meeting_id)
    repo.submit_participant_consent(jeton, accepte=False)
    ligne = repo.client.tables[models.TABLE_CONSENTEMENT_PARTICIPANT].lignes[0]
    assert ligne["choix"] == models.CHOIX_REFUSE


def test_submit_participant_consent_jeton_inconnu():
    repo = repository()
    resultat = repo.submit_participant_consent("jeton-bidon", accepte=True)
    assert resultat is False


def test_has_refused_consent_vrai_si_refuse():
    repo = repository()
    meeting_id = repo.create_meeting("u1", "reunion test")
    jeton = repo.create_consent_link(meeting_id)
    repo.submit_participant_consent(jeton, accepte=False)
    assert repo.has_refused_consent(meeting_id) is True


def test_has_refused_consent_faux_si_en_attente_ou_accepte():
    repo = repository()
    meeting_id = repo.create_meeting("u1", "reunion test")
    repo.create_consent_link(meeting_id)
    assert repo.has_refused_consent(meeting_id) is False


def test_set_meeting_error_enregistre_statut_et_message():
    repo = repository()
    meeting_id = repo.create_meeting("u1", "reunion test")
    repo.set_meeting_error(meeting_id, "gladia indisponible")
    ligne = repo.client.tables[models.TABLE_REUNION].lignes[0]
    assert ligne["statut_traitement"] == models.STATUT_ERREUR
    assert ligne["message_erreur"] == "gladia indisponible"


def test_set_meeting_status_efface_le_message_derreur_precedent():
    repo = repository()
    meeting_id = repo.create_meeting("u1", "reunion test")
    repo.set_meeting_error(meeting_id, "gladia indisponible")
    repo.set_meeting_status(meeting_id, models.STATUT_TRANSCRIPTION)
    ligne = repo.client.tables[models.TABLE_REUNION].lignes[0]
    assert ligne["statut_traitement"] == models.STATUT_TRANSCRIPTION
    assert ligne["message_erreur"] is None


def test_save_attestation_ignore_les_appels_repetes():
    repo = repository()
    meeting_id = repo.create_meeting("u1", "reunion test")
    repo.save_attestation(meeting_id, "u1")
    repo.save_attestation(meeting_id, "u1")
    lignes = repo.client.tables[models.TABLE_ATTESTATION].lignes
    assert len(lignes) == 1


def test_save_transcript_remplace_la_transcription_existante():
    repo = repository()
    premier = Transcript(
        meeting_id="reunion-1",
        language="fr",
        segments=[
            Segment(
                speaker_label="Intervenant A",
                text="premiere tentative",
                start_time=0.0,
                end_time=1.0,
                is_inaudible=False,
            )
        ],
    )
    second = Transcript(
        meeting_id="reunion-1",
        language="fr",
        segments=[
            Segment(
                speaker_label="Intervenant A",
                text="deuxieme tentative",
                start_time=0.0,
                end_time=1.0,
                is_inaudible=False,
            )
        ],
    )
    repo.save_transcript(premier)
    repo.save_transcript(second)
    segments = repo.client.tables[models.TABLE_SEGMENT].lignes
    locuteurs = repo.client.tables[models.TABLE_LOCUTEUR].lignes
    assert len(segments) == 1
    assert segments[0]["texte"] == "deuxieme tentative"
    assert len(locuteurs) == 1


def seed_reunions_pour_recherche(repo):
    repo.client.table(models.TABLE_REUNION).seed(
        [
            {"id": "r1", "utilisateur_id": "u1", "titre": "Point budget Q3", "statut_traitement": "termine", "date_debut": "2026-01-01"},
            {"id": "r2", "utilisateur_id": "u1", "titre": "Recrutement backend", "statut_traitement": "termine", "date_debut": "2026-01-02"},
            {"id": "r3", "utilisateur_id": "autre", "titre": "Budget marketing", "statut_traitement": "termine", "date_debut": "2026-01-03"},
        ]
    )


def test_list_meetings_sans_recherche_renvoie_tout():
    repo = repository()
    seed_reunions_pour_recherche(repo)
    resultats = repo.list_meetings("u1")
    assert {r["id"] for r in resultats} == {"r1", "r2"}


def test_list_meetings_recherche_insensible_a_la_casse():
    repo = repository()
    seed_reunions_pour_recherche(repo)
    resultats = repo.list_meetings("u1", recherche="BUDGET")
    assert [r["id"] for r in resultats] == ["r1"]


def test_list_meetings_recherche_sans_resultat():
    repo = repository()
    seed_reunions_pour_recherche(repo)
    resultats = repo.list_meetings("u1", recherche="inexistant")
    assert resultats == []
