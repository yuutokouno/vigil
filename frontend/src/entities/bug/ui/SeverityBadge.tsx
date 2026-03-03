"use client";

import { Badge } from "@/src/shared/ui";
import { SEVERITY_LABELS, type Severity } from "@/src/entities/bug/model/types";

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: "bg-red-600 text-white hover:bg-red-600",
  high: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  low: "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

type SeverityBadgeProps = {
  severity: Severity;
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <Badge variant="secondary" className={SEVERITY_STYLES[severity]}>
      {SEVERITY_LABELS[severity]}
    </Badge>
  );
}
