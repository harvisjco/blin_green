import { desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "../../db";
import { customers, inquiries, inquiryItems } from "../../db/schema";
import { createManualInquiry } from "./actions";
import { itemAmount, itemCost } from "./pricing";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  new: "신규",
  consulting: "상담중",
  quoted: "견적완료",
  scheduled: "시공예정",
  completed: "완료",
  cancelled: "취소",
};

export default async function AdminPage() {
  const db = getDb();
  const rows = await db
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

  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  const activeInquiryIds = rows
    .filter((row) => row.status === "scheduled" || row.status === "completed")
    .map((row) => row.id);

  const allItems = activeInquiryIds.length
    ? await db.select().from(inquiryItems).where(inArray(inquiryItems.inquiryId, activeInquiryIds))
    : [];

  const revenue = allItems.reduce((acc, item) => acc + itemAmount(item.widthCm, item.heightCm, item.quantity, item.unitPrice), 0);
  const cost = allItems.reduce((acc, item) => acc + itemCost(item.widthCm, item.heightCm, item.quantity, item.unitCost), 0);
  const margin = revenue - cost;

  return (
    <main className="admin">
      <header className="admin-header">
        <h1>블린그린 고객 관리</h1>
        <p>총 {rows.length}건 · {Object.entries(counts).map(([status, count]) => `${STATUS_LABEL[status] ?? status} ${count}`).join(" · ")}</p>
        <p><Link href="/admin/products">제품 · 단가 관리 →</Link></p>
      </header>

      <section className="admin-card admin-summary">
        <div><span>시공예정+완료 매출</span><strong>{revenue.toLocaleString()}원</strong></div>
        <div><span>원가</span><strong>{cost.toLocaleString()}원</strong></div>
        <div><span>예상 마진</span><strong>{margin.toLocaleString()}원 {revenue > 0 ? `(${Math.round((margin / revenue) * 100)}%)` : ""}</strong></div>
      </section>

      <section className="admin-card">
        <h2>새 문의 직접 등록</h2>
        <form action={createManualInquiry} className="admin-form-row">
          <input name="name" placeholder="성함" required />
          <input name="phone" placeholder="연락처" required />
          <input name="area" placeholder="지역" />
          <input name="interest" placeholder="관심 제품 / 메모" />
          <button type="submit">등록</button>
        </form>
      </section>

      <table className="admin-table">
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
              <td><Link href={`/admin/${row.id}`}>상세 →</Link></td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={10} className="admin-empty">등록된 문의가 없습니다.</td></tr>
          )}
        </tbody>
      </table>
    </main>
  );
}

function formatDate(value: string) {
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
