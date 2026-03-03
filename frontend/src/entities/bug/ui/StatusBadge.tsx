"use client";

import { Badge } from "@/src/shared/ui";
import { STATUS_LABELS, type Status } from "@/src/entities/bug/model/types";

const STATUS_STYLES: Record<Status, string> = {
  open: "bg-red-100 text-red-800 hover:bg-red-100",
  in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  in_review: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  closed: "bg-green-100 text-green-800 hover:bg-green-100",
};

type StatusBadgeProps = {
  status: Status;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="secondary" className={STATUS_STYLES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
