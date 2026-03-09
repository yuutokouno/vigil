"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/ui";
import type { BugUpdate } from "@/src/entities/bug/model/types";

type EditableSelectCellProps = {
  value: string;
  field: keyof BugUpdate;
  options: { value: string; label: string }[];
  onSave: (field: keyof BugUpdate, value: string | null) => Promise<void>;
};

export function EditableSelectCell({
  value,
  field,
  options,
  onSave,
}: EditableSelectCellProps) {
  return (
    <Select
      value={value}
      onValueChange={(newValue) => {
        if (newValue !== value) {
          onSave(field, newValue);
        }
      }}
    >
      <SelectTrigger className="h-8 w-full border-none bg-transparent shadow-none hover:bg-accent">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
