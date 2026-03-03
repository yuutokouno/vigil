"use client";

import { useCallback, useState } from "react";
import type {
  BugListParams,
  Category,
  Severity,
  Status,
} from "@/src/entities/bug/model/types";

export function useFilters() {
  const [filters, setFilters] = useState<BugListParams>({
    sort: "created_at",
    order: "desc",
    page: 1,
    limit: 20,
  });

  const setStatus = useCallback((status: Status | undefined) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const setSeverity = useCallback((severity: Severity | undefined) => {
    setFilters((prev) => ({ ...prev, severity, page: 1 }));
  }, []);

  const setCategory = useCallback((category: Category | undefined) => {
    setFilters((prev) => ({ ...prev, category, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search: search || undefined, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      sort: "created_at",
      order: "desc",
      page: 1,
      limit: 20,
    });
  }, []);

  return {
    filters,
    setStatus,
    setSeverity,
    setCategory,
    setSearch,
    setPage,
    resetFilters,
  };
}
