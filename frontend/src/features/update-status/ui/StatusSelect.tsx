"use client";

import { Button } from "@/src/shared/ui";
import type { Bug } from "@/src/entities/bug/model/types";
import type { WorkflowColumn } from "@/src/entities/workflow-column/model/types";
import { useUpdateStatus } from "../model/use-update-status";

type StatusSelectProps = {
  bug: Bug;
  onUpdated: (bug: Bug) => void;
  allColumns: WorkflowColumn[];
};

export function StatusSelect({ bug, onUpdated, allColumns }: StatusSelectProps) {
  const { changeStatus, allowedColumns, isUpdating, error } =
    useUpdateStatus(bug, onUpdated, allColumns);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {allowedColumns.map((column) => (
          <Button
            key={column.slug}
            size="sm"
            variant="outline"
            disabled={isUpdating}
            onClick={() => changeStatus(column.slug)}
          >
            {isUpdating
              ? "\u5909\u66f4\u4e2d..."
              : `\u2192 ${column.name}`}
          </Button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
