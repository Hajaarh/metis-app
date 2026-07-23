from fastapi import APIRouter, Depends

from app.core.deps import get_repository
from app.core.security import get_current_user_id
from app.db.repository import Repository

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics")
def get_metrics(
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    return repository.dashboard_metrics(user_id)
