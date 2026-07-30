import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "../../../db";
import { customers, inquiries, inquiryItems, inquiryNotes, inquiryStatusEvents, products } from "../../../db/schema";
import {
  addInquiryItem,
  addInquiryNote,
  removeInquiryItem,
  updateCustomerMemo,
  updateInquiryQuote,
  updateInquirySchedule,
  updateInquiryStatusForm,
} from "../actions";
import { ActionForm } from "../ActionForm";
import { ConfirmDeleteButton } from "../ConfirmDeleteButton";
import { FormToast } from "../FormToast";
import { itemAmount, itemCost } from "../pricing";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "new", label: "신규" },
  { value: "consulting", label: "상담중" },
  { value: "quoted", label: "견적완료" },
  { value: "scheduled", label: "시공예정" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소" },
] as const;

const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]));

export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inquiryId = Number(id);
  if (!Number.isInteger(inquiryId)) notFound();

  const db = getDb();
  const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, inquiryId)).limit(1);
  if (!inquiry) notFound();

  const [customer] = await db.select().from(customers).where(eq(customers.id, inquiry.customerId)).limit(1);
  const notes = await db
    .select()
    .from(inquiryNotes)
    .where(eq(inquiryNotes.inquiryId, inquiryId))
    .orderBy(desc(inquiryNotes.createdAt));

  const otherInquiries = await db
    .select({ id: inquiries.id, status: inquiries.status, createdAt: inquiries.createdAt, interest: inquiries.interest })
    .from(inquiries)
    .where(eq(inquiries.customerId, inquiry.customerId))
    .orderBy(desc(inquiries.createdAt));
  const otherInquiriesExceptCurrent = otherInquiries.filter((r) => r.id !== inquiryId);

  const statusHistory = await db
    .select()
    .from(inquiryStatusEvents)
    .where(eq(inquiryStatusEvents.inquiryId, inquiryId))
    .orderBy(desc(inquiryStatusEvents.createdAt));

  const items = await db
    .select()
    .from(inquiryItems)
    .where(eq(inquiryItems.inquiryId, inquiryId))
    .orderBy(desc(inquiryItems.createdAt));

  const catalog = await db.select().from(products).where(eq(products.active, 1));

  const itemTotals = items.map((item) => ({
    ...item,
    amount: itemAmount(item.widthCm, item.heightCm, item.quantity, item.unitPrice),
    cost: itemCost(item.widthCm, item.heightCm, item.quantity, item.unitCost),
  }));
  const totalAmount = itemTotals.reduce((acc, item) => acc + item.amount, 0);
  const totalCost = itemTotals.reduce((acc, item) => acc + item.cost, 0);
  const totalMargin = totalAmount - totalCost;
  const marginRate = totalAmount > 0 ? Math.round((totalMargin / totalAmount) * 100) : 0;

  return (
    <main className="admin">
      <Link href="/admin" className="admin-back">← 목록으로</Link>

      <header className="admin-header">
        <h1>{customer?.name} 고객 상담 기록</h1>
        <p>
          {customer?.phone} · {customer?.area || "지역 미입력"}
          {customer?.phone && (
            <>
              {" · "}
              <a href={`tel:${customer.phone}`}>☎ 전화</a>
              {" "}
              <a href={`sms:${customer.phone}`}>✉ 문자</a>
            </>
          )}
        </p>
        {otherInquiriesExceptCurrent.length > 0 && (
          <div className="admin-other-inquiries">
            <span className="admin-meta">이 고객의 다른 문의 {otherInquiriesExceptCurrent.length}건</span>
            <div className="admin-other-inquiries-list">
              {otherInquiriesExceptCurrent.map((other) => (
                <Link key={other.id} href={`/admin/${other.id}`} className="admin-other-inquiry-chip">
                  <span className={`admin-badge status-${other.status}`}>{STATUS_LABEL[other.status] ?? other.status}</span>
                  <span>{formatDate(other.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="admin-grid">
        <section className="admin-card">
          <h2>상태</h2>
          <FormToast action={updateInquiryStatusForm} className="admin-form-row" successMessage="상태를 변경했습니다.">
            <input type="hidden" name="inquiryId" value={inquiryId} />
            <select name="status" defaultValue={inquiry.status}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button type="submit">상태 변경</button>
          </FormToast>
          <p className="admin-meta">
            최초 접수 {formatDate(inquiry.createdAt)} · 최근 수정 {formatDate(inquiry.updatedAt)}
            {inquiry.completedAt && <> · 시공 완료 {formatDate(inquiry.completedAt)}</>}
          </p>
          <p className="admin-status-hint">
            💡 &quot;완료&quot;로 바꾸면 시공완료일이 자동 기록되어 <Link href="/admin/remarketing">재구매 리마케팅</Link>과 <Link href="/admin/reviews">후기 요청 대상</Link>에 자동으로 반영됩니다.
          </p>
          {statusHistory.length > 0 && (
            <ul className="admin-status-history">
              {statusHistory.map((event) => (
                <li key={event.id}>
                  <span className="admin-meta">{formatDate(event.createdAt)}</span>
                  <span>{event.fromStatus ? `${STATUS_LABEL[event.fromStatus] ?? event.fromStatus} → ` : "등록: "}{STATUS_LABEL[event.toStatus] ?? event.toStatus}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card">
          <h2>견적 메모</h2>
          <FormToast action={updateInquiryQuote} className="admin-form-col" successMessage="견적 메모를 저장했습니다.">
            <input type="hidden" name="inquiryId" value={inquiryId} />
            {items.length === 0 && (
              <label>수동 견적 금액(원)<input name="quoteAmount" defaultValue={inquiry.quoteAmount ?? ""} placeholder="품목을 등록하면 자동 계산됩니다" /></label>
            )}
            <label>견적 메모<textarea name="quoteNote" rows={3} defaultValue={inquiry.quoteNote} placeholder="구성, 원단, 슬랫 등" /></label>
            <button type="submit">메모 저장</button>
          </FormToast>
        </section>

        <section className="admin-card">
          <h2>시공 일정</h2>
          <FormToast action={updateInquirySchedule} className="admin-form-row" successMessage="시공 일정을 저장했습니다.">
            <input type="hidden" name="inquiryId" value={inquiryId} />
            <input type="datetime-local" name="scheduledAt" defaultValue={toLocalInput(inquiry.scheduledAt)} />
            <button type="submit">일정 저장</button>
          </FormToast>
        </section>

        <section className="admin-card">
          <h2>고객 메모</h2>
          <FormToast action={updateCustomerMemo} className="admin-form-col" successMessage="고객 메모를 저장했습니다.">
            <input type="hidden" name="customerId" value={customer?.id} />
            <textarea name="memo" rows={3} defaultValue={customer?.memo} placeholder="이 고객에 대한 공통 메모(재방문 여부, 선호 등)" />
            <button type="submit">메모 저장</button>
          </FormToast>
        </section>
      </div>

      <section className="admin-card">
        <h2>원 문의 내용</h2>
        <p className="admin-detail-text"><b>관심 제품/내용</b> {inquiry.interest || "-"}</p>
      </section>

      <section className="admin-card">
        <h2>견적 품목 · 수익 계산</h2>
        <p className="admin-meta">
          ① 아래 목록에서 제품을 고르면 단가가 자동 적용됩니다. ② 목록에 없는 제품이면 &quot;직접 입력 (단가 없음)&quot;을 고르고 제품명만 적어주세요 — 이 경우 금액은 0원으로 기록되니, 나중에 <Link href="/admin/products">제품 관리</Link>에서 정식으로 등록한 뒤 다시 추가해 주세요.
        </p>
        <FormToast action={addInquiryItem} className="admin-form-row" successMessage="품목을 추가했습니다.">
          <input type="hidden" name="inquiryId" value={inquiryId} />
          <select name="productId">
            <option value="">직접 입력 (단가 없음)</option>
            {catalog.map((product) => (
              <option key={product.id} value={product.id}>{product.name} ({product.priceCents.toLocaleString()}원/m²)</option>
            ))}
          </select>
          <input name="productName" placeholder="제품명 (직접 입력 선택 시에만 사용)" style={{ width: 180 }} />
          <input name="widthCm" placeholder="폭(cm)" inputMode="numeric" required style={{ width: 80 }} />
          <input name="heightCm" placeholder="높이(cm)" inputMode="numeric" required style={{ width: 80 }} />
          <input name="quantity" placeholder="수량" inputMode="numeric" defaultValue={1} style={{ width: 60 }} />
          <button type="submit">품목 추가</button>
        </FormToast>

        <table className="admin-table" style={{ marginTop: 14 }}>
          <thead>
            <tr>
              <th>제품</th>
              <th>규격</th>
              <th>수량</th>
              <th>면적(m²)</th>
              <th>판매금액</th>
              <th>원가</th>
              <th>마진</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {itemTotals.map((item) => {
              const areaM2 = (item.widthCm / 100) * (item.heightCm / 100);
              return (
                <tr key={item.id}>
                  <td>{item.productName}</td>
                  <td>{item.widthCm}×{item.heightCm}cm</td>
                  <td>{item.quantity}</td>
                  <td>{areaM2.toFixed(2)}</td>
                  <td>{item.amount.toLocaleString()}원</td>
                  <td>{item.cost.toLocaleString()}원</td>
                  <td>{(item.amount - item.cost).toLocaleString()}원</td>
                  <td>
                    <ActionForm action={removeInquiryItem}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="inquiryId" value={inquiryId} />
                      <ConfirmDeleteButton message={`"${item.productName}" 품목을 삭제하시겠습니까?`} />
                    </ActionForm>
                  </td>
                </tr>
              );
            })}
            {itemTotals.length === 0 && (
              <tr><td colSpan={8} className="admin-empty">등록된 품목이 없습니다.</td></tr>
            )}
          </tbody>
          {itemTotals.length > 0 && (
            <tfoot>
              <tr className="admin-total-row">
                <td colSpan={4}>합계</td>
                <td>{totalAmount.toLocaleString()}원</td>
                <td>{totalCost.toLocaleString()}원</td>
                <td>{totalMargin.toLocaleString()}원 ({marginRate}%)</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </section>

      <section className="admin-card">
        <h2>면담 일지</h2>
        <FormToast action={addInquiryNote} className="admin-form-col" successMessage="면담 일지를 추가했습니다.">
          <input type="hidden" name="inquiryId" value={inquiryId} />
          <div className="admin-form-row">
            <input name="author" placeholder="작성자" />
          </div>
          <textarea name="content" rows={3} placeholder="상담/방문/통화 내용을 기록하세요" required />
          <button type="submit">일지 추가</button>
        </FormToast>
        <ul className="admin-notes">
          {notes.map((note) => (
            <li key={note.id}>
              <div className="admin-note-meta"><b>{note.author || "담당자"}</b><span>{formatDate(note.createdAt)}</span></div>
              <p>{note.content}</p>
            </li>
          ))}
          {notes.length === 0 && <li className="admin-empty">아직 작성된 면담 일지가 없습니다.</li>}
        </ul>
      </section>
    </main>
  );
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
