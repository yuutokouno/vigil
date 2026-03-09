"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listWorkflowColumns,
  createWorkflowColumn,
  updateWorkflowColumn,
  deleteWorkflowColumn,
} from "@/src/entities/workflow-column/api/workflow-column-api";
import type {
  WorkflowColumn,
  WorkflowColumnCreate,
} from "@/src/entities/workflow-column/model/types";

export function useWorkflowColumns() {
  const [columns, setColumns] = useState<WorkflowColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchColumns = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listWorkflowColumns();
      setColumns(data);
    } catch {
      setError("\u30ab\u30e9\u30e0\u4e00\u89a7\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  const addColumn = useCallback(async (data: WorkflowColumnCreate) => {
    const created = await createWorkflowColumn(data);
    setColumns((prev) =>
      [...prev, created].sort((a, b) => a.position - b.position)
    );
  }, []);

  const renameColumn = useCallback(async (id: string, name: string) => {
    const updated = await updateWorkflowColumn(id, { name });
    setColumns((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const removeColumn = useCallback(async (id: string) => {
    await deleteWorkflowColumn(id);
    setColumns((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    columns,
    isLoading,
    error,
    addColumn,
    renameColumn,
    removeColumn,
    refetch: fetchColumns,
  };
}
