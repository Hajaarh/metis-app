from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.deps import get_repository
from app.core.security import get_current_user_id
from app.db.client import get_supabase_client
from app.db.repository import Repository

router = APIRouter(prefix="/auth", tags=["auth"])


class Identifiants(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordBody(BaseModel):
    email: EmailStr


class ResetPasswordBody(BaseModel):
    token: str
    new_password: str


class ChangePasswordBody(BaseModel):
    new_password: str


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


@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
def forgot_password(body: ForgotPasswordBody, client=Depends(get_supabase_client)):
    try:
        client.auth.reset_password_for_email(
            body.email,
            options={"redirect_to": f"{settings.frontend_url}/reset-password"},
        )
    except Exception:
        pass


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(body: ResetPasswordBody, client=Depends(get_supabase_client)):
    try:
        user_response = client.auth.get_user(body.token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="token invalide")
        client.auth.admin.update_user_by_id(user_response.user.id, {"password": body.new_password})
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="réinitialisation impossible")


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    body: ChangePasswordBody,
    user_id: str = Depends(get_current_user_id),
    client=Depends(get_supabase_client),
):
    try:
        client.auth.admin.update_user_by_id(user_id, {"password": body.new_password})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="changement de mot de passe impossible")
