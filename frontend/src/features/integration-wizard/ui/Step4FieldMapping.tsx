// frontend/src/features/integration-wizard/ui/Step4FieldMapping.tsx
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/src/shared/ui";
import type { FieldMapping, SchemaField } from "@/src/entities/integration/model/types";

const VIGIL_FIELDS = [
  { key: "title", label: "タイトル" },
  { key: "description", label: "説明" },
  { key: "reported_by", label: "報告者" },
  { key: "severity", label: "重大度" },
  { key: "priority", label: "優先度" },
  { key: "category", label: "カテゴリ" },
  { key: "version", label: "バージョン" },
];

type Props = {
  fieldMappings: FieldMapping[];
  sourceFields: SchemaField[];
  onChange: (mappings: FieldMapping[]) => void;
};

export function Step4FieldMapping({ fieldMappings, sourceFields, onChange }: Props) {
  const addRow = () => onChange([...fieldMappings, { from: "", to: "" }]);
  const updateRow = (index: number, partial: Partial<FieldMapping>) =>
    onChange(fieldMappings.map((m, i) => (i === index ? { ...m, ...partial } : m)));
  const removeRow = (index: number) =>
    onChange(fieldMappings.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        ソースのフィールドと Vigil のフィールドを対応付けてください
      </p>
      <div className="space-y-2">
        {fieldMappings.map((mapping, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm cursor-pointer"
              value={mapping.from}
              onChange={(e) => updateRow(i, { from: e.target.value })}
            >
              <option value="">ソースフィールド</option>
              {sourceFields.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
            <span className="text-muted-foreground">→</span>
            <select
              className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm cursor-pointer"
              value={mapping.to}
              onChange={(e) => updateRow(i, { to: e.target.value })}
            >
              <option value="">Vigil フィールド</option>
              {VIGIL_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
            <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => removeRow(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addRow} className="cursor-pointer">
        <Plus className="mr-1.5 h-4 w-4" />
        マッピングを追加
      </Button>
    </div>
  );
}
