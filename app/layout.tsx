import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "getajob", template: "%s · getajob" },
  description: "Direct founder-posted roles and public proof-of-work profiles for early-stage teams.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
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
