from fastapi import APIRouter, Depends

from app.di.user import get_user_repo
from app.domain.schemas import UserResponse
from app.infrastructure.repository.user_repo import UserRepository

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
async def list_users(
    repo: UserRepository = Depends(get_user_repo),
) -> list[UserResponse]:
    return await repo.list_users()
