import { Badge } from "@/src/shared/ui";
import { STATUS_LABELS, type Status } from "@/src/entities/bug/model/types";

const STATUS_CLASSES: Record<Status, string> = {
  open:        "bg-status-open/15 text-status-open border-status-open/30",
  in_progress: "bg-status-in-progress/15 text-status-in-progress border-status-in-progress/30",
  in_review:   "bg-status-in-review/15 text-status-in-review border-status-in-review/30",
  closed:      "bg-status-closed/15 text-status-closed border-status-closed/30",
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
