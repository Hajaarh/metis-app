from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_account, routes_auth, routes_dashboard, routes_meetings

app = FastAPI(title="Scribe API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_auth.router)
app.include_router(routes_meetings.router)
app.include_router(routes_dashboard.router)
app.include_router(routes_account.router)


@app.get("/health")
def health():
    return {"statut": "ok"}
