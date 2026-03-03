"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/src/shared/ui";
import { BugTable } from "@/src/entities/bug/ui/BugTable";
import { listBugs } from "@/src/entities/bug/api/bug-api";
import type { Bug, BugListParams } from "@/src/entities/bug/model/types";
import { FilterBar } from "@/src/features/filter-bugs/ui/FilterBar";
import { useFilters } from "@/src/features/filter-bugs/model/use-filters";

type BugListProps = {
  initialFilters?: Partial<BugListParams>;
};

export function BugList({ initialFilters }: BugListProps) {
  const {
    filters,
    setStatus,
    setSeverity,
    setCategory,
    setSearch,
    setPage,
    resetFilters,
  } = useFilters();

  const [bugs, setBugs] = useState<Bug[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const mergedFilters = { ...filters, ...initialFilters };

  const fetchBugs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listBugs(mergedFilters);
      setBugs(response.items);
      setTotal(response.total);
    } catch {
      setBugs([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    mergedFilters.status,
    mergedFilters.severity,
    mergedFilters.category,
    mergedFilters.search,
    mergedFilters.page,
    mergedFilters.sort,
    mergedFilters.order,
    mergedFilters.limit,
  ]);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  const totalPages = Math.ceil(total / (filters.limit ?? 20));
  const currentPage = filters.page ?? 1;

  return (
    <div className="space-y-4">
      <FilterBar
        status={filters.status}
        severity={filters.severity}
        category={filters.category}
        search={filters.search}
        onStatusChange={setStatus}
        onSeverityChange={setSeverity}
        onCategoryChange={setCategory}
        onSearchChange={setSearch}
        onReset={resetFilters}
      />

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">読み込み中...</p>
      ) : (
        <>
          <BugTable bugs={bugs} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {total} 件中 {(currentPage - 1) * (filters.limit ?? 20) + 1}〜
                {Math.min(currentPage * (filters.limit ?? 20), total)} 件
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  前へ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  次へ
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
