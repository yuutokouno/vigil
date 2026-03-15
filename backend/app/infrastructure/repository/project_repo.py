import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import Organization, Project, ProjectMember, User


class ProjectRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_projects_for_user(self, user_id: str) -> list[Project]:
        """Return all projects the user is a member of."""
        result = await self._session.execute(
            select(Project)
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .where(ProjectMember.user_id == uuid.UUID(user_id))
            .order_by(Project.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_project(self, project_id: str) -> Project | None:
        result = await self._session.execute(
            select(Project).where(Project.id == uuid.UUID(project_id))
        )
        return result.scalar_one_or_none()

    async def get_or_create_default(self, user: User) -> tuple[Organization, Project]:
        """Get or create the default org/project for a user (called on first login).

        Convention:
          org.slug   = user's GitHub login  (extracted from github_id via name fallback)
          project.slug = "default"
        """
        # Use first part of name as org slug (GitHub username convention)
        org_slug = _to_slug(user.name)

        # Try to find existing org
        result = await self._session.execute(
            select(Organization).where(Organization.slug == org_slug)
        )
        org = result.scalar_one_or_none()

        if org is None:
            org = Organization(
                id=uuid.uuid4(),
                name=user.name,
                slug=org_slug,
            )
            self._session.add(org)
            await self._session.flush()

        # Try to find default project under this org
        result = await self._session.execute(
            select(Project).where(
                Project.org_id == org.id,
                Project.slug == "default",
            )
        )
        project = result.scalar_one_or_none()

        if project is None:
            project = Project(
                id=uuid.uuid4(),
                org_id=org.id,
                name="Default",
                slug="default",
            )
            self._session.add(project)
            await self._session.flush()

        # Ensure user is a member
        result = await self._session.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project.id,
                ProjectMember.user_id == user.id,
            )
        )
        if result.scalar_one_or_none() is None:
            member = ProjectMember(
                id=uuid.uuid4(),
                project_id=project.id,
                user_id=user.id,
                role="owner",
            )
            self._session.add(member)

        await self._session.commit()
        await self._session.refresh(org)
        await self._session.refresh(project)
        return org, project


def _to_slug(name: str) -> str:
    """Convert a display name to a URL-safe slug (max 100 chars)."""
    import re
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug[:100] or "user"
