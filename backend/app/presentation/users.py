from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.domain.schemas import UserResponse
from app.repository.user_repo import UserRepository

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
async def list_users(
    session: AsyncSession = Depends(get_session),
) -> list[UserResponse]:
    repo = UserRepository(session)
    return await repo.list_users()
