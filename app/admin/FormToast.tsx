"use client";

import { useActionState, useEffect, useRef, useState } from "react";

export type ActionResult = { ok: true } | { ok: false; error: string };

const idle: ActionResult = { ok: true };

export function FormToast({
  action,
  className,
  children,
  successMessage = "저장했습니다.",
  resetOnSuccess = false,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  className?: string;
  children: React.ReactNode;
  successMessage?: string;
  resetOnSuccess?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult, formData: FormData) => {
    return action(formData);
  }, idle);
  const [toast, setToast] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (state === idle) return;
    if (state.ok) {
      setToast({ ok: true, message: successMessage });
      if (resetOnSuccess) formRef.current?.reset();
    } else {
      setToast({ ok: false, message: state.error });
    }
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className={className}>
      {children}
      {toast && <span className={`admin-toast ${toast.ok ? "ok" : "error"}`}>{toast.message}</span>}
      {pending && <span className="admin-toast pending">저장 중...</span>}
    </form>
  );
}
