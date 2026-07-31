from app.contracts.transcript import Segment, Transcript
from app.contracts.meeting_intelligence import ActionItem
from app.db.repository import Repository


class FakeReponse:
    def __init__(self, data):
        self.data = data


class FakeTableInsertOnly:
    def __init__(self):
        self.compteur = 0
        self.dernieres_lignes = []

    def insert(self, payload):
        lignes = payload if isinstance(payload, list) else [payload]
        inserees = []
        for ligne in lignes:
            self.compteur += 1
            inserees.append({"id": str(self.compteur), **ligne})
        self.dernieres_lignes = inserees
        return self

    def execute(self):
        return FakeReponse(self.dernieres_lignes)


class FakeSupabaseInsertOnly:
    def __init__(self):
        self.tables = {}

    def table(self, nom):
        if nom not in self.tables:
            self.tables[nom] = FakeTableInsertOnly()
        return self.tables[nom]


def repository():
    return Repository(client=FakeSupabaseInsertOnly())


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
