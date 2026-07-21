import json
import os
import subprocess
import tempfile
from pathlib import Path


def ensure_mono(audio_bytes: bytes, filename: str) -> tuple[bytes, str]:
    """Convertit l'audio en mono si besoin.

    Un fichier stéréo fait transcrire chaque canal séparément par Gladia,
    ce qui duplique les prises de parole et les intervenants.
    Sans ffmpeg, retourne l'audio inchangé.
    """
    suffix = Path(filename).suffix or ".mp3"
    fd, src_path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    src = Path(src_path)
    dst = src.with_name(src.stem + "_mono.flac")
    try:
        src.write_bytes(audio_bytes)
        if _channels(src) <= 1:
            return audio_bytes, filename
        # 16 kHz suffit pour la reconnaissance vocale et limite la taille du FLAC
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", str(src), "-ac", "1", "-ar", "16000", str(dst)],
            check=True,
            capture_output=True,
        )
        return dst.read_bytes(), Path(filename).stem + ".flac"
    except (FileNotFoundError, subprocess.CalledProcessError):
        return audio_bytes, filename
    finally:
        src.unlink(missing_ok=True)
        dst.unlink(missing_ok=True)


def _channels(path: Path) -> int:
    out = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-select_streams", "a:0",
            "-show_entries", "stream=channels",
            "-of", "json",
            str(path),
        ],
        check=True,
        capture_output=True,
    )
    streams = json.loads(out.stdout)["streams"]
    return streams[0]["channels"] if streams else 1
