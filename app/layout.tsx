import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Absolute Mind — Personalised check-ins",
  description: "Thoughtful assessments and personalised next steps from Absolute Mind."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
