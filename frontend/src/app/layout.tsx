import type { Metadata } from "next";
import { ConditionalAppShell } from "@/src/widgets/app-shell/ui/ConditionalAppShell";
import { OAuthTokenCapture } from "@/src/features/auth/ui/OAuthTokenCapture";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vigil",
  description: "Bug tracking dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark">
      <body className="min-h-screen bg-background antialiased">
        <OAuthTokenCapture />
        <ConditionalAppShell>{children}</ConditionalAppShell>
      </body>
    </html>
  );
}
