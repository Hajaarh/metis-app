from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.deps import get_repository
from app.core.security import get_current_user_id
from app.db.repository import Repository

router = APIRouter(prefix="/clients", tags=["clients"])


class NouveauClient(BaseModel):
    nom: str


class RenommerClient(BaseModel):
    nom: str


@router.get("")
def list_clients(
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    return repository.list_clients(user_id)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_client(
    body: NouveauClient,
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    return repository.create_client(user_id, body.nom)


@router.get("/{client_id}")
def get_client(
    client_id: str,
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    client = repository.get_client(client_id, user_id)
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="client introuvable")
    return client


@router.patch("/{client_id}")
def rename_client(
    client_id: str,
    body: RenommerClient,
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    result = repository.rename_client(client_id, user_id, body.nom)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="client introuvable")
    return result


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: str,
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    if not repository.delete_client(client_id, user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="client introuvable")
    return None
