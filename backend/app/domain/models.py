import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    github_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(300))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Milestone(Base):
    __tablename__ = "milestones"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=False))
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Bug(Base):
    __tablename__ = "bugs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # Reproduction info
    steps_to_reproduce: Mapped[str | None] = mapped_column(Text)
    expected_behavior: Mapped[str | None] = mapped_column(Text)
    actual_behavior: Mapped[str | None] = mapped_column(Text)
    environment: Mapped[str | None] = mapped_column(String(100))

    # Classification
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    severity: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default="P2")
    category: Mapped[str | None] = mapped_column(String(30))

    # Assignment
    reported_by: Mapped[str | None] = mapped_column(String(100))
    assigned_to: Mapped[str | None] = mapped_column(String(100))
    source: Mapped[str] = mapped_column(String(20), default="manual")

    # External integrations (future use)
    slack_message_url: Mapped[str | None] = mapped_column(String(500))
    github_issue_url: Mapped[str | None] = mapped_column(String(500))
    notion_page_id: Mapped[str | None] = mapped_column(String(100))

    # Milestone
    milestone_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("milestones.id"), nullable=True
    )

    # Sprint management
    sprint: Mapped[str | None] = mapped_column(String(50))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        Index("idx_bugs_status", "status"),
        Index("idx_bugs_severity", "severity"),
        Index("idx_bugs_created_at", "created_at"),
    )
