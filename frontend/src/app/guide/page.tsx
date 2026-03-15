"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bug,
  Kanban,
  Milestone,
  FlaskConical,
  PackageCheck,
  BarChart2,
  Settings,
  Github,
  Slack,
  ExternalLink,
  ChevronRight,
  Info,
  Lightbulb,
  AlertCircle,
  Globe,
  Users,
  FolderKanban,
  BookOpen,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Section = {
  id: string;
  label: string;
  icon: React.ElementType;
};

// ─── Section metadata ────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  { id: "overview", label: "はじめに", icon: BookOpen },
  { id: "login", label: "ログイン", icon: Github },
  { id: "issues", label: "Issues（バグ一覧）", icon: Bug },
  { id: "new-bug", label: "バグを登録する", icon: Bug },
  { id: "board", label: "Board（カンバン）", icon: Kanban },
  { id: "milestones", label: "Milestones", icon: Milestone },
  { id: "scenarios", label: "テストシナリオ", icon: FlaskConical },
  { id: "releases", label: "リリース管理", icon: PackageCheck },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "settings", label: "ワークフロー設定", icon: Settings },
  { id: "integrations", label: "連携管理", icon: Slack },
  { id: "projects", label: "プロジェクト管理", icon: FolderKanban },
  { id: "report", label: "外部バグ報告", icon: Globe },
];

// ─── Callout components ───────────────────────────────────────────────────────

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 flex gap-3 rounded-lg border border-[#5E6AD2]/30 bg-[#5E6AD2]/10 px-4 py-3 text-[13px]">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#5E6AD2]" />
      <span className="text-[#c8cae8]">{children}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 flex gap-3 rounded-lg border border-[#252529] bg-[#16161A] px-4 py-3 text-[13px]">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6E6E7A]" />
      <span className="text-[#9E9EAA]">{children}</span>
    </div>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <span className="text-amber-200">{children}</span>
    </div>
  );
}

