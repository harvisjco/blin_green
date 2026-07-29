import Link from "next/link";
import { SidebarNav } from "./SidebarNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">블린그린 관리자</div>
        <SidebarNav />
        <div className="admin-sidebar-footer">
          <Link href="/">← 사이트로 돌아가기</Link>
        </div>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
