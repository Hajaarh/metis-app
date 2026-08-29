import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_account, routes_auth, routes_clients, routes_consent, routes_dashboard, routes_meetings, routes_ws_meetings

app = FastAPI(title="Metis API", version="0.1.0")

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
allowed_origins = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_auth.router)
app.include_router(routes_meetings.router)
app.include_router(routes_clients.router)
app.include_router(routes_consent.router)
app.include_router(routes_dashboard.router)
app.include_router(routes_account.router)
app.include_router(routes_ws_meetings.router)


@app.get("/health")
def health():
    return {"statut": "ok"}
