export type WorkflowColumn = {
  id: string;
  name: string;
  slug: string;
  position: number;
  is_fixed: boolean;
  created_at: string;
};

export type WorkflowColumnCreate = {
  name: string;
  slug: string;
};

export type WorkflowColumnUpdate = {
  name?: string | null;
  position?: number | null;
};
