import json
from pathlib import Path

# une réunion = un fichier JSON dans data/meetings/
MEETINGS_DIR = Path(__file__).parent / "data" / "meetings"


def save_meeting(meeting: dict) -> None:
    MEETINGS_DIR.mkdir(parents=True, exist_ok=True)
    path = MEETINGS_DIR / f"{meeting['id']}.json"
    path.write_text(json.dumps(meeting, ensure_ascii=False, indent=2), encoding="utf-8")


def list_meetings() -> list[dict]:
    if not MEETINGS_DIR.exists():
        return []
    meetings = [json.loads(p.read_text(encoding="utf-8")) for p in MEETINGS_DIR.glob("*.json")]
    return sorted(meetings, key=lambda m: m["created_at"], reverse=True)
