from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict


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
    milestone_id: str | None = None


class BugUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    severity: Severity | None = None
    priority: Priority | None = None
    category: Category | None = None
    assigned_to: str | None = None
    sprint: str | None = None
    milestone_id: str | None = None
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
    status: str
    severity: Severity
    priority: Priority
    category: Category | None
    reported_by: str | None
    assigned_to: str | None
    source: Source
    sprint: str | None
    milestone_id: str | None
    slack_message_url: str | None
    github_issue_url: str | None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None

    model_config = {"from_attributes": True}


class BugListParams(BaseModel):
    status: str | None = None
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


class MilestoneStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MilestoneCreate(BaseModel):
    title: str
    description: str | None = None
    due_date: datetime | None = None


class MilestoneUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    due_date: datetime | None = None
    status: MilestoneStatus | None = None


class MilestoneResponse(BaseModel):
    id: str
    title: str
    description: str | None
    due_date: datetime | None
    status: MilestoneStatus
    created_at: datetime
    updated_at: datetime
    total_bugs: int = 0
    closed_bugs: int = 0

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: str
    github_id: str
    name: str
    email: str | None
    avatar_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkflowColumnCreate(BaseModel):
    name: str
    slug: str


class WorkflowColumnUpdate(BaseModel):
    name: str | None = None
    position: int | None = None


class WorkflowColumnResponse(BaseModel):
    id: str
    name: str
    slug: str
    position: int
    is_fixed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class IntegrationCreate(BaseModel):
    name: str
    source_type: str
    direction: str = "inbound"
    credentials: dict[str, str]
    trigger_rules: dict[str, Any] = {}
    field_mappings: list[dict[str, Any]] = []


class IntegrationUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None
    credentials: dict[str, str] | None = None
    trigger_rules: dict[str, Any] | None = None
    field_mappings: list[dict[str, Any]] | None = None


class IntegrationResponse(BaseModel):
    id: str
    name: str
    source_type: str
    direction: str
    is_active: bool
    trigger_rules: dict[str, Any]
    field_mappings: list[dict[str, Any]]
    last_received_at: datetime | None
    total_received: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IntegrationEventResponse(BaseModel):
    id: str
    integration_id: str
    direction: str
    status: str
    source_ref: str | None
    bug_id: str | None
    error_message: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
