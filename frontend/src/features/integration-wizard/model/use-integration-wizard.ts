// frontend/src/features/integration-wizard/model/use-integration-wizard.ts
import { useState } from "react";
import type { FieldMapping, Integration, IntegrationCreate, SourceType } from "@/src/entities/integration/model/types";
import { createIntegration, updateIntegration } from "@/src/entities/integration/api/integration-api";

export type WizardState = {
  step: 1 | 2 | 3 | 4;
  name: string;
  source_type: SourceType | null;
  direction: "inbound" | "bidirectional";
  credentials: Record<string, string>;
  trigger_rules: Record<string, unknown>;
  field_mappings: FieldMapping[];
  isTesting: boolean;
  testResult: boolean | null;
  isSaving: boolean;
};

export function useIntegrationWizard(
  editingIntegration: Integration | null,
  onSuccess: () => void,
  onClose: () => void,
) {
  const [state, setState] = useState<WizardState>({
    step: 1,
    name: editingIntegration?.name ?? "",
    source_type: (editingIntegration?.source_type as SourceType) ?? null,
    direction: (editingIntegration?.direction as "inbound" | "bidirectional") ?? "inbound",
    credentials: {},
    trigger_rules: editingIntegration?.trigger_rules as Record<string, unknown> ?? {},
    field_mappings: editingIntegration?.field_mappings ?? [],
    isTesting: false,
    testResult: null,
    isSaving: false,
  });

  const update = (partial: Partial<WizardState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  const nextStep = () => update({ step: Math.min(state.step + 1, 4) as 1 | 2 | 3 | 4 });
  const prevStep = () => update({ step: Math.max(state.step - 1, 1) as 1 | 2 | 3 | 4 });

  const handleSave = async () => {
    if (!state.source_type) return;
    update({ isSaving: true });
    try {
      const data: IntegrationCreate = {
        name: state.name,
        source_type: state.source_type,
        direction: state.direction,
        credentials: state.credentials,
        trigger_rules: state.trigger_rules,
        field_mappings: state.field_mappings,
      };
      if (editingIntegration) {
        await updateIntegration(editingIntegration.id, {
          name: data.name,
          credentials: Object.keys(data.credentials).length > 0 ? data.credentials : undefined,
          trigger_rules: data.trigger_rules,
          field_mappings: data.field_mappings,
        });
      } else {
        await createIntegration(data);
      }
      onSuccess();
      onClose();
    } finally {
      update({ isSaving: false });
    }
  };

  return { state, update, nextStep, prevStep, handleSave };
}
