import mimetypes
import os
import requests


BASE_URL = "https://api.mistral.ai/v1"
MODEL = "voxtral-mini-latest"
CHAT_MODEL = "mistral-small-latest"


def transcribe(audio_bytes: bytes, filename: str, number_of_speakers: int | None = None) -> dict:
    # number_of_speakers ignoré : Voxtral ne prend pas d'indice de locuteurs
    mime = mimetypes.guess_type(filename)[0] or "audio/mpeg"
    resp = requests.post(
        f"{BASE_URL}/audio/transcriptions",
        headers={"Authorization": f"Bearer {_api_key()}"},
        files={"file": (filename, audio_bytes, mime)},
        data={
            "model": MODEL,
            "diarize": "true",
            "timestamp_granularities": "segment",
        },
        timeout=600,
    )
    if not resp.ok:
        raise RuntimeError(f"Erreur Mistral {resp.status_code} : {resp.text[:300]}")
    return _format(resp.json())


def _format(payload: dict) -> dict:
    # les speaker_id Mistral ("speaker_1"...) sont renommés Intervenant A, B...
    labels: dict[str, str] = {}
    segments = []
    for seg in payload["segments"]:
        speaker = seg.get("speaker_id")
        if speaker is None:
            label = "Intervenant ?"
        elif speaker not in labels:
            labels[speaker] = "Intervenant " + chr(ord("A") + len(labels) % 26)
            label = labels[speaker]
        else:
            label = labels[speaker]
        segments.append(
            {
                "speaker": label,
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip(),
            }
        )
    return {
        "segments": segments,
        "audio_duration_s": payload.get("usage", {}).get("prompt_audio_seconds", 0),
        "language": payload.get("language") or "?",
    }


def summarize(transcript_text: str, tone_instruction: str) -> str:
    resp = requests.post(
        f"{BASE_URL}/chat/completions",
        headers={"Authorization": f"Bearer {_api_key()}", "Content-Type": "application/json"},
        json={
            "model": CHAT_MODEL,
            "messages": [
                {"role": "system", "content": tone_instruction},
                {"role": "user", "content": transcript_text},
            ],
            "temperature": 0.3,
        },
        timeout=120,
    )
    if not resp.ok:
        raise RuntimeError(f"Erreur Mistral {resp.status_code} : {resp.text[:300]}")
    return resp.json()["choices"][0]["message"]["content"]


def _api_key() -> str:
    key = os.getenv("MISTRAL_API_KEY")
    if not key:
        raise RuntimeError("MISTRAL_API_KEY manquante, copier .env.example en .env et renseigner la clé")
    return key
