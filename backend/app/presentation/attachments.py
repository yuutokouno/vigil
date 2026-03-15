import re
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.di.auth import ProjectAuthContext, verify_project_membership
from app.domain.models import Bug
from app.domain.schemas import AttachmentResponse
from app.infrastructure.db.database import get_session
from app.infrastructure.repository.attachment_repo import AttachmentRepository

router = APIRouter(prefix="/api/bugs", tags=["attachments"])

# 20 MB limit
MAX_FILE_SIZE = 20 * 1024 * 1024

# Allowed MIME types (#43: MIME type whitelist)
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/json",
    "application/zip",
    "application/x-zip-compressed",
    "video/mp4",
    "video/webm",
}

# Upload directory relative to project root
UPLOAD_DIR = Path("uploads")


def _sanitize_filename(filename: str) -> str:
    """Remove path components and special characters to prevent path traversal (#42).

    - Strips directory separators (/ and \\)
    - Allows only alphanumerics, dots, dashes, underscores
    - Truncates to 200 chars
    """
    # Take only the basename — prevents directory traversal
    filename = Path(filename).name
    # Strip leading dots (hidden files / relative paths like ../secret)
    filename = filename.lstrip(".")
    # Allow only safe characters
    filename = re.sub(r"[^\w.\-]", "_", filename)
    # Limit length
    return filename[:200] or "upload"


@router.post("/{bug_id}/attachments", response_model=AttachmentResponse, status_code=201)
async def upload_attachment(
    bug_id: str,
    file: UploadFile,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    session: AsyncSession = Depends(get_session),
) -> AttachmentResponse:
    # Validate bug_id format
    try:
        bug_uuid = uuid.UUID(bug_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bug ID format")

    bug = await session.get(Bug, bug_uuid)
    if bug is None:
        raise HTTPException(status_code=404, detail="Bug not found")

    # Validate MIME type (#43)
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{content_type}'. "
                   f"Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
        )

    # Read content and check size
    content = await file.read()
    file_size = len(content)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)} MB",
        )

    # Build upload path with sanitized filename (#42)
    safe_filename = _sanitize_filename(file.filename or "upload")
    # Prefix with UUID to avoid collisions and prevent enumeration
    stored_name = f"{uuid.uuid4().hex}_{safe_filename}"

    bug_dir = UPLOAD_DIR / bug_id
    bug_dir.mkdir(parents=True, exist_ok=True)
    file_path = bug_dir / stored_name

    file_path.write_bytes(content)

    # URL accessible at /uploads/{bug_id}/{stored_name}
    file_url = f"/uploads/{bug_id}/{stored_name}"
    original_name = file.filename or stored_name

    repo = AttachmentRepository(session)
    return await repo.create(
        bug_id=bug_id,
        file_name=original_name,
        file_url=file_url,
        file_size=file_size,
    )


@router.get("/{bug_id}/attachments", response_model=list[AttachmentResponse])
async def list_attachments(
    bug_id: str,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    session: AsyncSession = Depends(get_session),
) -> list[AttachmentResponse]:
    try:
        uuid.UUID(bug_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bug ID format")

    repo = AttachmentRepository(session)
    return await repo.list_by_bug(bug_id)
