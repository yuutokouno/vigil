"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";

// Routes that render without the AppShell (sidebar + header)
const SHELL_EXCLUDED_PATHS = ["/login", "/select-project", "/report"];

type ConditionalAppShellProps = {
  children: React.ReactNode;
};

export function ConditionalAppShell({ children }: ConditionalAppShellProps) {
  const pathname = usePathname();
  const excluded = SHELL_EXCLUDED_PATHS.some((p) => pathname.startsWith(p));

  if (excluded) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
