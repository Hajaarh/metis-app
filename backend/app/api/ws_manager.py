from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, meeting_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._connections[meeting_id].append(ws)

    def disconnect(self, meeting_id: str, ws: WebSocket) -> None:
        try:
            self._connections[meeting_id].remove(ws)
        except ValueError:
            pass

    async def broadcast(self, meeting_id: str, data: dict) -> None:
        dead = []
        for ws in list(self._connections[meeting_id]):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(meeting_id, ws)


manager = ConnectionManager()
