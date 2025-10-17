// app/layout.tsx
import "./globals.css";
import NoSSR from "./NoSSR";

export const metadata = {
  title: "Asian Nour — Commande à table",
  description: "QR table ordering",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className="min-h-dvh bg-[var(--color-background)] text-[var(--color-text)] antialiased font-body"
        suppressHydrationWarning
      >
        <NoSSR>{children}</NoSSR>
      </body>
    </html>
  );
}
