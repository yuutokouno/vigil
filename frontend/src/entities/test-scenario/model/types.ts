export type TestScenario = {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  feature_tag: string;
  steps_json: string[];
  created_at: string;
  updated_at: string;
};

export type TestScenarioCreate = {
  title: string;
  description?: string | null;
  feature_tag: string;
  steps_json?: string[];
};

export type TestScenarioUpdate = {
  title?: string | null;
  description?: string | null;
  feature_tag?: string | null;
  steps_json?: string[] | null;
};

export type TestScenarioPriority = {
  scenario: TestScenario;
  score: number;
  bug_count: number;
};
