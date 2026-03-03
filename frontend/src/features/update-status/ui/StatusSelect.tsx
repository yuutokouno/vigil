"use client";

import { Button } from "@/src/shared/ui";
import { STATUS_LABELS, type Bug } from "@/src/entities/bug/model/types";
import { useUpdateStatus } from "../model/use-update-status";

type StatusSelectProps = {
  bug: Bug;
  onUpdated: (bug: Bug) => void;
};

export function StatusSelect({ bug, onUpdated }: StatusSelectProps) {
  const { changeStatus, allowedTransitions, isUpdating, error } =
    useUpdateStatus(bug, onUpdated);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {allowedTransitions.map((status) => (
          <Button
            key={status}
            size="sm"
            variant="outline"
            disabled={isUpdating}
            onClick={() => changeStatus(status)}
          >
            {isUpdating ? "変更中..." : `→ ${STATUS_LABELS[status]}`}
          </Button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
