"use client";

import { Badge } from "@/src/shared/ui";
import { STATUS_LABELS, type Status } from "@/src/entities/bug/model/types";

const STATUS_CLASSES: Record<Status, string> = {
  open:        "bg-severity-critical/15 text-severity-critical border-severity-critical/30",
  in_progress: "bg-severity-medium/15 text-severity-medium border-severity-medium/30",
  in_review:   "bg-severity-high/15 text-severity-high border-severity-high/30",
  closed:      "bg-severity-low/15 text-severity-low border-severity-low/30",
};

type StatusBadgeProps = {
  status: Status;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={STATUS_CLASSES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
