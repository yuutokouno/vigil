"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/ui";
import { StatusBadge } from "./StatusBadge";
import { SeverityBadge } from "./SeverityBadge";
import type { Bug } from "@/src/entities/bug/model/types";

type BugTableProps = {
  bugs: Bug[];
};

export function BugTable({ bugs }: BugTableProps) {
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
        <TableRow>
          <TableHead>深刻度</TableHead>
          <TableHead>タイトル</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead>優先度</TableHead>
          <TableHead>担当者</TableHead>
          <TableHead>登録日</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bugs.map((bug) => (
          <TableRow key={bug.id}>
            <TableCell>
              <SeverityBadge severity={bug.severity} />
            </TableCell>
            <TableCell>
              <Link
                href={`/bugs/${bug.id}`}
                className="font-medium hover:underline"
              >
                {bug.title}
              </Link>
            </TableCell>
            <TableCell>
              <StatusBadge status={bug.status} />
            </TableCell>
            <TableCell className="text-sm">{bug.priority}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {bug.assigned_to ?? "-"}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(bug.created_at).toLocaleDateString("ja-JP")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
