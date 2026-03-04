// frontend/src/features/integration-wizard/ui/Step2Auth.tsx
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/src/shared/ui";
import type { SourceType } from "@/src/entities/integration/model/types";

const AUTH_FIELDS: Record<SourceType, { key: string; label: string; placeholder: string; type?: string }[]> = {
  slack: [
    { key: "bot_token", label: "Bot Token", placeholder: "xoxb-...", type: "password" },
    { key: "signing_secret", label: "Signing Secret", placeholder: "Slack App設定から取得", type: "password" },
  ],
  hubspot: [
    { key: "access_token", label: "Private App Token", placeholder: "pat-xx-...", type: "password" },
  ],
  notion: [
    { key: "token", label: "Integration Token", placeholder: "secret_...", type: "password" },
  ],
};

type Props = {
  sourceType: SourceType;
  credentials: Record<string, string>;
  isTesting: boolean;
  testResult: boolean | null;
  canTest: boolean;
  onCredentialChange: (key: string, value: string) => void;
  onTest: () => void;
};

export function Step2Auth({ sourceType, credentials, isTesting, testResult, canTest, onCredentialChange, onTest }: Props) {
  const fields = AUTH_FIELDS[sourceType];

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="mb-1 block text-sm font-medium">{field.label}</label>
          <input
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
            type={field.type ?? "text"}
            placeholder={field.placeholder}
            value={credentials[field.key] ?? ""}
            onChange={(e) => onCredentialChange(field.key, e.target.value)}
          />
        </div>
      ))}
      <div className="flex flex-col gap-1.5 pt-2">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onTest} disabled={isTesting || !canTest} className="cursor-pointer">
            {isTesting ? "確認中..." : "接続テスト"}
          </Button>
          {testResult === true && (
            <span className="flex items-center gap-1 text-sm text-green-500">
              <CheckCircle className="h-4 w-4" /> 接続成功
            </span>
          )}
          {testResult === false && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <XCircle className="h-4 w-4" /> 接続失敗
            </span>
          )}
        </div>
        {!canTest && (
          <p className="text-xs text-muted-foreground">保存後にテスト可能</p>
        )}
      </div>
    </div>
  );
}
