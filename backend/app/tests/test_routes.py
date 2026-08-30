import pytest
from fastapi.testclient import TestClient

from app.core.deps import get_pipeline, get_repository
from app.core.security import get_current_user_id
from app.db.client import get_supabase_client
from app.main import app

USER_ID = "utilisateur-test"


class Utilisateur:
    def __init__(self, id):
        self.id = id


class Session:
    def __init__(self, access_token):
        self.access_token = access_token


class Reponse:
    def __init__(self, user=None, session=None):
        self.user = user
        self.session = session


class FakeSupabaseAdmin:
    def __init__(self):
        self.utilisateurs_supprimes = []

    def delete_user(self, user_id):
        self.utilisateurs_supprimes.append(user_id)


class FakeSupabaseAuth:
    def __init__(self):
        self.mots_de_passe = {}
        self.admin = FakeSupabaseAdmin()

    def sign_up(self, identifiants):
        email = identifiants["email"]
        if email in self.mots_de_passe:
            raise ValueError("email deja utilise")
        self.mots_de_passe[email] = identifiants["password"]
        return Reponse(user=Utilisateur(email))

    def sign_in_with_password(self, identifiants):
        email = identifiants["email"]
        if self.mots_de_passe.get(email) != identifiants["password"]:
            raise ValueError("identifiants invalides")
        return Reponse(session=Session(f"jeton-{email}"))

    def get_user(self, token):
        return Reponse(user=Utilisateur(USER_ID))


class FakeSupabaseClient:
    def __init__(self):
        self.auth = FakeSupabaseAuth()


class FakeRepository:
    def __init__(self):
        self.reunions = {}
        self.consentements = {}
        self.compteur = 0
        self.attestations = []

    def create_meeting(
        self, user_id, titre, client_id=None, mode="dictaphone", base_legale="consentement",
        langue="fr", nombre_locuteurs=None,
    ):
        import uuid as _uuid

        self.compteur += 1
        meeting_id = str(self.compteur)
        reunion = {
            "id": meeting_id,
            "utilisateur_id": user_id,
            "titre": titre,
            "statut_traitement": "en_attente",
            "client_id": client_id,
            "mode": mode,
            "base_legale": base_legale,
            "langue": langue,
            "nombre_locuteurs": nombre_locuteurs,
            "jeton_consentement": None,
        }
        if base_legale == "consentement" and mode != "dictaphone":
            reunion["jeton_consentement"] = str(_uuid.uuid4())
        self.reunions[meeting_id] = reunion
        return reunion

    def set_audio_metadata(self, reunion_id, audio_nom_fichier, audio_taille_octets, audio_mime_type):
        self.reunions[reunion_id]["audio_nom_fichier"] = audio_nom_fichier
        self.reunions[reunion_id]["audio_taille_octets"] = audio_taille_octets
        self.reunions[reunion_id]["audio_mime_type"] = audio_mime_type

    def save_attestation(self, reunion_id, user_id):
        self.attestations.append((reunion_id, user_id))

    def _reunion_par_jeton_consentement(self, jeton):
        for reunion in self.reunions.values():
            if reunion.get("jeton_consentement") == jeton:
                return reunion
        return None

    def get_consent_context(self, jeton):
        reunion = self._reunion_par_jeton_consentement(jeton)
        if reunion is None:
            return None
        counts = self.get_consent_count(reunion["id"])
        return {"jeton": jeton, "reunion_titre": reunion["titre"], **counts}

    def get_consent_count(self, reunion_id, nombre_locuteurs=None):
        total = self.reunions[reunion_id].get("nombre_locuteurs") or 1
        signes = sum(
            1 for c in self.consentements.values()
            if c["reunion_id"] == reunion_id and c["choix"] == "accepte"
        )
        return {"signes": signes, "total": total}

    def submit_participant_consent(self, jeton_collectif, accepte):
        import uuid as _uuid

        reunion = self._reunion_par_jeton_consentement(jeton_collectif)
        if reunion is None:
            return None
        jeton_retractation = str(_uuid.uuid4())
        self.consentements[jeton_retractation] = {
            "reunion_id": reunion["id"],
            "choix": "accepte" if accepte else "refuse",
        }
        return {"reunion_id": reunion["id"], "jeton_retractation": jeton_retractation}

    def retract_consent(self, jeton_retractation):
        consentement = self.consentements.get(jeton_retractation)
        if consentement is None:
            return None
        consentement["choix"] = "refuse"
        return consentement["reunion_id"]

    def has_refused_consent(self, reunion_id):
        return any(
            consentement["reunion_id"] == reunion_id and consentement["choix"] == "refuse"
            for consentement in self.consentements.values()
        )

    def list_meetings(self, user_id, recherche=None, client_id=None):
        reunions = [reunion for reunion in self.reunions.values() if reunion["utilisateur_id"] == user_id]
        if recherche:
            reunions = [reunion for reunion in reunions if recherche.lower() in reunion["titre"].lower()]
        return reunions

    def get_meeting(self, reunion_id, user_id):
        reunion = self.reunions.get(reunion_id)
        if reunion is None or reunion["utilisateur_id"] != user_id:
            return None
        return reunion

    def get_meeting_detail(self, reunion_id, user_id):
        reunion = self.get_meeting(reunion_id, user_id)
        if reunion is None:
            return None
        return {
            "reunion": reunion,
            "segments": [],
            "compte_rendu": None,
            "points_cles": [],
            "decisions": [],
            "actions": [],
        }

    def delete_meeting(self, reunion_id, user_id):
        if self.get_meeting(reunion_id, user_id) is None:
            return False
        del self.reunions[reunion_id]
        return True

    def dashboard_metrics(self, user_id, date_debut=None, date_fin=None):
        reunions = self.list_meetings(user_id)
        return {
            "nombre_reunions": len(reunions),
            "nombre_reunions_terminees": 0,
            "nombre_actions": 0,
            "duree_totale_secondes": 0,
            "repartition_par_type": {},
            "repartition_par_theme": {},
        }

    def create_user_profile(self, user_id, email, duree_retention_jours):
        pass

    def get_user_profile(self, user_id):
        return {"id": user_id, "email": "test@test.fr", "duree_retention_jours": 30}

    def export_user_data(self, user_id):
        return {
            "utilisateur": self.get_user_profile(user_id),
            "reunions": [self.get_meeting_detail(reunion["id"], user_id) for reunion in self.list_meetings(user_id)],
        }

    def delete_user_account(self, user_id):
        ids_a_supprimer = [
            reunion_id for reunion_id, reunion in self.reunions.items() if reunion["utilisateur_id"] == user_id
        ]
        for reunion_id in ids_a_supprimer:
            del self.reunions[reunion_id]


