import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { AppShell } from "@/src/widgets/app-shell/ui/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vigil",
  description: "Bug tracking dashboard for archaive",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
