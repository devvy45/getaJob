import type { Metadata } from "next";

export const metadata: Metadata = { title: "Build your POW" };

export default function ShowPowLayout({ children }: { children: React.ReactNode }) {
  return children;
}