class FakePipeline:
    def __init__(self):
        self.appels = []

    async def run(self, reunion_id, audio_file, file_name, langue="fr", nombre_locuteurs=None):
        self.appels.append((reunion_id, file_name))


@pytest.fixture
def fake_repository():
    return FakeRepository()


@pytest.fixture
def fake_pipeline():
    return FakePipeline()


@pytest.fixture
def fake_supabase_client():
    return FakeSupabaseClient()


@pytest.fixture
def client(fake_repository, fake_pipeline, fake_supabase_client):
    app.dependency_overrides[get_current_user_id] = lambda: USER_ID
    app.dependency_overrides[get_repository] = lambda: fake_repository
    app.dependency_overrides[get_pipeline] = lambda: fake_pipeline
    app.dependency_overrides[get_supabase_client] = lambda: fake_supabase_client
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def creer_reunion(client, titre="reunion test", mode="dictaphone"):
    return client.post("/meetings", json={"titre": titre, "mode": mode})


def uploader_audio(client, meeting_id, consentement_organisateur=True, content_type="audio/wav"):
    return client.post(
        f"/meetings/{meeting_id}/audio",
        files={"file": ("reunion.wav", b"contenu-audio", content_type)},
        data={"consentement_organisateur": str(consentement_organisateur).lower()},
    )


