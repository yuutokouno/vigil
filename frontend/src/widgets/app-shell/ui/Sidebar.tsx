"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bug,
  Kanban,
  Milestone,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/src/shared/ui";

const NAV_ITEMS = [
  { href: "/", label: "Issues", icon: Bug },
  { href: "/board", label: "Board", icon: Kanban },
  { href: "/milestones", label: "Milestones", icon: Milestone },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

type SidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        isCollapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        {!isCollapsed && (
          <span className="text-lg font-bold text-sidebar-foreground">
            VIGIL
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "ml-auto h-8 w-8 text-sidebar-foreground",
            isCollapsed && "mx-auto ml-0"
          )}
          onClick={onToggle}
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname.startsWith("/bugs")
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
