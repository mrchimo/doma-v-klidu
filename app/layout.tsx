import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doma v klidu",
  description: "Česká platforma pro hlídání domovů s mazlíčky."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
