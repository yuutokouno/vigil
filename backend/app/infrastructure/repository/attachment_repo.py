import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import Attachment


class AttachmentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        bug_id: str,
        file_name: str,
        file_url: str,
        file_size: int | None = None,
    ) -> Attachment:
        attachment = Attachment(
            id=uuid.uuid4(),
            bug_id=uuid.UUID(bug_id),
            file_name=file_name,
            file_url=file_url,
            file_size=file_size,
        )
        self._session.add(attachment)
        await self._session.commit()
        await self._session.refresh(attachment)
        return attachment

    async def list_by_bug(self, bug_id: str) -> list[Attachment]:
        result = await self._session.execute(
            select(Attachment)
            .where(Attachment.bug_id == uuid.UUID(bug_id))
            .order_by(Attachment.created_at.asc())
        )
        return list(result.scalars().all())

    async def delete(self, attachment_id: str) -> bool:
        result = await self._session.execute(
            select(Attachment).where(Attachment.id == uuid.UUID(attachment_id))
        )
        attachment = result.scalar_one_or_none()
        if attachment is None:
            return False
        await self._session.delete(attachment)
        await self._session.commit()
        return True
