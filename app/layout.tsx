import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "getajob — High signal roles",
  description: "Curated high-growth roles from early teams and recently funded startups.",
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
