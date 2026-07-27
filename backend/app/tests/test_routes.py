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


class FakeSupabaseAuth:
    def __init__(self):
        self.mots_de_passe = {}

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
        self.compteur = 0

    def create_meeting(self, user_id, titre, audio_nom_fichier, audio_taille_octets, audio_mime_type):
        self.compteur += 1
        meeting_id = str(self.compteur)
        self.reunions[meeting_id] = {
            "id": meeting_id,
            "utilisateur_id": user_id,
            "titre": titre,
            "statut_traitement": "en_attente",
            "audio_nom_fichier": audio_nom_fichier,
            "audio_taille_octets": audio_taille_octets,
            "audio_mime_type": audio_mime_type,
        }
        return meeting_id

    def save_attestation(self, reunion_id, user_id):
        pass

    def save_participant_consent(self, reunion_id, accepte):
        pass

    def list_meetings(self, user_id):
        return [reunion for reunion in self.reunions.values() if reunion["utilisateur_id"] == user_id]

    def get_meeting_detail(self, reunion_id, user_id):
        reunion = self.reunions.get(reunion_id)
        if reunion is None or reunion["utilisateur_id"] != user_id:
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
        reunion = self.reunions.get(reunion_id)
        if reunion is None or reunion["utilisateur_id"] != user_id:
            return False
        del self.reunions[reunion_id]
        return True

    def dashboard_metrics(self, user_id):
        reunions = self.list_meetings(user_id)
        return {
            "nombre_reunions": len(reunions),
            "nombre_reunions_terminees": 0,
            "nombre_actions": 0,
        }

    def create_user_profile(self, user_id, email, duree_retention_jours):
        pass


class FakePipeline:
    def __init__(self):
        self.appels = []

    async def run(self, reunion_id, audio_file, file_name):
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


def importer_reunion(client, consentement_organisateur=True, consentement_client=True, content_type="audio/wav"):
    return client.post(
        "/meetings/import",
        files={"file": ("reunion.wav", b"contenu-audio", content_type)},
        data={
            "consentement_organisateur": str(consentement_organisateur).lower(),
            "consentement_client": str(consentement_client).lower(),
        },
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


def test_import_meeting_cree_une_reunion(client, fake_repository, fake_pipeline):
    reponse = importer_reunion(client)
    assert reponse.status_code == 202
    meeting_id = reponse.json()["meeting_id"]
    assert fake_repository.reunions[meeting_id]["audio_mime_type"] == "audio/wav"
    assert fake_pipeline.appels == [(meeting_id, "reunion.wav")]


def test_import_meeting_format_non_supporte(client):
    reponse = importer_reunion(client, content_type="text/plain")
    assert reponse.status_code == 415


def test_import_meeting_sans_consentement(client):
    reponse = importer_reunion(client, consentement_organisateur=False)
    assert reponse.status_code == 403


def test_list_meetings(client):
    importer_reunion(client)
    reponse = client.get("/meetings")
    assert reponse.status_code == 200
    assert len(reponse.json()) == 1


def test_get_meeting_introuvable(client):
    reponse = client.get("/meetings/introuvable")
    assert reponse.status_code == 404
    assert reponse.json()["detail"] == "reunion introuvable"


def test_get_meeting(client):
    meeting_id = importer_reunion(client).json()["meeting_id"]
    reponse = client.get(f"/meetings/{meeting_id}")
    assert reponse.status_code == 200
    assert reponse.json()["reunion"]["id"] == meeting_id


def test_delete_meeting(client):
    meeting_id = importer_reunion(client).json()["meeting_id"]
    reponse = client.delete(f"/meetings/{meeting_id}")
    assert reponse.status_code == 204
    assert client.get(f"/meetings/{meeting_id}").status_code == 404


def test_delete_meeting_introuvable(client):
    reponse = client.delete("/meetings/introuvable")
    assert reponse.status_code == 404


def test_dashboard_metrics(client):
    importer_reunion(client)
    reponse = client.get("/dashboard/metrics")
    assert reponse.status_code == 200
    assert reponse.json()["nombre_reunions"] == 1


def test_route_consent_supprimee(client):
    reponse = client.post("/meetings/introuvable/consent")
    assert reponse.status_code == 404
