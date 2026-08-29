from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.api.ws_manager import manager
from app.db.client import get_supabase_client

router = APIRouter()


def _authenticate(token: str) -> str | None:
    try:
        reponse = get_supabase_client().auth.get_user(token)
        return reponse.user.id if reponse and reponse.user else None
    except Exception:
        return None


@router.websocket("/ws/meetings/{meeting_id}")
async def ws_meeting(
    meeting_id: str,
    ws: WebSocket,
    token: str = Query(...),
):
    user_id = _authenticate(token)
    if user_id is None:
        await ws.close(code=4001)
        return

    await manager.connect(meeting_id, ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(meeting_id, ws)
