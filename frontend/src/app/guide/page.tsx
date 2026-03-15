"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bug,
  Kanban,
  Milestone,
  FlaskConical,
  PackageCheck,
  BarChart2,
  Settings,
  Github,
  ExternalLink,
  ChevronRight,
  Info,
  Lightbulb,
  AlertCircle,
  Globe,
  FolderKanban,
  Slack,
} from "lucide-react";

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 flex gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-[12px]">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span className="text-foreground/80">{children}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 flex gap-3 rounded-lg border border-border bg-card px-4 py-3 text-[12px]">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[12px]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <span className="text-amber-200/90">{children}</span>
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-border bg-card">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0 odd:bg-background even:bg-card">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-foreground/80">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Screenshot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border shadow-md">
      <Image
        src={src}
        alt={alt}
        width={1280}
        height={720}
        className="w-full"
        unoptimized
      />
    </div>
  );
}

function SectionHeading({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 border-b border-border pb-2 text-[15px] font-semibold">
      <Icon className="h-4 w-4 text-primary" />
      {children}
    </h2>
  );
}

const TOC_ITEMS = [
  { href: "#login",        label: "ログイン" },
  { href: "#issues",       label: "Issues" },
  { href: "#new-bug",      label: "バグを登録する" },
  { href: "#board",        label: "Board" },
  { href: "#milestones",   label: "Milestones" },
  { href: "#scenarios",    label: "テストシナリオ" },
  { href: "#releases",     label: "リリース管理" },
  { href: "#analytics",    label: "Analytics" },
  { href: "#settings",     label: "ワークフロー設定" },
  { href: "#integrations", label: "連携管理" },
  { href: "#projects",     label: "プロジェクト管理" },
  { href: "#report",       label: "外部バグ報告" },
];

