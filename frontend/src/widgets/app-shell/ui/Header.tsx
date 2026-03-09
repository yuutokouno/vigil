"use client";

import Link from "next/link";
import { Plus, LogOut, Github } from "lucide-react";
import { Button } from "@/src/shared/ui";
import { useAuth } from "@/src/features/auth/model/use-auth";
import { UserAvatar } from "@/src/entities/user/ui/UserAvatar";

export function Header() {
  const { user, isLoading, login, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <div />

      <div className="flex items-center gap-2">
        <Button size="sm" asChild>
          <Link href="/bugs/new">
            <Plus className="mr-1 h-4 w-4" />
            新規バグ
          </Link>
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
