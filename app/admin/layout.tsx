import { or, eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "../../db";
import { inquiries } from "../../db/schema";
import { SidebarNav } from "./SidebarNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const db = getDb();
  const pending = await db
    .select({ id: inquiries.id })
    .from(inquiries)
    .where(or(eq(inquiries.status, "new"), eq(inquiries.status, "consulting")));

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">블린그린 관리자</div>
        <SidebarNav pendingCount={pending.length} />
        <div className="admin-sidebar-footer">
          <Link href="/">← 사이트로 돌아가기</Link>
        </div>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
