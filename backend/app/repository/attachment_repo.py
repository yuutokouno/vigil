import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import Attachment
from app.domain.schemas import AttachmentResponse


class AttachmentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        bug_id: str,
        file_name: str,
        file_url: str,
        file_size: int | None,
    ) -> AttachmentResponse:
        attachment = Attachment(
            bug_id=uuid.UUID(bug_id),
            file_name=file_name,
            file_url=file_url,
            file_size=file_size,
        )
        self._session.add(attachment)
        await self._session.commit()
        await self._session.refresh(attachment)
        return self._to_response(attachment)

    async def list_by_bug(self, bug_id: str) -> list[AttachmentResponse]:
        result = await self._session.execute(
            select(Attachment).where(Attachment.bug_id == uuid.UUID(bug_id))
        )
        attachments = result.scalars().all()
        return [self._to_response(a) for a in attachments]

    @staticmethod
    def _to_response(attachment: Attachment) -> AttachmentResponse:
        return AttachmentResponse(
            id=str(attachment.id),
            bug_id=str(attachment.bug_id),
            file_name=attachment.file_name,
            file_url=attachment.file_url,
            file_size=attachment.file_size,
            created_at=attachment.created_at,
        )
