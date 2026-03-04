import type { AssigneeStats } from "@/src/entities/analytics/model/types";

type Props = {
  assignees: AssigneeStats[];
};

export function AssigneeTable({ assignees }: Props) {
  if (assignees.length === 0) {
    return (
      <p className="py-4 text-center text-[12px] text-muted-foreground">
        データなし
      </p>
    );
  }

  const max = Math.max(...assignees.map((a) => a.closed));

  return (
    <div className="space-y-2">
      {assignees.map((a) => (
        <div key={a.name} className="flex items-center gap-3">
          <span className="w-24 truncate text-[12px] text-muted-foreground">
            {a.name}
          </span>
          <div className="flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${(a.closed / max) * 100}%` }}
            />
          </div>
          <span className="w-6 text-right text-[12px] font-medium text-foreground">
            {a.closed}
          </span>
        </div>
      ))}
    </div>
  );
}
