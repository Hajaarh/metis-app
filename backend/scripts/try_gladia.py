"""Smoke test Gladia : upload + transcription + diarisation d'un fichier local.

Usage :
    python scripts/gladia_smoke.py <chemin_audio>

    docker compose exec backend python scripts/gladia_smoke.py /chemin/dans/container.mp3
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from gladiaio_sdk import GladiaClient, GladiaClientOptions


def main() -> int:
    load_dotenv()
    api_key = os.getenv("GLADIA_API_KEY")
    if not api_key:
        print("GLADIA_API_KEY manquante (voir .env.example)", file=sys.stderr)
        return 1

    if len(sys.argv) < 2:
        print(f"Usage : python {sys.argv[0]} <chemin_audio>", file=sys.stderr)
        return 1

    audio_path = Path(sys.argv[1])
    if not audio_path.is_file():
        print(f"Fichier introuvable : {audio_path}", file=sys.stderr)
        return 1

    client = GladiaClient(GladiaClientOptions(api_key=api_key))
    print(f"Transcription de {audio_path.name} ({audio_path.stat().st_size / 1024:.0f} Ko)...")

    response = client.prerecorded().transcribe(
        audio_path,
        {
            "language_config": {"languages": ["fr", "en"], "code_switching": True},
            "diarization": True,
        },
    )

    print(f"Statut : {response.status}")
    if response.result is None:
        print("Pas de resultat retourne", file=sys.stderr)
        return 2

    metadata = response.result.metadata
    utterances = response.result.transcription.utterances
    print(f"Duree audio : {metadata.audio_duration:.1f}s")
    print(f"Utterances : {len(utterances)}")
    for u in utterances[:5]:
        print(f"  [speaker {u.speaker}] {u.start:.1f}-{u.end:.1f} : {u.text[:80]}")
    if len(utterances) > 5:
        print(f"  ... (+{len(utterances) - 5} autres)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
