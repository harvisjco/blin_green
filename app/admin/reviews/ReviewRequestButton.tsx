"use client";

import { useState } from "react";

export function ReviewRequestButton({ message }: { message: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className="admin-link-button" onClick={copy}>
      {copied ? "복사됨 ✓" : "요청 문구 복사"}
    </button>
  );
}
