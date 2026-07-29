import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { consultations, inquiries } from "../../../db/schema";
import { resolveChannel } from "../channel";

export const dynamic = "force-dynamic";

const WON_STATUSES = new Set(["scheduled", "completed"]);
const LOST_STATUSES = new Set(["cancelled"]);

export default async function AdminChannelsPage() {
  const db = getDb();

  const websiteRows = await db
    .select({
      inquiryId: inquiries.id,
      status: inquiries.status,
      quoteAmount: inquiries.quoteAmount,
      createdAt: inquiries.createdAt,
      utmSource: consultations.utmSource,
      utmMedium: consultations.utmMedium,
      utmCampaign: consultations.utmCampaign,
      referrer: consultations.referrer,
      landingPath: consultations.landingPath,
    })
    .from(inquiries)
    .innerJoin(consultations, eq(inquiries.consultationId, consultations.id))
    .where(eq(inquiries.source, "website"))
    .orderBy(desc(inquiries.createdAt));

  const manualCount = await db
    .select({ id: inquiries.id })
    .from(inquiries)
    .where(eq(inquiries.source, "manual"));

  type ChannelStat = {
    channel: string;
    total: number;
    won: number;
    lost: number;
    open: number;
    revenue: number;
    campaigns: Map<string, number>;
  };

  const byChannel = new Map<string, ChannelStat>();

  function bucket(channel: string): ChannelStat {
    let stat = byChannel.get(channel);
    if (!stat) {
      stat = { channel, total: 0, won: 0, lost: 0, open: 0, revenue: 0, campaigns: new Map() };
      byChannel.set(channel, stat);
    }
    return stat;
  }

  for (const row of websiteRows) {
    const channel = resolveChannel({
      source: "website",
      utmSource: row.utmSource,
      utmMedium: row.utmMedium,
      referrer: row.referrer,
    });
    const stat = bucket(channel);
    stat.total += 1;
    if (WON_STATUSES.has(row.status)) {
      stat.won += 1;
      stat.revenue += row.quoteAmount ?? 0;
    } else if (LOST_STATUSES.has(row.status)) {
      stat.lost += 1;
    } else {
      stat.open += 1;
    }
    if (row.utmCampaign) {
      stat.campaigns.set(row.utmCampaign, (stat.campaigns.get(row.utmCampaign) ?? 0) + 1);
    }
  }

  if (manualCount.length > 0) {
    const stat = bucket("직접 등록");
    stat.total += manualCount.length;
    stat.open += manualCount.length;
  }

  const channelStats = [...byChannel.values()].sort((a, b) => b.total - a.total);
  const totalInquiries = websiteRows.length + manualCount.length;
  const totalRevenue = channelStats.reduce((acc, s) => acc + s.revenue, 0);

  const untracked = websiteRows.filter((r) => resolveChannel({
    source: "website",
    utmSource: r.utmSource,
    utmMedium: r.utmMedium,
    referrer: r.referrer,
  }) === "직접 방문/URL 입력").length;

  return (
    <main className="admin">
      <header className="admin-header">
        <h1>유입 채널 분석</h1>
        <p>
          웹 상담폼으로 들어온 문의를 첫 방문 시점의 UTM 파라미터 또는 리퍼러 기준으로 채널별로 집계합니다.
          링크에 <code>?utm_source=instagram&amp;utm_medium=social&amp;utm_campaign=봄맞이프로모션</code> 같은 파라미터를 붙여 공유하면 캠페인별 성과까지 확인할 수 있습니다.
        </p>
      </header>

      <section className="admin-card admin-summary">
        <div><span>전체 문의</span><strong>{totalInquiries}건</strong></div>
        <div><span>채널 추적된 웹 문의</span><strong>{websiteRows.length - untracked}건</strong></div>
        <div><span>계약(시공예정+완료) 매출 합계</span><strong>{totalRevenue.toLocaleString()}원</strong></div>
      </section>

      {untracked > 0 && (
        <section className="admin-card admin-alert">
          <span>참고</span>
          <strong>UTM/리퍼러 정보가 없는 웹 문의 {untracked}건은 &quot;직접 방문/URL 입력&quot;으로 집계됩니다.</strong>
          <span>SNS·블로그 게시물 링크에 UTM 파라미터를 붙이면 다음 문의부터 채널이 잡힙니다.</span>
        </section>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>채널</th>
            <th>총 문의</th>
            <th>진행중</th>
            <th>계약</th>
            <th>이탈</th>
            <th>계약전환율</th>
            <th>매출</th>
            <th>주요 캠페인</th>
          </tr>
        </thead>
        <tbody>
          {channelStats.map((stat) => (
            <tr key={stat.channel}>
              <td><strong>{stat.channel}</strong></td>
              <td>{stat.total}건</td>
              <td>{stat.open}건</td>
              <td>{stat.won}건</td>
              <td>{stat.lost}건</td>
              <td>{stat.total > 0 ? `${Math.round((stat.won / stat.total) * 100)}%` : "-"}</td>
              <td>{stat.revenue.toLocaleString()}원</td>
              <td className="admin-truncate">
                {stat.campaigns.size > 0
                  ? [...stat.campaigns.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => `${name}(${count})`).join(", ")
                  : "-"}
              </td>
            </tr>
          ))}
          {channelStats.length === 0 && (
            <tr><td colSpan={8} className="admin-empty">아직 집계할 문의가 없습니다.</td></tr>
          )}
        </tbody>
      </table>

      <section className="admin-card">
        <h2>UTM 링크 예시</h2>
        <p className="admin-detail-text">
          아래처럼 채널별로 링크에 파라미터를 붙여 SNS 프로필, 블로그 게시물, 광고 소재에 사용하세요.
        </p>
        <ul className="admin-utm-examples">
          <li><b>인스타그램 프로필 링크</b><code>https://blingreen.harvis-jco.workers.dev/?utm_source=instagram&amp;utm_medium=social&amp;utm_campaign=프로필링크</code></li>
          <li><b>네이버 블로그 글</b><code>https://blingreen.harvis-jco.workers.dev/?utm_source=naver&amp;utm_medium=blog&amp;utm_campaign=시공후기</code></li>
          <li><b>인스타그램 광고 집행 시</b><code>https://blingreen.harvis-jco.workers.dev/?utm_source=instagram&amp;utm_medium=cpc&amp;utm_campaign=2026봄프로모션</code></li>
        </ul>
      </section>
    </main>
  );
}
