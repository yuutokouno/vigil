from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class Status(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    CLOSED = "closed"


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Priority(str, Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"


class Category(str, Enum):
    UI = "ui"
    API = "api"
    TYPE_ERROR = "type_error"
    AUTH = "auth"
    DATA = "data"
    PERFORMANCE = "performance"
    OTHER = "other"


class Source(str, Enum):
    MANUAL = "manual"
    SLACK = "slack"
    HUBSPOT = "hubspot"
    TEST = "test"


class BugCreate(BaseModel):
    title: str
    description: str | None = None
    steps_to_reproduce: str | None = None
    expected_behavior: str | None = None
    actual_behavior: str | None = None
    environment: str | None = None
    severity: Severity = Severity.MEDIUM
    priority: Priority = Priority.P2
    category: Category | None = None
    reported_by: str | None = None
    assigned_to: str | None = None
    source: Source = Source.MANUAL
    sprint: str | None = None


class BugUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: Status | None = None
    severity: Severity | None = None
    priority: Priority | None = None
    category: Category | None = None
    assigned_to: str | None = None
    sprint: str | None = None
    closed_at: datetime | None = None

    model_config = ConfigDict(extra="allow")


class BugResponse(BaseModel):
    id: str
    title: str
    description: str | None
    steps_to_reproduce: str | None
    expected_behavior: str | None
    actual_behavior: str | None
    environment: str | None
    status: Status
    severity: Severity
    priority: Priority
    category: Category | None
    reported_by: str | None
    assigned_to: str | None
    source: Source
    sprint: str | None
    slack_message_url: str | None
    github_issue_url: str | None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None

    model_config = {"from_attributes": True}


class BugListParams(BaseModel):
    status: Status | None = None
    severity: Severity | None = None
    category: Category | None = None
    search: str | None = None
    sort: str = "created_at"
    order: str = "desc"
    page: int = 1
    limit: int = 20


class BugListResponse(BaseModel):
    items: list[BugResponse]
    total: int
    page: int
    limit: int


class BugStatsResponse(BaseModel):
    total: int
    by_status: dict[str, int]
    by_severity: dict[str, int]
    by_category: dict[str, int]
