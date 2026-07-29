"use client";

export function QuickActions({ phone }: { phone: string }) {
  return (
    <div className="admin-quick-actions" onClick={(event) => event.stopPropagation()}>
      <a href={`tel:${phone}`}>☎ 전화</a>
      <a href={`sms:${phone}`}>✉ 문자</a>
    </div>
  );
}
