"use client";

import { usePathname, useRouter } from "next/navigation";
import { List, Kanban } from "lucide-react";
import { Button } from "@/src/shared/ui";
import { cn } from "@/lib/utils";

const VIEWS = [
  { path: "/", label: "テーブル", icon: List },
  { path: "/board", label: "ボード", icon: Kanban },
] as const;

export function ViewToggle() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex rounded-md border">
      {VIEWS.map((view) => {
        const isActive =
          view.path === "/"
            ? pathname === "/" || pathname.startsWith("/bugs")
            : pathname === view.path;

        return (
          <Button
            key={view.path}
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1.5 rounded-none first:rounded-l-md last:rounded-r-md",
              isActive && "bg-accent"
            )}
            onClick={() => router.push(view.path)}
          >
            <view.icon className="h-4 w-4" />
            {view.label}
          </Button>
        );
      })}
    </div>
  );
}
