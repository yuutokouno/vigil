import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.domain.models import Bug
from app.domain.schemas import AttachmentResponse
from app.repository.attachment_repo import AttachmentRepository

router = APIRouter(prefix="/api/bugs", tags=["attachments"])

# Maximum file size: 20 MB
MAX_FILE_SIZE = 20 * 1024 * 1024


def _get_repo(session: AsyncSession = Depends(get_session)) -> AttachmentRepository:
    return AttachmentRepository(session)


@router.post("/{bug_id}/attachments", response_model=AttachmentResponse, status_code=201)
async def upload_attachment(
    bug_id: str,
    file: UploadFile,
    session: AsyncSession = Depends(get_session),
    repo: AttachmentRepository = Depends(_get_repo),
) -> AttachmentResponse:
    # Verify the bug exists
    try:
        bug_uuid = uuid.UUID(bug_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bug ID format")

    bug = await session.get(Bug, bug_uuid)
    if bug is None:
        raise HTTPException(status_code=404, detail="Bug not found")

    # Read file content and validate size
    content = await file.read()
    file_size = len(content)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)} MB",
        )

    # Build upload path: uploads/{bug_id}/{filename}
    upload_base = Path(settings.upload_dir)
    bug_dir = upload_base / bug_id
    bug_dir.mkdir(parents=True, exist_ok=True)

    # Use a UUID prefix to avoid filename collisions
    safe_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = bug_dir / safe_filename

    with open(file_path, "wb") as f:
        f.write(content)

    # Store a URL-accessible path: /uploads/{bug_id}/{filename}
    file_url = f"/uploads/{bug_id}/{safe_filename}"
    original_filename = file.filename or safe_filename

    return await repo.create(
        bug_id=bug_id,
        file_name=original_filename,
        file_url=file_url,
        file_size=file_size,
    )
