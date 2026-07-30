"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "문의 · 고객", icon: "☰" },
  { href: "/admin/calendar", label: "시공 일정", icon: "📅" },
  { href: "/admin/channels", label: "채널 분석", icon: "📊" },
  { href: "/admin/funnel", label: "전환 퍼널", icon: "🔻" },
  { href: "/admin/remarketing", label: "재구매 · 소개", icon: "🔁" },
  { href: "/admin/reviews", label: "후기 수집", icon: "⭐" },
  { href: "/admin/partners", label: "파트너 네트워크", icon: "🤝" },
  { href: "/admin/products", label: "제품 · 단가", icon: "🏷" },
  { href: "/admin/insights", label: "AI 제안", icon: "✨" },
] as const;

export function SidebarNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="admin-sidebar-nav">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={active ? "active" : ""}>
            <span className="admin-sidebar-icon" aria-hidden="true">{item.icon}</span>
            {item.label}
            {item.href === "/admin" && pendingCount > 0 && (
              <span className="admin-sidebar-badge">{pendingCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
