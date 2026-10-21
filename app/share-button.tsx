"use client";

import { useState } from "react";

type Props = {
  jobId: string;
  company: string;
  role: string;
  className?: string;
};

export default function ShareButton({ jobId, company, role, className }: Props) {
  const [copied, setCopied] = useState(false);
  const path = `/jobs/${jobId}`;
  const shareUrl =
    typeof window !== "undefined" ? window.location.origin + path : path;
  const shareText = `${role} at ${company}, via getajob`;

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: shareUrl });
      } catch {
        try {
          await copyLink();
        } catch {
          // both failed — ignore
        }
      }
      return;
    }

    try {
      await copyLink();
    } catch {
      // clipboard denied — ignore
    }
  }

  return (
    <button
      className={className}
      type="button"
      onClick={handleShare}
      aria-label={`Share ${role} at ${company}`}
      title="Share this role"
    >
      {copied ? "Copied" : "Share with a friend"} <span>↗</span>
    </button>
  );
}
