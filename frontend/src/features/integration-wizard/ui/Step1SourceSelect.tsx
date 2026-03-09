// frontend/src/features/integration-wizard/ui/Step1SourceSelect.tsx
import { cn } from "@/lib/utils";
import type { SourceType } from "@/src/entities/integration/model/types";

const SOURCES: { type: SourceType; label: string; description: string }[] = [
  { type: "slack", label: "Slack", description: "リアクション・キーワードでバグを取り込み" },
  { type: "hubspot", label: "HubSpot", description: "チケットをバグとして取り込み" },
  { type: "notion", label: "Notion", description: "DBページと双方向同期" },
];

type Props = {
  name: string;
  sourceType: SourceType | null;
  onNameChange: (v: string) => void;
  onSourceChange: (v: SourceType) => void;
};

export function Step1SourceSelect({ name, sourceType, onNameChange, onSourceChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">連携名</label>
        <input
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Slack #bugs-report"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">ソースを選択</label>
        <div className="space-y-2">
          {SOURCES.map((s) => (
            <button
              key={s.type}
              type="button"
              onClick={() => onSourceChange(s.type)}
              className={cn(
                "w-full rounded-lg border px-4 py-3 text-left transition-colors cursor-pointer",
                sourceType === s.type ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              )}
            >
              <div className="font-medium text-sm">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
