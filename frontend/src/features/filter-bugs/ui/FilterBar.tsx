"use client";

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from "@/src/shared/ui";
import {
  STATUS_LABELS,
  SEVERITY_LABELS,
  CATEGORY_LABELS,
  type Status,
  type Severity,
  type Category,
} from "@/src/entities/bug/model/types";

type FilterBarProps = {
  status: Status | undefined;
  severity: Severity | undefined;
  category: Category | undefined;
  search: string | undefined;
  onStatusChange: (status: Status | undefined) => void;
  onSeverityChange: (severity: Severity | undefined) => void;
  onCategoryChange: (category: Category | undefined) => void;
  onSearchChange: (search: string) => void;
  onReset: () => void;
};

const ALL_VALUE = "__all__";

export function FilterBar({
  status,
  severity,
  category,
  search,
  onStatusChange,
  onSeverityChange,
  onCategoryChange,
  onSearchChange,
  onReset,
}: FilterBarProps) {
  const hasFilters = status || severity || category || search;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="バグを検索..."
        value={search ?? ""}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-48"
      />

      <Select
        value={status ?? ALL_VALUE}
        onValueChange={(v) => onStatusChange(v === ALL_VALUE ? undefined : (v as Status))}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="ステータス" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>すべて</SelectItem>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={severity ?? ALL_VALUE}
        onValueChange={(v) =>
          onSeverityChange(v === ALL_VALUE ? undefined : (v as Severity))
        }
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="深刻度" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>すべて</SelectItem>
          {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={category ?? ALL_VALUE}
        onValueChange={(v) =>
          onCategoryChange(v === ALL_VALUE ? undefined : (v as Category))
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="カテゴリ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>すべて</SelectItem>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          リセット
        </Button>
      )}
    </div>
  );
}
