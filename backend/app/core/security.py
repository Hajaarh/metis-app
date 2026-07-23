from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db.client import get_supabase_client

bearer_scheme = HTTPBearer()


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> str:
    client = get_supabase_client()
    try:
        reponse = client.auth.get_user(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token invalide")
    if reponse is None or reponse.user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token invalide")
    return reponse.user.id
