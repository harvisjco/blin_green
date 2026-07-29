import { desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "../../db";
import { customers, inquiries, inquiryItems } from "../../db/schema";
import { createManualInquiry } from "./actions";
import { NewInquiryForm } from "./NewInquiryForm";
import { itemAmount, itemCost } from "./pricing";
import { QuickActions } from "./QuickActions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  new: "신규",
  consulting: "상담중",
  quoted: "견적완료",
  scheduled: "시공예정",
  completed: "완료",
  cancelled: "취소",
};

const STATUS_ORDER = ["new", "consulting", "quoted", "scheduled", "completed", "cancelled"] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const statusFilter = params.status ?? "";

  const db = getDb();
  const allRows = await db
    .select({
      id: inquiries.id,
      status: inquiries.status,
      source: inquiries.source,
      interest: inquiries.interest,
      quoteAmount: inquiries.quoteAmount,
      scheduledAt: inquiries.scheduledAt,
      createdAt: inquiries.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerArea: customers.area,
    })
    .from(inquiries)
    .innerJoin(customers, eq(inquiries.customerId, customers.id))
    .orderBy(desc(inquiries.createdAt));

  const counts = allRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  const needsAttention = allRows.filter((row) => row.status === "new" || row.status === "consulting").length;

  const normalizedQuery = query.replace(/[^0-9a-zA-Z가-힣]/g, "").toLowerCase();
  const rows = allRows.filter((row) => {
    if (statusFilter && row.status !== statusFilter) return false;
    if (!normalizedQuery) return true;
    const haystack = `${row.customerName}${row.customerPhone}${row.customerArea}`.replace(/[^0-9a-zA-Z가-힣]/g, "").toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const activeInquiryIds = allRows
    .filter((row) => row.status === "scheduled" || row.status === "completed")
    .map((row) => row.id);

  const allItems = activeInquiryIds.length
    ? await db.select().from(inquiryItems).where(inArray(inquiryItems.inquiryId, activeInquiryIds))
    : [];

  const revenue = allItems.reduce((acc, item) => acc + itemAmount(item.widthCm, item.heightCm, item.quantity, item.unitPrice), 0);
  const cost = allItems.reduce((acc, item) => acc + itemCost(item.widthCm, item.heightCm, item.quantity, item.unitCost), 0);
  const margin = revenue - cost;

  const referrerOptions = await db
    .select({ id: customers.id, name: customers.name, phone: customers.phone })
    .from(customers)
    .orderBy(desc(customers.createdAt))
    .limit(100);

  return (
    <main className="admin">
      <header className="admin-header">
        <h1>블린그린 고객 관리</h1>
        <p>총 {allRows.length}건 · {Object.entries(counts).map(([status, count]) => `${STATUS_LABEL[status] ?? status} ${count}`).join(" · ")}</p>
      </header>

      {needsAttention > 0 && (
        <section className="admin-card admin-alert">
          <span>처리 필요</span>
          <strong>신규+상담중 {needsAttention}건이 대기 중입니다.</strong>
          <Link href="/admin?status=new">신규 문의 보기 →</Link>
        </section>
      )}

      <section className="admin-card admin-summary">
        <div><span>시공예정+완료 매출</span><strong>{revenue.toLocaleString()}원</strong></div>
        <div><span>원가</span><strong>{cost.toLocaleString()}원</strong></div>
        <div><span>예상 마진</span><strong>{margin.toLocaleString()}원 {revenue > 0 ? `(${Math.round((margin / revenue) * 100)}%)` : ""}</strong></div>
      </section>

      <section className="admin-card">
        <h2>새 문의 직접 등록</h2>
        <NewInquiryForm action={createManualInquiry} referrerOptions={referrerOptions} />
      </section>

      <section className="admin-card">
        <form className="admin-filter-bar" method="get">
          <input type="search" name="q" defaultValue={query} placeholder="이름·전화번호·지역 검색" />
          <select name="status" defaultValue={statusFilter}>
            <option value="">전체 상태</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]} ({counts[s] ?? 0})</option>
            ))}
          </select>
          <button type="submit">검색</button>
          {(query || statusFilter) && <Link href="/admin" className="admin-filter-clear">필터 초기화</Link>}
          <a
            className="admin-filter-clear"
            href={`/admin/export${statusFilter ? `?status=${statusFilter}` : ""}`}
          >
            CSV 내보내기 ↓
          </a>
        </form>
      </section>

      <table className="admin-table admin-table-desktop">
        <thead>
          <tr>
            <th>접수일</th>
            <th>고객</th>
            <th>연락처</th>
            <th>지역</th>
            <th>관심/내용</th>
            <th>경로</th>
            <th>상태</th>
            <th>견적</th>
            <th>시공일</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{formatDate(row.createdAt)}</td>
              <td>{row.customerName}</td>
              <td>{row.customerPhone}</td>
              <td>{row.customerArea || "-"}</td>
              <td className="admin-truncate">{row.interest || "-"}</td>
              <td>{row.source === "website" ? "웹 신청" : "직접 등록"}</td>
              <td><span className={`admin-badge status-${row.status}`}>{STATUS_LABEL[row.status] ?? row.status}</span></td>
              <td>{row.quoteAmount ? `${row.quoteAmount.toLocaleString()}원` : "-"}</td>
              <td>{row.scheduledAt ? formatDate(row.scheduledAt) : "-"}</td>
              <td>
                <div className="admin-quick-actions">
                  <a href={`tel:${row.customerPhone}`} title="전화">☎</a>
                  <a href={`sms:${row.customerPhone}`} title="문자">✉</a>
                  <Link href={`/admin/${row.id}`}>상세 →</Link>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={10} className="admin-empty">{query || statusFilter ? "조건에 맞는 문의가 없습니다." : "등록된 문의가 없습니다."}</td></tr>
          )}
        </tbody>
      </table>

      <div className="admin-card-list">
        {rows.map((row) => (
          <Link key={row.id} href={`/admin/${row.id}`} className="admin-mobile-card">
            <div className="admin-mobile-card-top">
              <strong>{row.customerName}</strong>
              <span className={`admin-badge status-${row.status}`}>{STATUS_LABEL[row.status] ?? row.status}</span>
            </div>
            <p className="admin-mobile-card-meta">{row.customerPhone} · {row.customerArea || "지역 미입력"}</p>
            <p className="admin-mobile-card-meta admin-truncate">{row.interest || "-"}</p>
            <div className="admin-mobile-card-bottom">
              <span>{formatDate(row.createdAt)}</span>
              {row.quoteAmount && <span>{row.quoteAmount.toLocaleString()}원</span>}
              {row.scheduledAt && <span>시공 {formatDate(row.scheduledAt)}</span>}
            </div>
            <QuickActions phone={row.customerPhone} />
          </Link>
        ))}
        {rows.length === 0 && (
          <p className="admin-empty">{query || statusFilter ? "조건에 맞는 문의가 없습니다." : "등록된 문의가 없습니다."}</p>
        )}
      </div>
    </main>
  );
}

function formatDate(value: string) {
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
