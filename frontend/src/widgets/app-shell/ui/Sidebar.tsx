"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bug,
  Kanban,
  Milestone,
  Settings,
  BarChart2,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/src/shared/ui";
import { useAuth } from "@/src/features/auth/model/use-auth";
import { UserAvatar } from "@/src/entities/user/ui/UserAvatar";

const NAV_ITEMS = [
  { href: "/", label: "Issues", icon: Bug },
  { href: "/board", label: "Board", icon: Kanban },
  { href: "/milestones", label: "Milestones", icon: Milestone },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

type SidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, isLoading, login, logout } = useAuth();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border transition-[width] duration-200",
        isCollapsed ? "w-[52px]" : "w-[220px]"
      )}
      style={{
        background: "rgba(12, 12, 20, 0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Logo + collapse toggle */}
      <div className="flex h-12 shrink-0 items-center border-b border-sidebar-border px-3">
        {!isCollapsed && (
          <span className="mr-auto text-[13px] font-semibold tracking-widest text-foreground/90">
            VIGIL
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label={isCollapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
          className={cn(
            "h-7 w-7 text-muted-foreground hover:text-foreground",
            isCollapsed && "mx-auto"
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
      <nav className="flex-1 space-y-0.5 px-1.5 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname?.startsWith("/bugs")
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md text-[13px] font-medium transition-colors",
                isCollapsed
                  ? "justify-center px-2 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  : cn(
                      "gap-2.5 px-2 py-1.5 border-l-2",
                      isActive
                        ? "border-primary bg-secondary pl-[6px] text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer: auth */}
      <div className="shrink-0 border-t border-sidebar-border px-1.5 py-2 space-y-1">
        {/* Auth */}
        {!isLoading && (
          <>
            {user ? (
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5",
                  isCollapsed && "justify-center"
                )}
              >
                <UserAvatar user={user} size={24} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate text-[12px] text-muted-foreground">
                      {user.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="ログアウト"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={logout}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={login}
                className={cn(
                  "w-full justify-start gap-2.5 px-2 py-1.5 text-[13px] font-normal text-muted-foreground hover:bg-secondary hover:text-foreground",
                  isCollapsed && "justify-center"
                )}
              >
                <Github className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>Login</span>}
              </Button>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
