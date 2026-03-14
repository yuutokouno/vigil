import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import User
from app.domain.schemas import UserResponse


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def upsert_by_github_id(
        self,
        github_id: str,
        name: str,
        email: str | None,
        avatar_url: str | None,
    ) -> UserResponse:
        result = await self._session.execute(
            select(User).where(User.github_id == github_id)
        )
        user = result.scalar_one_or_none()

        if user is None:
            user = User(
                github_id=github_id,
                name=name,
                email=email,
                avatar_url=avatar_url,
            )
            self._session.add(user)
        else:
            user.name = name
            user.email = email
            user.avatar_url = avatar_url

        await self._session.commit()
        await self._session.refresh(user)
        return self._to_response(user)

    async def get_by_id(self, user_id: str) -> UserResponse | None:
        user = await self._session.get(User, uuid.UUID(user_id))
        if user is None:
            return None
        return self._to_response(user)

    async def list_users(self) -> list[UserResponse]:
        result = await self._session.execute(select(User).order_by(User.name))
        return [self._to_response(u) for u in result.scalars().all()]

    @staticmethod
    def _to_response(user: User) -> UserResponse:
        return UserResponse(
            id=str(user.id),
            github_id=user.github_id,
            name=user.name,
            email=user.email,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
