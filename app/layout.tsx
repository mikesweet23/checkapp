import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Checkapp — Insight-led assessments",
  description: "A premium, self-hosted assessment platform for Absolute Mind."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
