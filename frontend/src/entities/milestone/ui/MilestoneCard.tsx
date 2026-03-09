"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/src/shared/ui";
import type { Milestone } from "@/src/entities/milestone/model/types";
import { MILESTONE_STATUS_LABELS } from "@/src/entities/milestone/model/types";

type MilestoneCardProps = {
  milestone: Milestone;
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  completed: "bg-green-100 text-green-800 hover:bg-green-100",
  cancelled: "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  const progressPercent =
    milestone.total_bugs > 0
      ? Math.round((milestone.closed_bugs / milestone.total_bugs) * 100)
      : 0;

  const isComplete =
    milestone.closed_bugs === milestone.total_bugs && milestone.total_bugs > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{milestone.title}</CardTitle>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isComplete && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  <Check className="h-5 w-5 text-green-500" />
                </motion.div>
              )}
            </AnimatePresence>
            <Badge
              variant="secondary"
              className={STATUS_STYLES[milestone.status]}
            >
              {MILESTONE_STATUS_LABELS[milestone.status]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {milestone.description && (
          <p className="text-sm text-muted-foreground">
            {milestone.description}
          </p>
        )}

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">進捗</span>
            <span className="font-medium">
              {milestone.closed_bugs}/{milestone.total_bugs} ({progressPercent}%)
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {milestone.due_date && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              期限: {new Date(milestone.due_date).toLocaleDateString("ja-JP")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
