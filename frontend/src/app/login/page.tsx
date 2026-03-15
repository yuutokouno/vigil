"use client";

import { useAuth } from "@/src/features/auth/model/use-auth";
import { useAuthGuard } from "@/src/features/auth/model/use-auth-guard";
import { Button } from "@/src/shared/ui";
import { Github } from "lucide-react";

export default function LoginRoute() {
  const { login } = useAuth();

  // Redirect to / or /select-project if already logged in
  useAuthGuard();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold">VIGIL</h1>
        <p className="text-muted-foreground">
          archaive バグ管理ダッシュボード
        </p>
        <Button onClick={login} size="lg">
          <Github className="mr-2 h-5 w-5" />
          GitHub でログイン
        </Button>
      </div>
    </div>
  );
}
