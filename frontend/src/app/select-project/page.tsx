"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listProjects, switchProject } from "@/src/entities/project/api/project-api";
import type { Project } from "@/src/entities/project/model/types";
import { getToken, setToken } from "@/src/shared/lib/auth-token";
import { decodeJwtPayload } from "@/src/shared/lib/jwt";
import { Button } from "@/src/shared/ui";
import { FolderKanban, LogIn } from "lucide-react";

export default function SelectProjectPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    // If already has project_id in token, go directly to dashboard
    const payload = decodeJwtPayload(token);
    if (payload?.project_id) {
      router.replace("/");
      return;
    }

    listProjects()
      .then(setProjects)
      .catch(() => setError("プロジェクト一覧の取得に失敗しました"))
      .finally(() => setIsLoading(false));
  }, [router]);

  const handleSelectProject = async (projectId: string) => {
    setIsSwitching(projectId);
    try {
      const { token } = await switchProject(projectId);
      setToken(token);
      router.replace("/");
    } catch {
      setError("プロジェクトの切り替えに失敗しました");
      setIsSwitching(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 px-4">
        <div className="text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">プロジェクトを選択</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            作業するプロジェクトを選んでください
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            プロジェクトがありません
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                disabled={isSwitching !== null}
                className="flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-4 text-left transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 cursor-pointer"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-medium">{project.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {project.slug}
                  </div>
                </div>
                {isSwitching === project.id && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem("vigil_token");
              router.replace("/login");
            }}
          >
            <LogIn className="mr-2 h-4 w-4" />
            別のアカウントでログイン
          </Button>
        </div>
      </div>
    </div>
  );
}
