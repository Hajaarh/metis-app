from fastapi import APIRouter, Depends, Query

from app.core.deps import get_repository
from app.core.security import get_current_user_id
from app.db.repository import Repository

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics")
def get_metrics(
    date_debut: str | None = Query(None, description="Format YYYY-MM-DD"),
    date_fin: str | None = Query(None, description="Format YYYY-MM-DD"),
    user_id: str = Depends(get_current_user_id),
    repository: Repository = Depends(get_repository),
):
    return repository.dashboard_metrics(user_id, date_debut=date_debut, date_fin=date_fin)
