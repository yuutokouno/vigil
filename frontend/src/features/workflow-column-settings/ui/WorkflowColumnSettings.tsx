"use client";

import { useState } from "react";
import { GripVertical, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/src/shared/ui";
import { ApiError } from "@/src/shared/api/client";
import type { WorkflowColumn } from "@/src/entities/workflow-column/model/types";
import { useWorkflowColumns } from "../model/use-workflow-columns";

export function WorkflowColumnSettings() {
  const { columns, isLoading, error, addColumn, renameColumn, removeColumn } =
    useWorkflowColumns();

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    setAddError(null);
    try {
      await addColumn({ name: newName.trim(), slug: newSlug.trim() });
      setNewName("");
      setNewSlug("");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setAddError("\u305d\u306e\u30b9\u30e9\u30c3\u30b0\u306f\u3059\u3067\u306b\u4f7f\u7528\u3055\u308c\u3066\u3044\u307e\u3059");
      } else if (e instanceof ApiError && e.status === 422) {
        setAddError(e.message);
      } else {
        setAddError("\u8ffd\u52a0\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
      }
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    await renameColumn(id, editName.trim());
    setEditingId(null);
  };

  const handleDelete = async (column: WorkflowColumn) => {
    setDeleteError(null);
    try {
      await removeColumn(column.id);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setDeleteError(
          `"\u200b${column.name}" \u306b\u30d0\u30b0\u304c\u6b8b\u3063\u3066\u3044\u308b\u305f\u3081\u524a\u9664\u3067\u304d\u307e\u305b\u3093`
        );
      } else if (e instanceof ApiError && e.status === 403) {
        setDeleteError("\u56fa\u5b9a\u30ab\u30e9\u30e0\u306f\u524a\u9664\u3067\u304d\u307e\u305b\u3093");
      } else {
        setDeleteError("\u524a\u9664\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
      }
    }
  };

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        {"\u8aad\u307f\u8fbc\u307f\u4e2d..."}
      </p>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {"\u30dc\u30fc\u30c9\u30ab\u30e9\u30e0\u7ba1\u7406"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Column list */}
        <div className="space-y-2">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex items-center gap-2 rounded-md border border-border p-2"
            >
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
              {editingId === column.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 flex-1 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(column.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleRename(column.id)}>
                    {"\u4fdd\u5b58"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    {"\u30ad\u30e3\u30f3\u30bb\u30eb"}
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">
                    {column.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {column.slug}
                  </span>
                  {column.is_fixed ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingId(column.id);
                          setEditName(column.name);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(column)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {deleteError && (
          <p className="text-sm text-red-600">{deleteError}</p>
        )}

        {/* Add new column */}
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium">
            {"\u65b0\u3057\u3044\u30ab\u30e9\u30e0\u3092\u8ffd\u52a0"}
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="\u8868\u793a\u540d \uff08\u4f8b: QA\u78ba\u8a8d\u4e2d\uff09"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="\u30b9\u30e9\u30c3\u30b0 \uff08\u4f8b: qa_review\uff09"
              value={newSlug}
              onChange={(e) =>
                setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
              }
              className="flex-1"
            />
            <Button
              onClick={handleAdd}
              disabled={!newName.trim() || !newSlug.trim()}
            >
              <Plus className="mr-1 h-4 w-4" />
              {"\u8ffd\u52a0"}
            </Button>
          </div>
          {addError && <p className="text-sm text-red-600">{addError}</p>}
          <p className="text-xs text-muted-foreground">
            {"\u30b9\u30e9\u30c3\u30b0\u306f\u82f1\u5c0f\u6587\u5b57\u30fb\u6570\u5b57\u30fb\u30a2\u30f3\u30c0\u30fc\u30b9\u30b3\u30a2\u306e\u307f\u4f7f\u7528\u53ef\u80fd\u3067\u3059\u3002\u4f5c\u6210\u5f8c\u306f\u5909\u66f4\u3067\u304d\u307e\u305b\u3093\u3002"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
