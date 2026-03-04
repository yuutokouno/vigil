"use client";

import { Badge } from "@/src/shared/ui";
import { SEVERITY_LABELS, type Severity } from "@/src/entities/bug/model/types";

const SEVERITY_CLASSES: Record<Severity, string> = {
  critical: "bg-severity-critical/15 text-severity-critical border-severity-critical/30",
  high:     "bg-severity-high/15 text-severity-high border-severity-high/30",
  medium:   "bg-severity-medium/15 text-severity-medium border-severity-medium/30",
  low:      "bg-severity-low/15 text-severity-low border-severity-low/30",
};

type SeverityBadgeProps = {
  severity: Severity;
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <Badge variant="outline" className={SEVERITY_CLASSES[severity]}>
      {SEVERITY_LABELS[severity]}
    </Badge>
  );
}
