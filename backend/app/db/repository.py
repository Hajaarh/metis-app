from datetime import date, datetime, timezone

from app.contracts.meeting_intelligence import MeetingIntelligence
from app.contracts.transcript import Transcript
from app.db import models
from app.db.client import get_supabase_client


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def parse_date(valeur):
    if valeur is None:
        return None
    try:
        date.fromisoformat(valeur)
        return valeur
    except ValueError:
        return None


def resolve_segment_id(segment_ids: list, index: int | None) -> str | None:
    if index is None or index < 0 or index >= len(segment_ids):
        return None
    return segment_ids[index]


class Repository:
    def __init__(self, client=None):
        self.client = client or get_supabase_client()

    def create_user_profile(self, user_id: str, email: str, duree_retention_jours: int) -> dict:
        ligne = {
            "id": user_id,
            "email": email,
            "duree_retention_jours": duree_retention_jours,
        }
        reponse = self.client.table(models.TABLE_UTILISATEUR).insert(ligne).execute()
        return reponse.data[0]

    def get_user_profile(self, user_id: str) -> dict | None:
        reponse = self.client.table(models.TABLE_UTILISATEUR).select("*").eq("id", user_id).execute()
        return reponse.data[0] if reponse.data else None

    def export_user_data(self, user_id: str) -> dict:
        reunions = (
            self.client.table(models.TABLE_REUNION).select("id").eq("utilisateur_id", user_id).execute()
        )
        return {
            "utilisateur": self.get_user_profile(user_id),
            "reunions": [
                self.get_meeting_detail(reunion["id"], user_id) for reunion in reunions.data
            ],
        }

    def delete_user_account(self, user_id: str) -> None:
        self.client.table(models.TABLE_UTILISATEUR).delete().eq("id", user_id).execute()

    def create_meeting(self, user_id: str, titre: str) -> str:
        ligne = {
            "utilisateur_id": user_id,
            "mode": models.MODE_DICTAPHONE,
            "titre": titre,
            "date_debut": now_iso(),
            "base_legale": models.BASE_LEGALE_CONSENTEMENT,
            "statut_traitement": models.STATUT_EN_ATTENTE,
            "audio_purge": False,
        }
        reponse = self.client.table(models.TABLE_REUNION).insert(ligne).execute()
        return reponse.data[0]["id"]

    def _update_meeting(self, reunion_id: str, valeurs: dict) -> None:
        self.client.table(models.TABLE_REUNION).update(valeurs).eq("id", reunion_id).execute()

    def set_meeting_status(self, reunion_id: str, statut: str) -> None:
        self._update_meeting(reunion_id, {"statut_traitement": statut, "message_erreur": None})

    def set_meeting_duration(self, reunion_id: str, duree_secondes: int) -> None:
        self._update_meeting(reunion_id, {"duree_secondes": duree_secondes})

    def set_meeting_error(self, reunion_id: str, message_erreur: str) -> None:
        self._update_meeting(
            reunion_id, {"statut_traitement": models.STATUT_ERREUR, "message_erreur": message_erreur}
        )

    def set_audio_metadata(
        self, reunion_id: str, audio_nom_fichier: str, audio_taille_octets: int, audio_mime_type: str
    ) -> None:
        self._update_meeting(
            reunion_id,
            {
                "audio_nom_fichier": audio_nom_fichier,
                "audio_taille_octets": audio_taille_octets,
                "audio_mime_type": audio_mime_type,
            },
        )

    def save_attestation(self, reunion_id: str, user_id: str) -> dict:
        existante = (
            self.client.table(models.TABLE_ATTESTATION).select("*").eq("reunion_id", reunion_id).execute()
        )
        if existante.data:
            return existante.data[0]
        ligne = {
            "reunion_id": reunion_id,
            "utilisateur_id": user_id,
            "version_texte": models.VERSION_ATTESTATION,
        }
        reponse = self.client.table(models.TABLE_ATTESTATION).insert(ligne).execute()
        return reponse.data[0]

    def create_consent_link(self, reunion_id: str) -> str:
        import uuid

        jeton = str(uuid.uuid4())
        ligne = {
            "reunion_id": reunion_id,
            "jeton": jeton,
            "choix": models.CHOIX_EN_ATTENTE,
        }
        self.client.table(models.TABLE_CONSENTEMENT_PARTICIPANT).insert(ligne).execute()
        return jeton

    def submit_participant_consent(self, jeton: str, accepte: bool) -> bool:
        existant = (
            self.client.table(models.TABLE_CONSENTEMENT_PARTICIPANT).select("id").eq("jeton", jeton).execute()
        )
        if not existant.data:
            return False
        choix = models.CHOIX_ACCEPTE if accepte else models.CHOIX_REFUSE
        self.client.table(models.TABLE_CONSENTEMENT_PARTICIPANT).update({"choix": choix}).eq(
            "jeton", jeton
        ).execute()
        return True

    def has_refused_consent(self, reunion_id: str) -> bool:
        reponse = (
            self.client.table(models.TABLE_CONSENTEMENT_PARTICIPANT)
            .select("id")
            .eq("reunion_id", reunion_id)
            .eq("choix", models.CHOIX_REFUSE)
            .execute()
        )
        return len(reponse.data) > 0

    def has_attestation(self, reunion_id: str) -> bool:
        reponse = (
            self.client.table(models.TABLE_ATTESTATION)
            .select("id")
            .eq("reunion_id", reunion_id)
            .execute()
        )
        return len(reponse.data) > 0

    def save_transcript(self, transcript: Transcript) -> None:
        self.client.table(models.TABLE_SEGMENT).delete().eq("reunion_id", transcript.meeting_id).execute()
        self.client.table(models.TABLE_LOCUTEUR).delete().eq("reunion_id", transcript.meeting_id).execute()
        labels = sorted({segment.speaker_label for segment in transcript.segments})
        lignes_locuteurs = [{"reunion_id": transcript.meeting_id, "label": label} for label in labels]
        reponse = self.client.table(models.TABLE_LOCUTEUR).insert(lignes_locuteurs).execute()
        identifiants = {ligne["label"]: ligne["id"] for ligne in reponse.data}
        lignes_segments = [
            {
                "reunion_id": transcript.meeting_id,
                "locuteur_id": identifiants[segment.speaker_label],
                "texte": segment.text,
                "horodatage_debut": segment.start_time,
                "horodatage_fin": segment.end_time,
                "inaudible": segment.is_inaudible,
            }
            for segment in transcript.segments
        ]
        reponse = self.client.table(models.TABLE_SEGMENT).insert(lignes_segments).execute()
        return [ligne["id"] for ligne in reponse.data]

    def save_intelligence(
        self, reunion_id: str, intelligence: MeetingIntelligence, modele_utilise: str, segment_ids: list
    ) -> None:
        version = self._replace_compte_rendu(reunion_id)
        compte_rendu = (
            self.client.table(models.TABLE_COMPTE_RENDU)
            .insert(
                {
                    "reunion_id": reunion_id,
                    "resume": intelligence.summary,
                    "modele_utilise": modele_utilise,
                    "version": version,
                }
            )
            .execute()
        )
        compte_rendu_id = compte_rendu.data[0]["id"]
        self.save_ordered(models.TABLE_POINT_CLE, compte_rendu_id, intelligence.key_points)
        self.save_decisions(compte_rendu_id, intelligence.decisions, segment_ids)
        self.save_actions(compte_rendu_id, intelligence.actions, segment_ids)
        self._update_meeting(reunion_id, {"type_reunion": intelligence.meeting_type})
        self.client.table(models.TABLE_REUNION_THEME).delete().eq("reunion_id", reunion_id).execute()
        for nom in dict.fromkeys(intelligence.themes):
            self.link_theme(reunion_id, nom)

    def _replace_compte_rendu(self, reunion_id: str) -> int:
        existant = (
            self.client.table(models.TABLE_COMPTE_RENDU)
            .select("id, version")
            .eq("reunion_id", reunion_id)
            .execute()
        )
        if not existant.data:
            return 1
        compte_rendu_existant = existant.data[0]
        self.client.table(models.TABLE_COMPTE_RENDU).delete().eq("id", compte_rendu_existant["id"]).execute()
        return compte_rendu_existant["version"] + 1

    def save_ordered(self, table: str, compte_rendu_id: str, contenus: list) -> None:
        if not contenus:
            return
        lignes = [
            {"compte_rendu_id": compte_rendu_id, "contenu": contenu, "ordre": ordre}
            for ordre, contenu in enumerate(contenus)
        ]
        self.client.table(table).insert(lignes).execute()

    def save_actions(self, compte_rendu_id: str, actions: list, segment_ids: list) -> None:
        if not actions:
            return
        lignes = [
            {
                "compte_rendu_id": compte_rendu_id,
                "intitule": action.label,
                "responsable": action.responsible,
                "echeance": parse_date(action.due_date),
                "segment_id": resolve_segment_id(segment_ids, action.source_segment_index),
            }
            for action in actions
        ]
        self.client.table(models.TABLE_ACTION).insert(lignes).execute()

    def save_decisions(self, compte_rendu_id: str, decisions: list, segment_ids: list) -> None:
        if not decisions:
            return
        lignes = [
            {
                "compte_rendu_id": compte_rendu_id,
                "contenu": decision.content,
                "ordre": ordre,
                "segment_id": resolve_segment_id(segment_ids, decision.source_segment_index),
            }
            for ordre, decision in enumerate(decisions)
        ]
        self.client.table(models.TABLE_DECISION).insert(lignes).execute()

    def link_theme(self, reunion_id: str, nom: str) -> None:
        existant = self.client.table(models.TABLE_THEME).select("id").eq("nom", nom).execute()
        if existant.data:
            theme_id = existant.data[0]["id"]
        else:
            cree = self.client.table(models.TABLE_THEME).insert({"nom": nom}).execute()
            theme_id = cree.data[0]["id"]
        self.client.table(models.TABLE_REUNION_THEME).insert(
            {"reunion_id": reunion_id, "theme_id": theme_id}
        ).execute()

    def log_audio_purge(self, reunion_id: str) -> None:
        self._update_meeting(reunion_id, {"audio_purge": True, "date_purge_audio": now_iso()})

    def list_meetings(self, user_id: str, recherche: str | None = None) -> list:
        requete = (
            self.client.table(models.TABLE_REUNION)
            .select("id, titre, statut_traitement, date_debut")
            .eq("utilisateur_id", user_id)
        )
        if recherche:
            requete = requete.ilike("titre", f"%{recherche}%")
        reponse = requete.order("date_debut", desc=True).execute()
        return reponse.data

    def get_meeting(self, reunion_id: str, user_id: str) -> dict | None:
        reponse = (
            self.client.table(models.TABLE_REUNION)
            .select("*")
            .eq("id", reunion_id)
            .eq("utilisateur_id", user_id)
            .execute()
        )
        return reponse.data[0] if reponse.data else None

    def get_meeting_detail(self, reunion_id: str, user_id: str) -> dict | None:
        reunion = self.get_meeting(reunion_id, user_id)
        if reunion is None:
            return None
        segments = (
            self.client.table(models.TABLE_SEGMENT)
            .select("*")
            .eq("reunion_id", reunion_id)
            .order("horodatage_debut")
            .execute()
        )
        compte_rendu = (
            self.client.table(models.TABLE_COMPTE_RENDU).select("*").eq("reunion_id", reunion_id).execute()
        )
        detail = {
            "reunion": reunion,
            "segments": segments.data,
            "compte_rendu": None,
            "points_cles": [],
            "decisions": [],
            "actions": [],
        }
        if compte_rendu.data:
            compte_rendu_id = compte_rendu.data[0]["id"]
            detail["compte_rendu"] = compte_rendu.data[0]
            detail["points_cles"] = self.read_children(models.TABLE_POINT_CLE, compte_rendu_id)
            detail["decisions"] = self.read_children(models.TABLE_DECISION, compte_rendu_id)
            detail["actions"] = self.read_children(models.TABLE_ACTION, compte_rendu_id)
        return detail

    def read_children(self, table: str, compte_rendu_id: str) -> list:
        reponse = self.client.table(table).select("*").eq("compte_rendu_id", compte_rendu_id).execute()
        return reponse.data

    def delete_meeting(self, reunion_id: str, user_id: str) -> bool:
        if self.get_meeting(reunion_id, user_id) is None:
            return False
        self.client.table(models.TABLE_REUNION).delete().eq("id", reunion_id).execute()
        return True

    def dashboard_metrics(self, user_id: str) -> dict:
        reunions = (
            self.client.table(models.TABLE_REUNION)
            .select("id, statut_traitement, duree_secondes, type_reunion")
            .eq("utilisateur_id", user_id)
            .execute()
        )
        terminees = [ligne for ligne in reunions.data if ligne["statut_traitement"] == models.STATUT_TERMINE]
        reunion_ids = [ligne["id"] for ligne in reunions.data]
        return {
            "nombre_reunions": len(reunions.data),
            "nombre_reunions_terminees": len(terminees),
            "nombre_actions": self.count_actions(reunion_ids),
            "duree_totale_secondes": self.duree_totale(reunions.data),
            "repartition_par_type": self.repartition_par_type(reunions.data),
            "repartition_par_theme": self.repartition_par_theme(reunion_ids),
        }

    def duree_totale(self, reunions: list) -> int:
        return sum(ligne["duree_secondes"] for ligne in reunions if ligne["duree_secondes"] is not None)

    def repartition_par_type(self, reunions: list) -> dict:
        repartition = {}
        for ligne in reunions:
            type_reunion = ligne["type_reunion"]
            if type_reunion is None:
                continue
            repartition[type_reunion] = repartition.get(type_reunion, 0) + 1
        return repartition

    def repartition_par_theme(self, reunion_ids: list) -> dict:
        if not reunion_ids:
            return {}
        liaisons = (
            self.client.table(models.TABLE_REUNION_THEME).select("theme_id").in_("reunion_id", reunion_ids).execute()
        )
        theme_ids = [ligne["theme_id"] for ligne in liaisons.data]
        if not theme_ids:
            return {}
        themes = self.client.table(models.TABLE_THEME).select("id, nom").in_("id", theme_ids).execute()
        noms = {ligne["id"]: ligne["nom"] for ligne in themes.data}
        repartition = {}
        for theme_id in theme_ids:
            nom = noms[theme_id]
            repartition[nom] = repartition.get(nom, 0) + 1
        return repartition

    def count_actions(self, reunion_ids: list) -> int:
        if not reunion_ids:
            return 0
        comptes = (
            self.client.table(models.TABLE_COMPTE_RENDU).select("id").in_("reunion_id", reunion_ids).execute()
        )
        compte_rendu_ids = [ligne["id"] for ligne in comptes.data]
        if not compte_rendu_ids:
            return 0
        actions = (
            self.client.table(models.TABLE_ACTION).select("id").in_("compte_rendu_id", compte_rendu_ids).execute()
        )
        return len(actions.data)
