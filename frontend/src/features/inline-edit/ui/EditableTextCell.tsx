"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/src/shared/ui";
import type { BugUpdate } from "@/src/entities/bug/model/types";

type EditableTextCellProps = {
  value: string;
  field: keyof BugUpdate;
  onSave: (field: keyof BugUpdate, value: string | null) => Promise<void>;
};

export function EditableTextCell({
  value,
  field,
  onSave,
}: EditableTextCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onSave(field, localValue || null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    }
    if (e.key === "Escape") {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-8 w-full"
      />
    );
  }

  return (
    <span
      className="cursor-pointer rounded px-1 py-0.5 hover:bg-accent"
      onClick={() => setIsEditing(true)}
    >
      {value || "-"}
    </span>
  );
}
