import { desc, eq, inArray, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "../../../db";
import { customers, inquiries } from "../../../db/schema";
import { QuickActions } from "../QuickActions";

export const dynamic = "force-dynamic";

const REMARKETING_MONTHS = 11;

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function monthsSince(value: string) {
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  const months = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  return Math.floor(months);
}

export default async function AdminRemarketingPage() {
  const db = getDb();

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - REMARKETING_MONTHS);

  const completedJobs = await db
    .select({
      inquiryId: inquiries.id,
      completedAt: inquiries.completedAt,
      customerId: customers.id,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerArea: customers.area,
    })
    .from(inquiries)
    .innerJoin(customers, eq(inquiries.customerId, customers.id))
    .where(isNotNull(inquiries.completedAt))
    .orderBy(desc(inquiries.completedAt));

  // De-dupe to each customer's most recent completed job.
  const latestByCustomer = new Map<number, (typeof completedJobs)[number]>();
  for (const job of completedJobs) {
    if (!latestByCustomer.has(job.customerId)) latestByCustomer.set(job.customerId, job);
  }

  const remarketingTargets = [...latestByCustomer.values()]
    .filter((job) => job.completedAt && new Date(job.completedAt) <= cutoff)
    .sort((a, b) => (a.completedAt! < b.completedAt! ? -1 : 1));

  const allCustomers = await db.select().from(customers);
  const referrerIds = allCustomers
    .map((c) => c.referredByCustomerId)
    .filter((id): id is number => id !== null);

  const referralCounts = new Map<number, number>();
  for (const id of referrerIds) {
    referralCounts.set(id, (referralCounts.get(id) ?? 0) + 1);
  }

  const topReferrers = referralCounts.size
    ? await db
        .select()
        .from(customers)
        .where(inArray(customers.id, [...referralCounts.keys()]))
    : [];

  const topReferrersSorted = topReferrers
    .map((c) => ({ ...c, referralCount: referralCounts.get(c.id) ?? 0 }))
    .sort((a, b) => b.referralCount - a.referralCount);

  return (
    <main className="admin">
      <header className="admin-header">
        <h1>재구매 · 소개 리마케팅</h1>
        <p>
          시공 완료 후 {REMARKETING_MONTHS}개월이 지난 고객(이사·계절 교체 재문의 가능 시점)과, 지인 소개를 해준 우수 고객을 보여줍니다.
          완료 상태로 전환하면 자동으로 이 목록에 포함됩니다.
        </p>
      </header>

      <section className="admin-card admin-summary">
        <div><span>리마케팅 대상</span><strong>{remarketingTargets.length}명</strong></div>
        <div><span>소개 실적 있는 고객</span><strong>{topReferrersSorted.length}명</strong></div>
        <div><span>총 소개 건수</span><strong>{referrerIds.length}건</strong></div>
      </section>

      <section className="admin-card">
        <h2>재구매 리마케팅 대상 ({REMARKETING_MONTHS}개월 이상 경과)</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>고객</th>
              <th>연락처</th>
              <th>지역</th>
              <th>시공 완료일</th>
              <th>경과</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {remarketingTargets.map((job) => (
              <tr key={job.customerId}>
                <td><Link href={`/admin/${job.inquiryId}`}>{job.customerName}</Link></td>
                <td>{job.customerPhone}</td>
                <td>{job.customerArea || "-"}</td>
                <td>{formatDate(job.completedAt)}</td>
                <td>{monthsSince(job.completedAt!)}개월 전</td>
                <td><QuickActions phone={job.customerPhone} /></td>
              </tr>
            ))}
            {remarketingTargets.length === 0 && (
              <tr><td colSpan={6} className="admin-empty">아직 {REMARKETING_MONTHS}개월 이상 경과한 완료 건이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2>우수 소개 고객</h2>
        <p className="admin-meta">문의 직접 등록 시 &quot;소개자&quot;를 함께 남기면 이 목록에 자동으로 반영됩니다.</p>
        <table className="admin-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>고객</th>
              <th>연락처</th>
              <th>소개 건수</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {topReferrersSorted.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.referralCount}건</td>
                <td><QuickActions phone={c.phone} /></td>
              </tr>
            ))}
            {topReferrersSorted.length === 0 && (
              <tr><td colSpan={4} className="admin-empty">아직 등록된 소개 실적이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
