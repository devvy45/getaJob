import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "getajob — roles and proof-first talent",
  description: "Direct founder-posted roles and public proof-of-work profiles for early-stage teams.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
