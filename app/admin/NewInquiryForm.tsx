"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ActionResult } from "./actions";

const idle: ActionResult = { ok: true };

export function NewInquiryForm({
  action,
  referrerOptions,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  referrerOptions?: { id: number; name: string; phone: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult, formData: FormData) => {
    return action(formData);
  }, idle);
  const [toast, setToast] = useState<{ ok: boolean; message: string } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (state === idle) return;
    if (state.ok) {
      setToast({ ok: true, message: "문의를 등록했습니다." });
      setDuplicateWarning(null);
      formRef.current?.reset();
    } else if (state.error.startsWith("DUPLICATE:")) {
      setDuplicateWarning(state.error.slice("DUPLICATE:".length));
    } else {
      setToast({ ok: false, message: state.error });
    }
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="admin-form-row" onSubmit={() => setDuplicateWarning(null)}>
      <input name="name" placeholder="성함" required />
      <input name="phone" placeholder="연락처" required />
      <input name="area" placeholder="지역" />
      <input name="interest" placeholder="관심 제품 / 메모" />
      {referrerOptions && referrerOptions.length > 0 && (
        <select name="referredByCustomerId" defaultValue="">
          <option value="">소개자 없음</option>
          {referrerOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.phone.slice(-4)})</option>
          ))}
        </select>
      )}
      <input type="hidden" name="confirmDuplicate" value={duplicateWarning ? "1" : "0"} />
      <button type="submit">{duplicateWarning ? "그래도 등록" : "등록"}</button>
      {toast && <span className={`admin-toast ${toast.ok ? "ok" : "error"}`}>{toast.message}</span>}
      {pending && <span className="admin-toast pending">저장 중...</span>}
      {duplicateWarning && <p className="admin-duplicate-warning">⚠ {duplicateWarning}</p>}
    </form>
  );
}
