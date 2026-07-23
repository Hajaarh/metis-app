from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.deps import get_repository
from app.db.client import get_supabase_client
from app.db.repository import Repository

router = APIRouter(prefix="/auth", tags=["auth"])


class Identifiants(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(
    identifiants: Identifiants,
    repository: Repository = Depends(get_repository),
    client=Depends(get_supabase_client),
):
    try:
        reponse = client.auth.sign_up({"email": identifiants.email, "password": identifiants.password})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="inscription impossible")
    repository.create_user_profile(reponse.user.id, identifiants.email, settings.default_retention_days)
    return {"user_id": reponse.user.id}


@router.post("/login")
def login(identifiants: Identifiants, client=Depends(get_supabase_client)):
    try:
        reponse = client.auth.sign_in_with_password(
            {"email": identifiants.email, "password": identifiants.password}
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="identifiants invalides")
    return {"access_token": reponse.session.access_token, "token_type": "bearer"}
