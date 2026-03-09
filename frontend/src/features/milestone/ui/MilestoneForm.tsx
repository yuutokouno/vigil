"use client";

import { useState } from "react";
import { Button, Input, Label, Textarea } from "@/src/shared/ui";
import type { MilestoneCreate } from "@/src/entities/milestone/model/types";

type MilestoneFormProps = {
  onSubmit: (data: MilestoneCreate) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
};

export function MilestoneForm({
  onSubmit,
  isSubmitting,
  onCancel,
}: MilestoneFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ms-title">タイトル</Label>
        <Input
          id="ms-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="マイルストーン名"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ms-description">説明</Label>
        <Textarea
          id="ms-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="マイルストーンの説明（任意）"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ms-due-date">期限日</Label>
        <Input
          id="ms-due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? "作成中..." : "作成"}
        </Button>
      </div>
    </form>
  );
}
