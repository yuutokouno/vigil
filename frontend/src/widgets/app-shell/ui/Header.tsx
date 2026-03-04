"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, LogOut, Github } from "lucide-react";
import { Button } from "@/src/shared/ui";
import { useAuth } from "@/src/features/auth/model/use-auth";
import { UserAvatar } from "@/src/entities/user/ui/UserAvatar";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, isLoading, login, logout } = useAuth();

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

        {!isLoading && (
          <>
            {user ? (
              <div className="flex items-center gap-2">
                <UserAvatar user={user} size={28} />
                <span className="text-sm">{user.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Logout</span>
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={login}>
                <Github className="mr-1 h-4 w-4" />
                Login
              </Button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
