"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/src/shared/ui";
import { IntegrationFlowCard } from "@/src/widgets/integration-hub/ui/IntegrationFlowCard";
import {
  deleteIntegration,
  listIntegrations,
  updateIntegration,
} from "@/src/entities/integration/api/integration-api";
import type { Integration } from "@/src/entities/integration/model/types";

export function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setIntegrations(await listIntegrations());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (integration: Integration) => {
    const updated = await updateIntegration(integration.id, { is_active: !integration.is_active });
    setIntegrations((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleDelete = async (integration: Integration) => {
    if (!confirm(`「${integration.name}」を削除しますか？`)) return;
    await deleteIntegration(integration.id);
    setIntegrations((prev) => prev.filter((i) => i.id !== integration.id));
  };

  const handleEdit = (integration: Integration) => {
    setEditingIntegration(integration);
    setWizardOpen(true);
  };

  const handleAdd = () => {
    setEditingIntegration(null);
    setWizardOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">連携管理</h2>
          <p className="text-sm text-muted-foreground">
            Slack・HubSpot・NotionからバグをVigil に自動取り込みする設定
          </p>
        </div>
        <Button onClick={handleAdd} size="sm" className="cursor-pointer">
          <Plus className="mr-1.5 h-4 w-4" />
          新しい連携を追加
        </Button>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">読み込み中...</p>
      ) : integrations.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">連携が設定されていません</p>
          <Button variant="outline" size="sm" className="mt-3 cursor-pointer" onClick={handleAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            最初の連携を設定
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {integrations.map((integration) => (
            <IntegrationFlowCard
              key={integration.id}
              integration={integration}
              onEdit={handleEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Wizard placeholder — implemented in Task 11 */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-background p-6 border">
            <p className="text-sm text-muted-foreground mb-3">ウィザードは Task 11 で実装されます</p>
            <Button onClick={() => setWizardOpen(false)} className="cursor-pointer">閉じる</Button>
          </div>
        </div>
      )}
    </div>
  );
}
