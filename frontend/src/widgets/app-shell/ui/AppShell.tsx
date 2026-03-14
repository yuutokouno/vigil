"use client";

import { useState } from "react";
import { useAuthGuard } from "@/src/features/auth/model/use-auth-guard";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Redirect to /login if not authenticated, /select-project if no project_id
  useAuthGuard();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
