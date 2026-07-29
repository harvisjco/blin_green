"use client";

import type { ActionResult } from "./actions";

/** Thin wrapper for <form action> when the caller doesn't need success/error feedback. */
export function ActionForm({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form action={async (formData) => { await action(formData); }} className={className}>
      {children}
    </form>
  );
}
