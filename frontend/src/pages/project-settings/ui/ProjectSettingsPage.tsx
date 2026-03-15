"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, UserPlus, Trash2, FolderKanban, ArrowRight } from "lucide-react";
import { Button } from "@/src/shared/ui";
import {
  createProject,
  inviteMember,
  listMembers,
  listProjects,
  removeMember,
  switchProject,
  type ProjectMember,
} from "@/src/entities/project/api/project-api";
import type { Project } from "@/src/entities/project/model/types";
import { setToken } from "@/src/shared/lib/auth-token";
import { decodeJwtPayload } from "@/src/shared/lib/jwt";
import { getToken } from "@/src/shared/lib/auth-token";
import { useRouter } from "next/navigation";

const ROLE_LABELS: Record<string, string> = {
  owner: "オーナー",
  member: "メンバー",
  viewer: "ビューアー",
};

export function ProjectSettingsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "" });
  const [inviteForm, setInviteForm] = useState({ github_id: "", role: "member" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect current project from JWT
  useEffect(() => {
    const token = getToken();
    if (token) {
      const payload = decodeJwtPayload(token);
      setCurrentProjectId(payload?.project_id ?? null);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        const current = data.find((p) => p.id === currentProjectId) ?? data[0];
        setSelectedProject(current);
      }
    } catch {
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentProjectId, selectedProject]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const fetchMembers = useCallback(async (project: Project) => {
    try {
      const data = await listMembers(project.id);
      setMembers(data);
      const token = getToken();
      if (token) {
        const payload = decodeJwtPayload(token);
        const me = data.find((m) => m.user_id === payload?.sub);
        setMyRole(me?.role ?? null);
      }
    } catch {
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    if (selectedProject) fetchMembers(selectedProject);
  }, [selectedProject, fetchMembers]);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setShowInviteForm(false);
    setError(null);
  };

  const handleSwitchProject = async (project: Project) => {
    try {
      const result = await switchProject(project.id);
      setToken(result.token);
      setCurrentProjectId(result.project_id);
      router.push("/");
    } catch {
      setError("プロジェクトの切り替えに失敗しました");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createProject({ name: createForm.name });
      setProjects((prev) => [...prev, created]);
      setSelectedProject(created);
      setCreateForm({ name: "" });
      setShowCreateForm(false);
    } catch {
      setError("プロジェクトの作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !inviteForm.github_id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const member = await inviteMember(
        selectedProject.id,
        inviteForm.github_id,
        inviteForm.role
      );
      setMembers((prev) => {
        const exists = prev.find((m) => m.user_id === member.user_id);
        return exists ? prev : [...prev, member];
      });
      setInviteForm({ github_id: "", role: "member" });
      setShowInviteForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "招待に失敗しました";
      setError(msg.includes("not found") || msg.includes("404")
        ? `GitHub ユーザー「${inviteForm.github_id}」はまだ Vigil にログインしていません`
        : "招待に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    if (!selectedProject) return;
    if (!confirm(`${member.name} をプロジェクトから削除しますか？`)) return;
    await removeMember(selectedProject.id, member.user_id);
    setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-tight">プロジェクト管理</h1>

      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Project list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              プロジェクト
            </p>
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="プロジェクトを作成"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateProject} className="space-y-2 rounded-lg border p-3">
              <input
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                placeholder="プロジェクト名"
                value={createForm.name}
                onChange={(e) => setCreateForm({ name: e.target.value })}
                required
                autoFocus
              />
              <div className="flex gap-1">
                <Button type="submit" size="sm" disabled={isSubmitting} className="flex-1">
                  作成
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  ✕
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">読み込み中...</p>
          ) : (
            <div className="space-y-1">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProject(p)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                    selectedProject?.id === p.id
                      ? "bg-secondary text-foreground"
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderKanban className="h-4 w-4 shrink-0" />
                    <span className="text-sm truncate">{p.name}</span>
                    {p.id === currentProjectId && (
                      <span className="text-xs bg-primary/10 text-primary rounded px-1">
                        使用中
                      </span>
                    )}
                  </div>
                  {p.id !== currentProjectId && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSwitchProject(p); }}
                      className="ml-1 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                      title="このプロジェクトに切り替え"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Member management */}
        <div className="space-y-4">
          {selectedProject ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium">{selectedProject.name}</h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    /{selectedProject.slug}
                  </p>
                </div>
                {myRole === "owner" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowInviteForm((v) => !v)}
                  >
                    <UserPlus className="mr-1 h-4 w-4" />
                    メンバーを招待
                  </Button>
                )}
              </div>

              {showInviteForm && (
                <form
                  onSubmit={handleInvite}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    GitHub ユーザー名で招待（対象者は先に Vigil にログインしている必要があります）
                  </p>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-md border px-3 py-1.5 text-sm"
                      placeholder="github-username"
                      value={inviteForm.github_id}
                      onChange={(e) =>
                        setInviteForm((f) => ({ ...f, github_id: e.target.value }))
                      }
                      required
                      autoFocus
                    />
                    <select
                      className="rounded-md border px-2 py-1.5 text-sm"
                      value={inviteForm.role}
                      onChange={(e) =>
                        setInviteForm((f) => ({ ...f, role: e.target.value }))
                      }
                    >
                      <option value="member">メンバー</option>
                      <option value="viewer">ビューアー</option>
                      <option value="owner">オーナー</option>
                    </select>
                    <Button type="submit" size="sm" disabled={isSubmitting}>
                      招待
                    </Button>
                  </div>
                </form>
              )}

              {/* Member list */}
              <div className="divide-y rounded-lg border">
                {members.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    メンバーがいません
                  </p>
                ) : (
                  members.map((m) => (
                    <div
                      key={m.user_id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        {m.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.avatar_url}
                            alt={m.name}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {m.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{m.name}</p>
                          <p className="text-xs text-muted-foreground">
                            @{m.github_id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                            m.role === "owner"
                              ? "bg-amber-100 text-amber-700"
                              : m.role === "viewer"
                              ? "bg-muted text-muted-foreground"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {ROLE_LABELS[m.role] ?? m.role}
                        </span>
                        {myRole === "owner" && m.role !== "owner" && (
                          <button
                            onClick={() => handleRemoveMember(m)}
                            className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            aria-label="メンバーを削除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              プロジェクトを選択してください
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
