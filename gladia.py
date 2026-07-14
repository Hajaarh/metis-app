import mimetypes
import os
import time
import requests


BASE_URL = "https://api.gladia.io/v2"
POLL_INTERVAL_S = 2
POLL_TIMEOUT_S = 600


def transcribe(audio_bytes: bytes, filename: str, number_of_speakers: int | None = None) -> dict:
    headers = {"x-gladia-key": _api_key()}

    # upload du fichier
    mime = mimetypes.guess_type(filename)[0] or "audio/mpeg"
    resp = requests.post(
        f"{BASE_URL}/upload",
        headers=headers,
        files={"audio": (filename, audio_bytes, mime)},
        timeout=300,
    )
    resp.raise_for_status()
    audio_url = resp.json()["audio_url"]

    # lancement de la transcription avec diarisation
    job = {"audio_url": audio_url, "diarization": True}
    if number_of_speakers:
        # indice donne au modele pour ameliorer la diarisation
        job["diarization_config"] = {"number_of_speakers": number_of_speakers}
    resp = requests.post(
        f"{BASE_URL}/pre-recorded",
        headers=headers,
        json=job,
        timeout=30,
    )
    resp.raise_for_status()
    result_url = resp.json()["result_url"]

    # polling jusqu'a la fin du traitement
    deadline = time.monotonic() + POLL_TIMEOUT_S
    while time.monotonic() < deadline:
        resp = requests.get(result_url, headers=headers, timeout=30)
        resp.raise_for_status()
        payload = resp.json()
        if payload["status"] == "done":
            return _format(payload["result"])
        if payload["status"] == "error":
            raise RuntimeError(f"Erreur Gladia : {payload.get('error_code')}")
        time.sleep(POLL_INTERVAL_S)

    raise TimeoutError(f"Pas de réponse de Gladia après {POLL_TIMEOUT_S} s")


def _format(result: dict) -> dict:
    # utterance = une prise de parole dans la reponse Gladia
    segments = [
        {
            "speaker": _speaker_label(utterance.get("speaker")),
            "start": utterance["start"],
            "end": utterance["end"],
            "text": utterance["text"].strip(),
        }
        for utterance in result["transcription"]["utterances"]
    ]
    return {
        "segments": segments,
        "audio_duration_s": result["metadata"]["audio_duration"],
        "language": result["transcription"].get("languages", ["fr"])[0],
    }


def _speaker_label(speaker: int | None) -> str:
    if speaker is None:
        return "Intervenant ?"
    if speaker < 26:
        return "Intervenant " + chr(ord("A") + speaker)
    return f"Intervenant {speaker + 1}"


def _api_key() -> str:
    key = os.getenv("GLADIA_API_KEY")
    if not key:
        raise RuntimeError("GLADIA_API_KEY manquante, copier .env.example en .env et renseigner la clé")
    return key