// Simple table helper
function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="my-4 overflow-hidden rounded-lg border border-[#252529]">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-[#252529] bg-[#16161A]">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium text-[#6E6E7A]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[#252529] last:border-0 odd:bg-[#0A0A0B] even:bg-[#111114]"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-[#c8cae8]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Mock UI panel — shows a simplified representation of a screen
function MockPanel({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-[#252529] bg-[#0A0A0B]">
      {title && (
        <div className="border-b border-[#252529] bg-[#111114] px-4 py-2 text-[11px] font-medium uppercase tracking-widest text-[#6E6E7A]">
          {title}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

function Badge({
  color,
  children,
}: {
  color: "indigo" | "red" | "amber" | "green" | "orange" | "gray";
  children: React.ReactNode;
}) {
  const cls: Record<string, string> = {
    indigo: "bg-[#5E6AD2]/20 text-[#9da8f0] border-[#5E6AD2]/30",
    red: "bg-red-500/20 text-red-300 border-red-500/30",
    amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    green: "bg-green-500/20 text-green-300 border-green-500/30",
    orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    gray: "bg-[#252529]/60 text-[#9E9EAA] border-[#252529]",
  };
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${cls[color]}`}
    >
      {children}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const [active, setActive] = useState("overview");

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen text-[#E2E2E5]"
      style={{
        background: "#0A0A0B",
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26'%3E%3Ccircle cx='13' cy='13' r='0.9' fill='rgba(139%2C92%2C246%2C0.08)'/%3E%3C/svg%3E"),
          radial-gradient(ellipse at 18% 18%, rgba(139,92,246,0.08) 0%,transparent 48%),
          radial-gradient(ellipse at 82% 72%, rgba(59,130,246,0.06) 0%,transparent 42%)
        `,
        backgroundSize: "26px 26px, 100% 100%, 100% 100%",
        backgroundRepeat: "repeat, no-repeat, no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto flex max-w-6xl gap-0">
        {/* ── Sidebar ── */}
        <aside className="sticky top-0 h-screen w-56 shrink-0 border-r border-[#252529] bg-[#111114]/80 backdrop-blur-md">
          <div className="flex h-12 items-center border-b border-[#252529] px-4">
            <Link href="/" className="text-[13px] font-semibold tracking-widest text-[#E2E2E5]/90">
              VIGIL
            </Link>
            <span className="ml-2 rounded bg-[#5E6AD2]/20 px-1.5 py-0.5 text-[10px] text-[#9da8f0]">
              ガイド
            </span>
          </div>
          <nav className="space-y-0.5 px-2 py-3">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[12px] transition-colors ${
                  active === id
                    ? "bg-[#1E1E24] text-[#E2E2E5]"
                    : "text-[#6E6E7A] hover:bg-[#1E1E24] hover:text-[#E2E2E5]"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 border-t border-[#252529] p-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[11px] text-[#6E6E7A] hover:text-[#E2E2E5] transition-colors"
            >
              <ChevronRight className="h-3 w-3" />
              アプリに戻る
            </Link>
          </div>
        </aside>

        {/* ── Content ── */}
        <main className="min-w-0 flex-1 px-10 py-10">
          {/* ── Overview ─────────────────────────────────────────── */}
          <section id="overview" className="mb-16 scroll-mt-8">
            <h1 className="mb-1 text-2xl font-bold tracking-tight">VIGIL 操作ガイド</h1>
            <p className="mb-6 text-[13px] text-[#6E6E7A]">
              バグトラッキング・テスト管理・リリース計画を一元化するダッシュボードの使い方
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Bug, title: "バグ管理", desc: "Issues / Board で起票・進捗管理" },
                { icon: FlaskConical, title: "テスト管理", desc: "シナリオ登録・優先スコア算出" },
                { icon: PackageCheck, title: "リリース", desc: "チェックリスト自動生成で品質確保" },
                { icon: BarChart2, title: "Analytics", desc: "ヒートマップ・トレンド分析" },
                { icon: Slack, title: "外部連携", desc: "Slack / GitHub / HubSpot" },
                { icon: Globe, title: "公開フォーム", desc: "認証不要の外部バグ報告" },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-lg border border-[#252529] bg-[#16161A] p-4"
                >
                  <Icon className="mb-2 h-5 w-5 text-[#5E6AD2]" />
                  <p className="text-[13px] font-medium">{title}</p>
                  <p className="mt-0.5 text-[11px] text-[#6E6E7A]">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Login ────────────────────────────────────────────── */}
          <section id="login" className="mb-16 scroll-mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Github className="h-5 w-5 text-[#5E6AD2]" /> ログイン
            </h2>

            <p className="mb-3 text-[13px] text-[#9E9EAA]">
              VIGIL は GitHub OAuth で認証します。アカウントを持っていれば追加設定なしで利用できます。
            </p>

            <MockPanel title="ログイン画面">
              <div className="flex flex-col items-center gap-3 py-6">
                <span className="text-xl font-bold tracking-widest">VIGIL</span>
                <span className="text-[12px] text-[#6E6E7A]">archaive バグ管理ダッシュボード</span>
                <div className="mt-2 flex items-center gap-2 rounded-md bg-[#5E6AD2] px-4 py-2 text-[13px] font-medium text-white">
                  <Github className="h-4 w-4" /> GitHub でログイン
                </div>
              </div>
            </MockPanel>

            <Table
              headers={["操作", "場所"]}
              rows={[
                ["ログイン", "画面中央の「GitHub でログイン」ボタン"],
                ["ログアウト", "サイドバー左下のログアウトアイコン（矢印）"],
                ["プロジェクト切り替え", "サイドバー上部のプロジェクト選択ドロップダウン"],
              ]}
            />
          </section>

          {/* ── Issues ───────────────────────────────────────────── */}
          <section id="issues" className="mb-16 scroll-mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Bug className="h-5 w-5 text-[#5E6AD2]" /> Issues（バグ一覧）
            </h2>

            <p className="mb-3 text-[13px] text-[#9E9EAA]">
              バグの一覧を確認・管理するメインページです。ステータスのサマリーカードと、フィルター付きリスト／ボードビューを切り替えられます。
            </p>

            <MockPanel title="Issues ページ レイアウト">
              <div className="space-y-3">
                {/* Status cards */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "未対応", count: 3, color: "text-red-400" },
                    { label: "対応中", count: 2, color: "text-amber-400" },
                    { label: "検証待ち", count: 1, color: "text-orange-400" },
                    { label: "クローズ", count: 12, color: "text-green-400" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-[#252529] bg-[#16161A] p-3">
                      <p className="text-[11px] text-[#6E6E7A]">{s.label}</p>
                      <p className={`text-xl font-semibold ${s.color}`}>{s.count}</p>
                    </div>
                  ))}
                </div>
                {/* Filter bar */}
                <div className="flex gap-2">
                  <div className="flex-1 rounded border border-[#252529] bg-[#16161A] px-3 py-1.5 text-[11px] text-[#6E6E7A]">
                    バグを検索…
                  </div>
                  <div className="rounded border border-[#252529] bg-[#16161A] px-3 py-1.5 text-[11px] text-[#6E6E7A]">
                    ステータス ▾
                  </div>
                  <div className="rounded border border-[#252529] bg-[#16161A] px-3 py-1.5 text-[11px] text-[#6E6E7A]">
                    深刻度 ▾
                  </div>
                  <div className="rounded border border-[#252529] bg-[#16161A] px-3 py-1.5 text-[11px] text-[#6E6E7A]">
                    担当者 ▾
                  </div>
                </div>
              </div>
            </MockPanel>

            <Table
              headers={["機能", "操作方法"]}
              rows={[
                ["バグを新規作成", "右上「＋ 新規バグ」ボタン、または /bugs/new に直接アクセス"],
                ["バグを検索", "検索バーにキーワードを入力（タイトル全文検索）"],
                ["フィルター", "ステータス／深刻度／担当者の各ドロップダウン"],
                ["ビュー切り替え", "右上「テーブル」「ボード」ボタンでリスト⇔カンバン"],
                ["バグ詳細を開く", "バグのタイトルをクリック"],
                ["バグを閉じる", "詳細ページでステータスを「クローズ」に変更"],
              ]}
            />

            <Tip>
              バグ番号は <code className="rounded bg-[#1E1E24] px-1">VIGIL-0001</code> 形式で自動採番されます。GitHub PR のタイトルや本文にこの番号を含めると自動でリンクされます。
            </Tip>
          </section>

          {/* ── New Bug ───────────────────────────────────────────── */}
          <section id="new-bug" className="mb-16 scroll-mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Bug className="h-5 w-5 text-[#5E6AD2]" /> バグを登録する
            </h2>

            <p className="mb-3 text-[13px] text-[#9E9EAA]">
              「＋ 新規バグ」から詳細なバグ情報を入力して登録します。
            </p>

            <Table
              headers={["フィールド", "説明", "必須"]}
              rows={[
                ["タイトル", "バグの概要（1〜2文）", "✓"],
                ["説明", "詳細な説明・影響範囲など", ""],
                ["再現手順", "ステップバイステップの再現方法", ""],
                ["期待する挙動", "本来どう動くべきか", ""],
                ["実際の挙動", "実際に起きていること", ""],
                ["深刻度", "Critical / High / Medium / Low", ""],
                ["優先度", "P0 〜 P3", ""],
                ["カテゴリ", "frontend / backend / api 等", ""],
                ["担当者", "GitHub ユーザー名", ""],
                ["報告者", "報告した人の名前", ""],
                ["環境", "Chrome / macOS など", ""],
                ["バージョン", "v1.4.0 など", ""],
                ["発見段階", "internal / qa / aegis / customer", ""],
                ["マイルストーン", "関連マイルストーンに紐付け", ""],
                ["添付ファイル", "スクリーンショット等（画像・PDF など）", ""],
              ]}
            />

            <Note>
              深刻度と発見段階は Analytics のヒートマップおよびテストシナリオの優先スコア算出に使われます。できるだけ正確に入力してください。
            </Note>
          </section>

          {/* ── Board ─────────────────────────────────────────────── */}
          <section id="board" className="mb-16 scroll-mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Kanban className="h-5 w-5 text-[#5E6AD2]" /> Board（カンバンボード）
            </h2>

            <p className="mb-3 text-[13px] text-[#9E9EAA]">
              バグをカラム（ステータス）で管理するカンバンビューです。Issues ページの「ボード」ボタン、またはサイドバー「Board」から開けます。
            </p>

            <MockPanel title="カンバンボード">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {["未対応", "対応中", "検証待ち", "テストコード", "クローズ"].map((col) => (
                  <div key={col} className="w-36 shrink-0">
                    <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-[#E2E2E5]">
                      <span>{col}</span>
                      <span className="rounded bg-[#252529] px-1 text-[10px] text-[#6E6E7A]">0</span>
                    </div>
                    <div className="min-h-16 rounded-lg border border-dashed border-[#252529] bg-[#16161A] p-2 text-[11px] text-[#6E6E7A]">
                      ここにカード
                    </div>
                  </div>
                ))}
              </div>
            </MockPanel>

            <Table
              headers={["操作", "方法"]}
              rows={[
                ["ステータス変更", "カードを別のカラムにドラッグ&ドロップ"],
                ["バグ詳細を開く", "カードをクリック"],
                ["カラムを追加・並び替え", "Settings > ワークフロー設定"],
              ]}
            />

            <Tip>
              カラムの追加・名前変更・スラッグ変更は Settings ページで行います。スラッグは一度設定すると変更できません。
            </Tip>
          </section>

          {/* ── Milestones ────────────────────────────────────────── */}
          <section id="milestones" className="mb-16 scroll-mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Milestone className="h-5 w-5 text-[#5E6AD2]" /> Milestones
            </h2>

            <p className="mb-3 text-[13px] text-[#9E9EAA]">
              リリースや開発フェーズの節目をマイルストーンとして管理します。バグをマイルストーンに紐付けることで進捗を可視化できます。
            </p>

            <MockPanel title="マイルストーン例">
              <div className="space-y-2">
                {[
                  { title: "v1.5.0 リリース", total: 8, closed: 5, status: "active" },
                  { title: "バグ祭り Q1", total: 20, closed: 20, status: "closed" },
                ].map((m) => (
                  <div key={m.title} className="rounded-lg border border-[#252529] bg-[#16161A] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[13px] font-medium">{m.title}</span>
                      <Badge color={m.status === "active" ? "indigo" : "gray"}>
                        {m.status === "active" ? "進行中" : "完了"}
                      </Badge>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#252529]">
                      <div
                        className="h-full rounded-full bg-[#5E6AD2]"
                        style={{ width: `${Math.round((m.closed / m.total) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[#6E6E7A]">
                      {m.closed}/{m.total} クローズ ({Math.round((m.closed / m.total) * 100)}%)
                    </p>
                  </div>
                ))}
              </div>
            </MockPanel>

            <Table
              headers={["操作", "方法"]}
              rows={[
                ["マイルストーン作成", "「+ 新規マイルストーン」ボタン。タイトル・説明・期日を入力"],
                ["バグを紐付ける", "バグ登録・編集フォームの「マイルストーン」フィールドで選択"],
                ["進捗確認", "マイルストーン一覧の進捗バーで確認。Analytics でも表示"],
                ["クローズ", "マイルストーン詳細の「クローズ」ボタン"],
              ]}
            />
          </section>

          {/* ── Test Scenarios ────────────────────────────────────── */}
          <section id="scenarios" className="mb-16 scroll-mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FlaskConical className="h-5 w-5 text-[#5E6AD2]" /> テストシナリオ
            </h2>

            <p className="mb-3 text-[13px] text-[#9E9EAA]">
              回帰テストなどの手動テストシナリオを管理します。バグの深刻度・発見段階から優先スコアを自動計算し、次のリリースで重点的にテストすべき箇所を把握できます。
            </p>

            <MockPanel title="優先スコアの計算式">
              <div className="space-y-3 font-mono text-[12px]">
                <div className="rounded bg-[#16161A] p-3 text-[#9da8f0]">
                  score = Σ (severity_weight × discovery_weight)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-[11px] text-[#6E6E7A]">深刻度 (severity_weight)</p>
                    {[["critical", "4"], ["high", "3"], ["medium", "2"], ["low", "1"]].map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-[#252529] py-0.5 text-[11px]">
                        <span className="text-[#E2E2E5]">{k}</span>
                        <span className="text-[#9da8f0]">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] text-[#6E6E7A]">発見段階 (discovery_weight)</p>
                    {[["customer", "3"], ["aegis", "2"], ["qa", "1.5"], ["internal", "1"]].map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-[#252529] py-0.5 text-[11px]">
                        <span className="text-[#E2E2E5]">{k}</span>
                        <span className="text-[#9da8f0]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </MockPanel>

            <Table
              headers={["操作", "方法"]}
              rows={[
                ["シナリオ作成", "「+ 新規シナリオ」ボタン。タイトル・feature_tag・テスト手順を入力"],
                ["feature_tag", "バグの「カテゴリ」と紐付く識別子（例: frontend, payment）"],
                ["優先スコアを見る", "「優先度」タブで直近 30 日のスコアランキングを確認"],
                ["シナリオ削除", "一覧行の「削除」ボタン"],
              ]}
            />

            <Tip>
              feature_tag にはバグのカテゴリ名を入れてください。例えばバグに <code className="rounded bg-[#1E1E24] px-1">category: frontend</code> が多い場合、<code className="rounded bg-[#1E1E24] px-1">feature_tag: frontend</code> のシナリオが高スコアになります。
            </Tip>
          </section>

          {/* ── Releases ──────────────────────────────────────────── */}
          <section id="releases" className="mb-16 scroll-mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <PackageCheck className="h-5 w-5 text-[#5E6AD2]" /> リリース管理
            </h2>

            <p className="mb-3 text-[13px] text-[#9E9EAA]">
              リリースごとにチェックリストを管理します。優先スコア上位のテストシナリオを自動選択してチェックリストを生成できます。Slack 通知で進捗をチームにリマインドします。
            </p>

            <Table
              headers={["ステータス", "意味"]}
              rows={[
                ["draft", "準備中。チェックリストを組み立て中"],
                ["active", "テスト実施中。Slack リマインダーが有効"],
                ["done", "全チェック完了"],
              ]}
            />

            <Table
              headers={["操作", "方法"]}
              rows={[
                ["リリース作成", "「+ 新規リリース」。バージョン・リリース日を入力"],
                ["チェックリスト自動生成", "リリース詳細の「チェックリスト生成」ボタン（上位 N シナリオを選択）"],
                ["チェック済みにする", "チェックリスト各行のチェックボックスをクリック"],
                ["進捗確認", "進捗バー（checked/total）で確認"],
                ["Slack 通知", "毎朝 10:00 に未完了リリースの進捗を #general へ通知"],
              ]}
            />

            <Note>
              Slack 通知を受け取るには Settings &gt; 連携管理で Slack Integration を設定する必要があります。
            </Note>
          </section>

          {/* ── Analytics ─────────────────────────────────────────── */}
          <section id="analytics" className="mb-16 scroll-mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <BarChart2 className="h-5 w-5 text-[#5E6AD2]" /> Analytics
            </h2>

            <p className="mb-3 text-[13px] text-[#9E9EAA]">
              バグの傾向を多角的に分析するダッシュボードです。期間・バージョン・発見段階でドリルダウンできます。
            </p>

            <MockPanel title="ヒートマップ（週×カテゴリ）">
              <div className="overflow-x-auto">
                <table className="text-[11px]">
                  <thead>
                    <tr>
                      <th className="w-20 pr-2 text-right font-normal text-[#6E6E7A]" />
                      {["W10", "W11", "W12"].map((w) => (
                        <th key={w} className="w-10 pb-1 text-center font-normal text-[#6E6E7A]">{w}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { cat: "frontend", vals: ["bg-[#5E6AD2]/20", "bg-[#5E6AD2]/60", "bg-[#5E6AD2]/40"] },
                      { cat: "backend", vals: ["bg-[#5E6AD2]/60", "bg-[#5E6AD2]/20", "bg-[#5E6AD2]/80"] },
                      { cat: "api", vals: ["bg-[#1E1E24]", "bg-[#5E6AD2]/40", "bg-[#5E6AD2]/20"] },
                    ].map(({ cat, vals }) => (
                      <tr key={cat}>
                        <td className="pr-2 text-right text-[#9E9EAA]">{cat}</td>
                        {vals.map((v, i) => (
                          <td key={i} className="p-0.5">
                            <div className={`h-7 w-9 rounded-sm ${v}`} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#6E6E7A]">
                  <span>少</span>
                  {["bg-[#1E1E24]", "bg-[#5E6AD2]/20", "bg-[#5E6AD2]/40", "bg-[#5E6AD2]/60", "bg-[#5E6AD2]/80"].map((c, i) => (
                    <div key={i} className={`h-3.5 w-4 rounded-sm ${c}`} />
                  ))}
                  <span>多</span>
                </div>
              </div>
            </MockPanel>

            <Table
              headers={["機能", "説明"]}
              rows={[
                ["期間切り替え", "7日 / 30日 / 90日 ボタン"],
                ["前期間比較", "「前期間と比較」トグルで同期間の前期間と並列表示"],
                ["バージョンフィルター", "バージョン入力欄に v1.4.0 等を入力"],
                ["発見段階フィルター", "internal / qa / aegis / customer から選択"],
                ["ヒートマップ", "週ごと×カテゴリのバグ集中度。濃い色ほど件数多"],
                ["Severity 内訳", "ドーナツグラフで critical〜low の割合を確認"],
                ["担当者別クローズ数", "期間内にバグをクローズした担当者のランキング"],
                ["マイルストーン進捗", "Analytics 下部のマイルストーンカード"],
              ]}
            />
          </section>

          {/* ── Settings ──────────────────────────────────────────── */}
          <section id="settings" className="mb-16 scroll-mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Settings className="h-5 w-5 text-[#5E6AD2]" /> ワークフロー設定
            </h2>

            <p className="mb-3 text-[13px] text-[#9E9EAA]">
              Board のカラム（ステータス）を自由に設定できます。サイドバー「Settings」から開きます。
            </p>

            <Table
              headers={["操作", "方法"]}
              rows={[
                ["カラム追加", "「新しいカラムを追加」フォームに名前とスラッグを入力して「追加」"],
                ["カラム名変更", "行右端の鉛筆アイコンをクリックしてインライン編集"],
                ["カラム削除", "行右端のゴミ箱アイコン（open/closed カラムは削除不可）"],
                ["並び替え", "各行左端のグリップ（⠿）をドラッグ"],
              ]}
            />

            <Warn>
              スラッグは一度作成すると変更できません。バグの status フィールドと紐付いているため、変更は既存データに影響します。
            </Warn>
          </section>

          {/* ── Integrations ──────────────────────────────────────── */}
          <section id="integrations" className="mb-16 scroll-mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Slack className="h-5 w-5 text-[#5E6AD2]" /> 連携管理
            </h2>

            <p className="mb-3 text-[13px] text-[#9E9EAA]">
              Settings &gt; 連携管理から Slack・GitHub・HubSpot との連携を設定します。
            </p>

            <Table
              headers={["連携", "できること"]}
              rows={[
                ["Slack", "Webhook URL または Bot Token を設定。バグ起票・ステータス変更を通知。テストリマインダーも Slack に送信"],
                ["GitHub", "Webhook Secret を設定。PR タイトルに VIGIL-XXXX を含めると自動ステータス更新。Issues の取り込みも可"],
                ["HubSpot", "HubSpot のカスタムフォームから VIGIL にバグを自動起票"],
              ]}
            />

            <MockPanel title="GitHub 連携フロー">
              <div className="space-y-2 text-[12px]">
                {[
                  { from: "PR オープン / sync", to: "VIGIL-XXXX の status → in_review" },
                  { from: "PR マージ", to: "VIGIL-XXXX の status → closed" },
                  { from: "GitHub Issue オープン", to: "VIGIL に新規バグ自動作成（source: github）" },
                  { from: "VIGIL バグ クローズ", to: "連携 GitHub Issue に resolved ラベル＋コメント" },
                ].map((f) => (
                  <div key={f.from} className="flex items-center gap-2">
                    <span className="rounded bg-[#1E1E24] px-2 py-0.5 text-[#9da8f0]">{f.from}</span>
                    <ChevronRight className="h-3 w-3 text-[#6E6E7A]" />
                    <span className="text-[#E2E2E5]">{f.to}</span>
                  </div>
                ))}
              </div>
            </MockPanel>

            <Note>
              GitHub Webhook の設定手順: リポジトリの Settings &gt; Webhooks &gt; Add webhook。Payload URL は{" "}
              <code className="rounded bg-[#1E1E24] px-1">https://your-domain/api/webhooks/github</code>、
              Content type は <code className="rounded bg-[#1E1E24] px-1">application/json</code>、
              Secret に VIGIL で設定したシークレットを入力してください。
            </Note>
          </section>

          {/* ── Projects ──────────────────────────────────────────── */}
          <section id="projects" className="mb-16 scroll-mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FolderKanban className="h-5 w-5 text-[#5E6AD2]" /> プロジェクト管理
            </h2>

            <p className="mb-3 text-[13px] text-[#9E9EAA]">
              複数のプロジェクト（テナント）を作成・切り替えできます。バグ・マイルストーン等のデータはプロジェクト単位で完全に分離されています。
            </p>

            <Table
              headers={["ロール", "できること"]}
              rows={[
                ["owner", "全操作 + メンバーの招待・削除・ロール変更"],
                ["member", "バグ・マイルストーン等の CRUD"],
                ["viewer", "閲覧のみ（書き込み不可）"],
              ]}
            />

            <Table
              headers={["操作", "方法"]}
              rows={[
                ["プロジェクト切り替え", "サイドバー上部のドロップダウン（切り替え後は新しい JWT が発行されます）"],
                ["新規プロジェクト作成", "Settings > プロジェクト管理 > 「+ 新規プロジェクト」"],
                ["メンバー招待", "プロジェクト管理ページ右ペイン「メンバー追加」に GitHub ユーザー名を入力"],
                ["メンバー削除", "メンバー一覧の削除ボタン（owner のみ操作可）"],
                ["自分を削除", "自分自身のメンバー削除は不可"],
              ]}
            />

            <Tip>
              初回ログイン時は「Default」プロジェクトが自動作成されます。新しいプロジェクトを作成してメンバーを招待すると、チームごとに独立したバグ管理環境が構築できます。
            </Tip>
          </section>

          {/* ── External Report ───────────────────────────────────── */}
          <section id="report" className="mb-16 scroll-mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Globe className="h-5 w-5 text-[#5E6AD2]" /> 外部バグ報告
            </h2>

            <p className="mb-3 text-[13px] text-[#9E9EAA]">
              GitHub アカウントを持たないユーザーでもバグを報告できる公開フォームです。
              受け付けたバグは VIGIL 内に自動登録されます。
            </p>

            <div className="my-4 flex items-center gap-3 rounded-lg border border-[#252529] bg-[#16161A] px-4 py-3">
              <Globe className="h-4 w-4 shrink-0 text-[#5E6AD2]" />
              <code className="text-[13px] text-[#9da8f0]">/report</code>
              <span className="text-[12px] text-[#6E6E7A]">— ログイン不要のパブリックページ</span>
              <Link
                href="/report"
                target="_blank"
                className="ml-auto flex items-center gap-1 text-[12px] text-[#5E6AD2] hover:underline"
              >
                開く <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <Table
              headers={["フィールド", "説明"]}
              rows={[
                ["タイトル", "必須。問題の概要"],
                ["説明", "詳細・再現手順・期待する動作と実際の動作"],
                ["深刻度", "Critical / High / Medium / Low"],
                ["バージョン", "影響するバージョン"],
                ["環境", "OS・ブラウザ等"],
                ["お名前", "任意。報告者名（匿名可）"],
              ]}
            />

            <Note>
              報告後に表示される <code className="rounded bg-[#1E1E24] px-1">VIGIL-XXXX</code> 番号を控えておくと、後から VIGIL ダッシュボードで対応状況を確認できます。
            </Note>

            <Tip>
              外部報告フォームのリンクをユーザー向けドキュメントや Slack チャンネルに貼っておくと、非エンジニアからのバグ報告を集めやすくなります。
            </Tip>
          </section>

          {/* ── Footer ── */}
          <footer className="mt-4 border-t border-[#252529] pt-6 text-center text-[11px] text-[#6E6E7A]">
            VIGIL — archaive バグ管理ダッシュボード
          </footer>
        </main>
      </div>
    </div>
  );
}
