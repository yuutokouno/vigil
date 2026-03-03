export const metadata = {
  title: "Vigil",
  description: "Bug tracking dashboard for archaive",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
