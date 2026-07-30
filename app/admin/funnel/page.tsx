import { and, asc, gte, lt } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "../../../db";
import { inquiries, inquiryStatusEvents } from "../../../db/schema";

export const dynamic = "force-dynamic";

const FUNNEL_STAGES = [
  { status: "new", label: "신규 문의" },
  { status: "consulting", label: "상담중" },
  { status: "quoted", label: "견적완료" },
  { status: "scheduled", label: "시공예정" },
  { status: "completed", label: "완료" },
] as const;

function formatDays(days: number | null) {
  if (days === null) return "-";
  if (days < 1) return "1일 미만";
  return `평균 ${days.toFixed(1)}일`;
}

export default async function AdminFunnelPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = params.range ?? "all";

  const now = new Date();
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;
  let rangeLabel = "전체 기간";

  if (range === "this-month") {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    rangeLabel = "이번 달";
  } else if (range === "last-month") {
    rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    rangeEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    rangeLabel = "지난 달";
  }

  const db = getDb();

  const inquiryRows = rangeStart && rangeEnd
    ? await db
        .select({ id: inquiries.id, createdAt: inquiries.createdAt, status: inquiries.status })
        .from(inquiries)
        .where(and(gte(inquiries.createdAt, rangeStart.toISOString()), lt(inquiries.createdAt, rangeEnd.toISOString())))
    : await db.select({ id: inquiries.id, createdAt: inquiries.createdAt, status: inquiries.status }).from(inquiries);

  const inquiryIds = new Set(inquiryRows.map((r) => r.id));

  const events = await db
    .select()
    .from(inquiryStatusEvents)
    .orderBy(asc(inquiryStatusEvents.createdAt));

  const relevantEvents = events.filter((e) => inquiryIds.has(e.inquiryId));

  // First time each inquiry reached each stage.
  const firstReachedAt = new Map<number, Map<string, string>>();
  for (const event of relevantEvents) {
    let perInquiry = firstReachedAt.get(event.inquiryId);
    if (!perInquiry) {
      perInquiry = new Map();
      firstReachedAt.set(event.inquiryId, perInquiry);
    }
    if (!perInquiry.has(event.toStatus)) {
      perInquiry.set(event.toStatus, event.createdAt);
    }
  }

  const stageCounts = FUNNEL_STAGES.map((stage) => {
    let count = 0;
    for (const perInquiry of firstReachedAt.values()) {
      if (perInquiry.has(stage.status)) count += 1;
    }
    return { ...stage, count };
  });

  const cancelledCount = inquiryRows.filter((r) => r.status === "cancelled").length;

  // Average days between consecutive stage transitions, per inquiry that reached both.
  const stageDurations = FUNNEL_STAGES.slice(1).map((stage, i) => {
    const prevStatus = FUNNEL_STAGES[i].status;
    const diffs: number[] = [];
    for (const perInquiry of firstReachedAt.values()) {
      const prevAt = perInquiry.get(prevStatus);
      const curAt = perInquiry.get(stage.status);
      if (prevAt && curAt) {
        const prevDate = new Date(prevAt.includes("T") ? prevAt : prevAt.replace(" ", "T") + "Z");
        const curDate = new Date(curAt.includes("T") ? curAt : curAt.replace(" ", "T") + "Z");
        const days = (curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        if (days >= 0) diffs.push(days);
      }
    }
    const avg = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : null;
    return { from: FUNNEL_STAGES[i].label, to: stage.label, avgDays: avg, sampleSize: diffs.length };
  });

  const totalInquiries = inquiryRows.length;
  const completedCount = stageCounts[stageCounts.length - 1]?.count ?? 0;
  const overallConversion = totalInquiries > 0 ? Math.round((completedCount / totalInquiries) * 100) : 0;

  return (
    <main className="admin">
      <header className="admin-header">
        <h1>전환 퍼널</h1>
        <p>
          신규 문의가 계약(시공완료)까지 가는 과정에서 각 단계 도달 건수와 평균 소요일수를 보여줍니다.
          이미 기록 중인 상태변경 이력을 그대로 집계한 것입니다.
        </p>
      </header>

      <section className="admin-card">
        <div className="admin-filter-bar">
          <Link href="/admin/funnel?range=all" className={range === "all" ? "admin-range-active" : ""}>전체 기간</Link>
          <Link href="/admin/funnel?range=this-month" className={range === "this-month" ? "admin-range-active" : ""}>이번 달</Link>
          <Link href="/admin/funnel?range=last-month" className={range === "last-month" ? "admin-range-active" : ""}>지난 달</Link>
        </div>
      </section>

      <section className="admin-card admin-summary">
        <div><span>{rangeLabel} 신규 문의</span><strong>{totalInquiries}건</strong></div>
        <div><span>계약(완료) 전환율</span><strong>{overallConversion}%</strong></div>
        <div><span>취소</span><strong>{cancelledCount}건</strong></div>
      </section>

      <section className="admin-card">
        <h2>단계별 도달 현황</h2>
        <div className="admin-funnel-bars">
          {stageCounts.map((stage, i) => {
            const pct = totalInquiries > 0 ? Math.round((stage.count / totalInquiries) * 100) : 0;
            const prevCount = i > 0 ? stageCounts[i - 1].count : totalInquiries;
            const stepConversion = prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 0;
            return (
              <div className="admin-funnel-row" key={stage.status}>
                <div className="admin-funnel-label">
                  <span>{stage.label}</span>
                  <span className="admin-meta">{stage.count}건 · 전체 대비 {pct}%{i > 0 ? ` · 이전 단계 대비 ${stepConversion}%` : ""}</span>
                </div>
                <div className="admin-funnel-track">
                  <div className="admin-funnel-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="admin-card">
        <h2>단계 간 평균 소요일수</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>구간</th>
              <th>평균 소요</th>
              <th>표본 수</th>
            </tr>
          </thead>
          <tbody>
            {stageDurations.map((d) => (
              <tr key={`${d.from}-${d.to}`}>
                <td>{d.from} → {d.to}</td>
                <td>{formatDays(d.avgDays)}</td>
                <td>{d.sampleSize}건</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="admin-meta" style={{ marginTop: 10 }}>
          표본 수가 적으면(월 몇 건 수준) 평균이 크게 출렁일 수 있으니 참고용으로만 보세요.
        </p>
      </section>
    </main>
  );
}