def test_health(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    assert reponse.json() == {"statut": "ok"}


def test_signup_puis_login(client):
    reponse_signup = client.post("/auth/signup", json={"email": "a@test.fr", "password": "secret123"})
    assert reponse_signup.status_code == 201
    assert reponse_signup.json() == {"user_id": "a@test.fr"}

    reponse_login = client.post("/auth/login", json={"email": "a@test.fr", "password": "secret123"})
    assert reponse_login.status_code == 200
    assert reponse_login.json()["token_type"] == "bearer"


def test_signup_email_deja_utilise(client):
    client.post("/auth/signup", json={"email": "a@test.fr", "password": "secret123"})
    reponse = client.post("/auth/signup", json={"email": "a@test.fr", "password": "autre"})
    assert reponse.status_code == 400


def test_login_identifiants_invalides(client):
    reponse = client.post("/auth/login", json={"email": "inconnu@test.fr", "password": "x"})
    assert reponse.status_code == 401


def test_creer_reunion_genere_un_jeton_de_consentement(client):
    reponse = creer_reunion(client, mode="visio")
    assert reponse.status_code == 201
    corps = reponse.json()
    assert corps["meeting_id"]
    assert corps["jeton_consentement"]


def test_creer_reunion_dictaphone_ne_genere_pas_de_jeton(client):
    reponse = creer_reunion(client, mode="dictaphone")
    assert reponse.status_code == 201
    assert reponse.json()["jeton_consentement"] is None


def test_upload_audio_meeting_introuvable(client):
    reponse = uploader_audio(client, "introuvable")
    assert reponse.status_code == 404


def test_upload_audio_format_non_supporte(client):
    meeting_id = creer_reunion(client).json()["meeting_id"]
    reponse = uploader_audio(client, meeting_id, content_type="text/plain")
    assert reponse.status_code == 415


def test_upload_audio_refus_organisateur(client, fake_repository):
    meeting_id = creer_reunion(client).json()["meeting_id"]
    reponse = uploader_audio(client, meeting_id, consentement_organisateur=False)
    assert reponse.status_code == 403
    assert fake_repository.attestations == []
    assert "audio_mime_type" not in fake_repository.reunions[meeting_id]


def test_upload_audio_accepte(client, fake_repository, fake_pipeline):
    meeting_id = creer_reunion(client).json()["meeting_id"]
    reponse = uploader_audio(client, meeting_id)
    assert reponse.status_code == 202
    assert fake_repository.reunions[meeting_id]["audio_mime_type"] == "audio/wav"
    assert fake_repository.attestations == [(meeting_id, USER_ID)]
    assert fake_pipeline.appels == [(meeting_id, "reunion.wav")]


def test_consentement_participant_accepte(client):
    jeton = creer_reunion(client, mode="visio").json()["jeton_consentement"]
    reponse = client.post(f"/consent/{jeton}", json={"accepte": True})
    assert reponse.status_code == 200


def test_consentement_participant_refuse(client):
    jeton = creer_reunion(client, mode="visio").json()["jeton_consentement"]
    reponse = client.post(f"/consent/{jeton}", json={"accepte": False})
    assert reponse.status_code == 200


def test_consentement_jeton_inconnu(client):
    reponse = client.post("/consent/jeton-bidon", json={"accepte": True})
    assert reponse.status_code == 404


def test_list_meetings(client):
    creer_reunion(client)
    reponse = client.get("/meetings")
    assert reponse.status_code == 200
    assert len(reponse.json()) == 1


def test_list_meetings_avec_recherche(client):
    creer_reunion(client, titre="Point budget Q3")
    creer_reunion(client, titre="Recrutement backend")
    reponse = client.get("/meetings", params={"recherche": "budget"})
    assert reponse.status_code == 200
    assert len(reponse.json()) == 1
    assert reponse.json()[0]["titre"] == "Point budget Q3"


def test_list_meetings_recherche_sans_resultat(client):
    creer_reunion(client, titre="Point budget Q3")
    reponse = client.get("/meetings", params={"recherche": "inexistant"})
    assert reponse.status_code == 200
    assert reponse.json() == []


def test_get_meeting_introuvable(client):
    reponse = client.get("/meetings/introuvable")
    assert reponse.status_code == 404
    assert reponse.json()["detail"] == "reunion introuvable"


def test_get_meeting(client):
    meeting_id = creer_reunion(client).json()["meeting_id"]
    reponse = client.get(f"/meetings/{meeting_id}")
    assert reponse.status_code == 200
    assert reponse.json()["reunion"]["id"] == meeting_id


def test_delete_meeting(client):
    meeting_id = creer_reunion(client).json()["meeting_id"]
    reponse = client.delete(f"/meetings/{meeting_id}")
    assert reponse.status_code == 204
    assert client.get(f"/meetings/{meeting_id}").status_code == 404


def test_delete_meeting_introuvable(client):
    reponse = client.delete("/meetings/introuvable")
    assert reponse.status_code == 404


def test_dashboard_metrics(client):
    creer_reunion(client)
    reponse = client.get("/dashboard/metrics")
    assert reponse.status_code == 200
    assert reponse.json()["nombre_reunions"] == 1


def test_export_donnees_compte(client):
    creer_reunion(client)
    reponse = client.get("/account/data")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["utilisateur"]["id"] == USER_ID
    assert len(corps["reunions"]) == 1


def test_export_donnees_compte_vide(client):
    reponse = client.get("/account/data")
    assert reponse.status_code == 200
    assert reponse.json()["reunions"] == []


def test_suppression_compte_efface_les_reunions(client, fake_repository):
    creer_reunion(client)
    reponse = client.delete("/account")
    assert reponse.status_code == 204
    assert fake_repository.reunions == {}
    assert client.get("/meetings").json() == []


def test_suppression_compte_supprime_l_acces_auth(client, fake_supabase_client):
    client.delete("/account")
    assert fake_supabase_client.auth.admin.utilisateurs_supprimes == [USER_ID]
