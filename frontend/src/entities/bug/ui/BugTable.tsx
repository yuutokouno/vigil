"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/ui";
import { SeverityBadge } from "./SeverityBadge";
import { EditableTextCell } from "@/src/features/inline-edit/ui/EditableTextCell";
import { EditableSelectCell } from "@/src/features/inline-edit/ui/EditableSelectCell";
import type { Bug, BugUpdate } from "@/src/entities/bug/model/types";
import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  type Severity,
  type Status,
} from "@/src/entities/bug/model/types";
import { updateBug } from "@/src/entities/bug/api/bug-api";

type BugTableProps = {
  bugs: Bug[];
  onBugUpdated?: (updatedBug: Bug) => void;
};

const SEVERITY_OPTIONS = Object.entries(SEVERITY_LABELS).map(
  ([value, label]) => ({ value, label })
);

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

const PRIORITY_OPTIONS = [
  { value: "P0", label: "P0" },
  { value: "P1", label: "P1" },
  { value: "P2", label: "P2" },
  { value: "P3", label: "P3" },
];

export function BugTable({ bugs, onBugUpdated }: BugTableProps) {
  const handleSave = async (
    bug: Bug,
    field: keyof BugUpdate,
    value: string | null
  ) => {
    if (!onBugUpdated) return;

    // Optimistic update
    const optimistic = { ...bug, [field]: value };
    onBugUpdated(optimistic);

    try {
      const updated = await updateBug(bug.id, {
        [field]: value,
      } as BugUpdate);
      onBugUpdated(updated);
    } catch {
      onBugUpdated(bug);
    }
  };

  const columns = useMemo<ColumnDef<Bug>[]>(
    () => [
      {
        accessorKey: "severity",
        header: "深刻度",
        size: 120,
        cell: ({ row }) => {
          const bug = row.original;
          if (!onBugUpdated) {
            return <SeverityBadge severity={bug.severity} />;
          }
          return (
            <EditableSelectCell
              value={bug.severity}
              field="severity"
              options={SEVERITY_OPTIONS}
              onSave={(field, value) => handleSave(bug, field, value)}
            />
          );
        },
      },
      {
        accessorKey: "title",
        header: "タイトル",
        size: 300,
        cell: ({ row }) => {
          const bug = row.original;
          if (!onBugUpdated) {
            return (
              <Link
                href={`/bugs/${bug.id}`}
                className="font-medium hover:underline"
              >
                {bug.title}
              </Link>
            );
          }
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/bugs/${bug.id}`}
                className="shrink-0 text-xs text-muted-foreground hover:underline"
              >
                詳細
              </Link>
              <EditableTextCell
                value={bug.title}
                field="title"
                onSave={(field, value) => handleSave(bug, field, value)}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "ステータス",
        size: 140,
        cell: ({ row }) => {
          const bug = row.original;
          if (!onBugUpdated) {
            return STATUS_LABELS[bug.status as Status];
          }
          return (
            <EditableSelectCell
              value={bug.status}
              field="status"
              options={STATUS_OPTIONS}
              onSave={(field, value) => handleSave(bug, field, value)}
            />
          );
        },
      },
      {
        accessorKey: "priority",
        header: "優先度",
        size: 100,
        cell: ({ row }) => {
          const bug = row.original;
          if (!onBugUpdated) {
            return bug.priority;
          }
          return (
            <EditableSelectCell
              value={bug.priority}
              field="priority"
              options={PRIORITY_OPTIONS}
              onSave={(field, value) => handleSave(bug, field, value)}
            />
          );
        },
      },
      {
        accessorKey: "assigned_to",
        header: "担当者",
        size: 140,
        cell: ({ row }) => {
          const bug = row.original;
          if (!onBugUpdated) {
            return (
              <span className="text-muted-foreground">
                {bug.assigned_to ?? "-"}
              </span>
            );
          }
          return (
            <EditableTextCell
              value={bug.assigned_to ?? ""}
              field="assigned_to"
              onSave={(field, value) => handleSave(bug, field, value)}
            />
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "登録日",
        size: 100,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString("ja-JP")}
          </span>
        ),
      },
    ],
    [onBugUpdated]
  );

  const table = useReactTable({
    data: bugs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (bugs.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        バグが登録されていません
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} style={{ width: header.getSize() }}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
