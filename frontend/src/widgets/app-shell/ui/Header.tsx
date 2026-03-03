"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { Moon, Sun, Plus } from "lucide-react";
import { Button } from "@/src/shared/ui";

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <div />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button size="sm" asChild>
          <Link href="/bugs/new">
            <Plus className="mr-1 h-4 w-4" />
            新規バグ
          </Link>
        </Button>
      </div>
    </header>
  );
}