export default function GuidePage() {
  return (
    <div className="flex gap-8">
      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-12 py-2">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">操作ガイド</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          バグトラッキング・テスト管理・リリース計画を一元化するダッシュボードの使い方
        </p>
      </div>

      {/* ── ログイン ─────────────────────────────────── */}
      <section id="login">
        <SectionHeading icon={Github}>ログイン</SectionHeading>
        <DataTable
          headers={["操作", "場所"]}
          rows={[
            ["ログイン",             "ログイン画面中央の「GitHub でログイン」ボタン"],
            ["ログアウト",           "サイドバー左下のログアウトアイコン（矢印）"],
            ["プロジェクト切り替え", "サイドバー上部のプロジェクト選択ドロップダウン"],
          ]}
        />
      </section>

      {/* ── Issues ───────────────────────────────────── */}
      <section id="issues">
        <SectionHeading icon={Bug}>Issues（バグ一覧）</SectionHeading>
        <p className="mb-3 text-[12px] text-muted-foreground">
          バグの一覧を確認・管理するメインページです。ステータスのサマリーカードと、フィルター付きリスト／ボードビューを切り替えられます。
        </p>
        <Screenshot src="/guide/issues.png" alt="Issues ページ" />
        <DataTable
          headers={["機能", "操作方法"]}
          rows={[
            ["バグを新規作成",  "右上「＋ 新規バグ」ボタン"],
            ["バグを検索",      "検索バーにキーワードを入力（タイトル全文検索）"],
            ["フィルター",      "ステータス／深刻度／担当者のドロップダウン"],
            ["ビュー切り替え",  "右上「テーブル」「ボード」ボタン"],
            ["バグ詳細を開く",  "バグのタイトルをクリック"],
          ]}
        />
        <Tip>
          バグ番号は <code className="rounded bg-secondary px-1">VIGIL-0001</code> 形式で自動採番されます。GitHub PR のタイトルや本文にこの番号を含めると自動でリンクされます。
        </Tip>
      </section>

      {/* ── バグ登録 ─────────────────────────────────── */}
      <section id="new-bug">
        <SectionHeading icon={Bug}>バグを登録する</SectionHeading>
        <Screenshot src="/guide/new-bug.png" alt="バグ登録フォーム" />
        <DataTable
          headers={["フィールド", "説明", "必須"]}
          rows={[
            ["タイトル",       "バグの概要（1〜2文）",                  "✓"],
            ["説明",           "詳細な説明・影響範囲など",              ""],
            ["再現手順",       "ステップバイステップの再現方法",        ""],
            ["深刻度",         "Critical / High / Medium / Low",        ""],
            ["優先度",         "P0 〜 P3",                              ""],
            ["カテゴリ",       "frontend / backend / api 等",           ""],
            ["バージョン",     "v1.4.0 など",                           ""],
            ["発見段階",       "internal / qa / aegis / customer",      ""],
            ["マイルストーン", "関連マイルストーンに紐付け",            ""],
            ["添付ファイル",   "スクリーンショット等",                  ""],
          ]}
        />
        <Note>
          深刻度と発見段階は Analytics のヒートマップおよびテストシナリオの優先スコア算出に使われます。できるだけ正確に入力してください。
        </Note>
      </section>

      {/* ── Board ────────────────────────────────────── */}
      <section id="board">
        <SectionHeading icon={Kanban}>Board（カンバンボード）</SectionHeading>
        <Screenshot src="/guide/board.png" alt="カンバンボード" />
        <DataTable
          headers={["操作", "方法"]}
          rows={[
            ["ステータス変更",  "カードを別のカラムにドラッグ&ドロップ"],
            ["バグ詳細を開く",  "カードをクリック"],
            ["カラムを追加",    "Settings > ワークフロー設定"],
          ]}
        />
      </section>

      {/* ── Milestones ───────────────────────────────── */}
      <section id="milestones">
        <SectionHeading icon={Milestone}>Milestones</SectionHeading>
        <Screenshot src="/guide/milestones.png" alt="Milestones" />
        <DataTable
          headers={["操作", "方法"]}
          rows={[
            ["作成",           "「+ 新規マイルストーン」。タイトル・説明・期日を入力"],
            ["バグを紐付ける", "バグ登録フォームの「マイルストーン」フィールドで選択"],
            ["進捗確認",       "一覧の進捗バー、または Analytics 下部のカード"],
            ["クローズ",       "マイルストーン詳細の「クローズ」ボタン"],
          ]}
        />
      </section>

      {/* ── テストシナリオ ───────────────────────────── */}
      <section id="scenarios">
        <SectionHeading icon={FlaskConical}>テストシナリオ</SectionHeading>
        <Screenshot src="/guide/scenarios.png" alt="テストシナリオ" />
        <p className="mb-3 text-[12px] text-muted-foreground">
          回帰テスト等の手動テストシナリオを管理します。バグの深刻度・発見段階から優先スコアを自動計算します。
        </p>
        <div className="my-4 rounded-lg border border-border bg-card p-4 font-mono text-[12px]">
          <p className="mb-2 text-muted-foreground">優先スコア計算式</p>
          <p className="text-primary">score = Σ (severity_weight × discovery_weight)</p>
          <div className="mt-3 grid grid-cols-2 gap-4 text-[11px]">
            <div>
              <p className="mb-1 text-muted-foreground">深刻度</p>
              {[["critical","4"],["high","3"],["medium","2"],["low","1"]].map(([k,v])=>(
                <div key={k} className="flex justify-between border-b border-border py-0.5">
                  <span>{k}</span><span className="text-primary">{v}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-1 text-muted-foreground">発見段階</p>
              {[["customer","3"],["aegis","2"],["qa","1.5"],["internal","1"]].map(([k,v])=>(
                <div key={k} className="flex justify-between border-b border-border py-0.5">
                  <span>{k}</span><span className="text-primary">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DataTable
          headers={["操作", "方法"]}
          rows={[
            ["シナリオ作成",     "「+ 新規シナリオ」。タイトル・feature_tag・テスト手順を入力"],
            ["feature_tag",      "バグの「カテゴリ」と紐付く識別子（例: frontend, payment）"],
            ["優先スコアを見る", "「優先度」タブで直近 30 日のランキングを確認"],
          ]}
        />
      </section>

      {/* ── リリース管理 ─────────────────────────────── */}
      <section id="releases">
        <SectionHeading icon={PackageCheck}>リリース管理</SectionHeading>
        <Screenshot src="/guide/releases.png" alt="リリース管理" />
        <DataTable
          headers={["ステータス", "意味"]}
          rows={[
            ["draft",  "準備中"],
            ["active", "テスト実施中。毎朝 10:00 に Slack リマインダーが送信される"],
            ["done",   "全チェック完了"],
          ]}
        />
        <DataTable
          headers={["操作", "方法"]}
          rows={[
            ["リリース作成",           "「+ 新規リリース」。バージョン・リリース日を入力"],
            ["チェックリスト自動生成", "リリース詳細の「チェックリスト生成」ボタン"],
            ["チェック済みにする",     "各行のチェックボックスをクリック"],
          ]}
        />
      </section>

      {/* ── Analytics ────────────────────────────────── */}
      <section id="analytics">
        <SectionHeading icon={BarChart2}>Analytics</SectionHeading>
        <Screenshot src="/guide/analytics.png" alt="Analytics" />
        <DataTable
          headers={["機能", "説明"]}
          rows={[
            ["期間切り替え",       "7日 / 30日 / 90日 ボタン"],
            ["前期間比較",         "「前期間と比較」トグル"],
            ["バージョン絞り込み", "バージョン入力欄に v1.4.0 等を入力"],
            ["発見段階絞り込み",   "internal / qa / aegis / customer から選択"],
            ["ヒートマップ",       "週ごと×カテゴリのバグ集中度。濃い色ほど件数多"],
            ["Severity 内訳",      "ドーナツグラフで critical〜low の割合を確認"],
            ["担当者別クローズ",   "期間内にバグをクローズした担当者のランキング"],
          ]}
        />
      </section>

      {/* ── Settings ─────────────────────────────────── */}
      <section id="settings">
        <SectionHeading icon={Settings}>ワークフロー設定</SectionHeading>
        <Screenshot src="/guide/settings.png" alt="ワークフロー設定" />
        <DataTable
          headers={["操作", "方法"]}
          rows={[
            ["カラム追加",   "「新しいカラムを追加」フォームに名前とスラッグを入力"],
            ["カラム名変更", "行右端の鉛筆アイコンをクリックしてインライン編集"],
            ["カラム削除",   "行右端のゴミ箱アイコン（open/closed は削除不可）"],
            ["並び替え",     "各行左端のグリップ（⠿）をドラッグ"],
          ]}
        />
        <Warn>
          スラッグは一度作成すると変更できません。既存バグの status と紐付いているため変更は既存データに影響します。
        </Warn>
      </section>

      {/* ── 連携管理 ─────────────────────────────────── */}
      <section id="integrations">
        <SectionHeading icon={Slack}>連携管理</SectionHeading>
        <Screenshot src="/guide/integrations.png" alt="連携管理" />
        <DataTable
          headers={["連携", "できること"]}
          rows={[
            ["Slack",   "Webhook URL または Bot Token を設定。バグ起票・ステータス変更・テストリマインダーを通知"],
            ["GitHub",  "PR に VIGIL-XXXX を書くと自動ステータス更新。Issues の取り込みも可"],
            ["HubSpot", "HubSpot のカスタムフォームから VIGIL にバグを自動起票"],
          ]}
        />
        <div className="my-4 space-y-2 rounded-lg border border-border bg-card p-4 text-[12px]">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">GitHub 連携フロー</p>
          {[
            ["PR オープン / sync",    "VIGIL-XXXX の status → in_review"],
            ["PR マージ",              "VIGIL-XXXX の status → closed"],
            ["GitHub Issue オープン",  "VIGIL に新規バグ自動作成"],
            ["VIGIL バグ クローズ",    "GitHub Issue に resolved ラベル＋コメント"],
          ].map(([from, to]) => (
            <div key={from} className="flex items-center gap-2">
              <span className="rounded bg-secondary px-2 py-0.5 text-primary">{from}</span>
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="text-foreground/80">{to}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── プロジェクト管理 ─────────────────────────── */}
      <section id="projects">
        <SectionHeading icon={FolderKanban}>プロジェクト管理</SectionHeading>
        <DataTable
          headers={["ロール", "できること"]}
          rows={[
            ["owner",  "全操作 + メンバーの招待・削除・ロール変更"],
            ["member", "バグ・マイルストーン等の CRUD"],
            ["viewer", "閲覧のみ"],
          ]}
        />
        <DataTable
          headers={["操作", "方法"]}
          rows={[
            ["プロジェクト切り替え", "サイドバー上部のドロップダウン"],
            ["新規プロジェクト作成", "Settings > プロジェクト管理 > 「+ 新規プロジェクト」"],
            ["メンバー招待",         "プロジェクト管理ページで GitHub ユーザー名を入力"],
            ["メンバー削除",         "メンバー一覧の削除ボタン（owner のみ）"],
          ]}
        />
      </section>

      {/* ── 外部バグ報告 ─────────────────────────────── */}
      <section id="report">
        <SectionHeading icon={Globe}>外部バグ報告</SectionHeading>
        <Screenshot src="/guide/report.png" alt="外部バグ報告フォーム" />
        <p className="mb-3 text-[12px] text-muted-foreground">
          GitHub アカウントを持たないユーザーでもバグを報告できる公開フォームです。
        </p>
        <div className="my-4 flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <Globe className="h-4 w-4 shrink-0 text-primary" />
          <code className="text-[12px] text-primary">/report</code>
          <span className="text-[11px] text-muted-foreground">— ログイン不要のパブリックページ</span>
          <Link
            href="/report"
            target="_blank"
            className="ml-auto flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            開く <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <Tip>
          外部報告フォームのリンクをユーザー向けドキュメントや Slack チャンネルに貼っておくと、非エンジニアからのバグ報告を集めやすくなります。
        </Tip>
      </section>

      </div>{/* end main content */}

      {/* Right TOC */}
      <aside className="hidden w-44 shrink-0 lg:block">
        <div className="sticky top-4 space-y-1">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            目次
          </p>
          {TOC_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </div>
      </aside>
    </div>
  );
}
