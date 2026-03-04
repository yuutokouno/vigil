// frontend/src/features/integration-wizard/ui/IntegrationWizard.tsx
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/src/shared/ui";
import { Step1SourceSelect } from "./Step1SourceSelect";
import { Step2Auth } from "./Step2Auth";
import { Step3TriggerRules } from "./Step3TriggerRules";
import { Step4FieldMapping } from "./Step4FieldMapping";
import { useIntegrationWizard } from "../model/use-integration-wizard";
import { fetchSourceSchema, testIntegration } from "@/src/entities/integration/api/integration-api";
import type { Integration, SchemaField } from "@/src/entities/integration/model/types";

const STEP_LABELS = ["ソース", "認証", "トリガー", "マッピング"];

type Props = {
  editingIntegration: Integration | null;
  onSuccess: () => void;
  onClose: () => void;
};

export function IntegrationWizard({ editingIntegration, onSuccess, onClose }: Props) {
  const { state, update, nextStep, prevStep, handleSave } = useIntegrationWizard(
    editingIntegration, onSuccess, onClose
  );
  const [sourceFields, setSourceFields] = useState<SchemaField[]>([]);

  // Load schema fields when reaching step 4
  useEffect(() => {
    if (state.step === 4 && state.source_type) {
      fetchSourceSchema(state.source_type, state.credentials)
        .then(setSourceFields)
        .catch(() => setSourceFields([]));
    }
  }, [state.step, state.source_type]);

  const handleTest = async () => {
    if (!editingIntegration) return;
    update({ isTesting: true, testResult: null });
    try {
      const result = await testIntegration(editingIntegration.id);
      update({ testResult: result.ok });
    } catch {
      update({ testResult: false });
    } finally {
      update({ isTesting: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold">
            {editingIntegration ? "連携を編集" : "新しい連携を追加"}
          </h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex border-b px-6 py-3">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex-1 text-center">
              <div className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                ${state.step === i + 1
                  ? "bg-primary text-primary-foreground"
                  : state.step > i + 1
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </div>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-4 min-h-[260px]">
          {state.step === 1 && (
            <Step1SourceSelect
              name={state.name}
              sourceType={state.source_type}
              onNameChange={(v) => update({ name: v })}
              onSourceChange={(v) => update({ source_type: v })}
            />
          )}
          {state.step === 2 && state.source_type && (
            <Step2Auth
              sourceType={state.source_type}
              credentials={state.credentials}
              isTesting={state.isTesting}
              testResult={state.testResult}
              onCredentialChange={(k, v) => update({ credentials: { ...state.credentials, [k]: v } })}
              onTest={handleTest}
            />
          )}
          {state.step === 3 && state.source_type && (
            <Step3TriggerRules
              sourceType={state.source_type}
              triggerRules={state.trigger_rules}
              onRulesChange={(r) => update({ trigger_rules: r })}
            />
          )}
          {state.step === 4 && (
            <Step4FieldMapping
              fieldMappings={state.field_mappings}
              sourceFields={sourceFields}
              onChange={(m) => update({ field_mappings: m })}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <Button variant="outline" onClick={state.step === 1 ? onClose : prevStep} className="cursor-pointer">
            {state.step === 1 ? "キャンセル" : "戻る"}
          </Button>
          {state.step < 4 ? (
            <Button
              onClick={nextStep}
              disabled={state.step === 1 && (!state.source_type || !state.name.trim())}
              className="cursor-pointer"
            >
              次へ
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={state.isSaving} className="cursor-pointer">
              {state.isSaving ? "保存中..." : "保存して有効化"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
