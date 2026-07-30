import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { customers, inquiryReviews, inquiries } from "../../../db/schema";
import { markReviewRequested, saveReceivedReview, toggleReviewFeatured } from "../actions";
import { ActionForm } from "../ActionForm";
import { FormToast } from "../FormToast";
import { QuickActions } from "../QuickActions";
import { ReviewRequestButton } from "./ReviewRequestButton";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function reviewMessage(customerName: string) {
  return `안녕하세요 ${customerName}님, 블린그린입니다 :) 시공은 마음에 드셨을까요? 다른 분들께도 도움이 되도록 짧게라도 후기를 남겨주시면 정말 큰 힘이 됩니다. 사진과 함께 남겨주시면 더 좋아요! 감사합니다 🙏`;
}

export default async function AdminReviewsPage() {
  const db = getDb();

  const completed = await db
    .select({
      inquiryId: inquiries.id,
      completedAt: inquiries.completedAt,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(inquiries)
    .innerJoin(customers, eq(inquiries.customerId, customers.id))
    .where(eq(inquiries.status, "completed"))
    .orderBy(desc(inquiries.completedAt));

  const reviewRows = await db.select().from(inquiryReviews);
  const reviewByInquiry = new Map(reviewRows.map((r) => [r.inquiryId, r]));

  const rows = completed.map((job) => ({
    ...job,
    review: reviewByInquiry.get(job.inquiryId) ?? null,
  }));

  const notRequested = rows.filter((r) => !r.review?.requestedAt);
  const awaitingResponse = rows.filter((r) => r.review?.requestedAt && !r.review?.receivedAt);
  const received = rows.filter((r) => r.review?.receivedAt);

  return (
    <main className="admin">
      <header className="admin-header">
        <h1>후기 수집</h1>
        <p>
          시공 완료 문의를 자동으로 모아 후기 요청 상태를 관리합니다.
          요청 문구를 복사해 문자·카톡으로 보내고, 받은 후기는 아래에 기록해 두었다가 마음에 드는 것을 홈페이지에 반영하세요.
        </p>
      </header>

      <section className="admin-card admin-summary">
        <div><span>요청 전</span><strong>{notRequested.length}건</strong></div>
        <div><span>요청함 · 응답 대기</span><strong>{awaitingResponse.length}건</strong></div>
        <div><span>후기 수령</span><strong>{received.length}건</strong></div>
      </section>

      <section className="admin-card">
        <h2>후기 요청 대상 ({notRequested.length + awaitingResponse.length}건)</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>고객</th>
              <th>연락처</th>
              <th>시공 완료일</th>
              <th>상태</th>
              <th>요청 문구</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[...notRequested, ...awaitingResponse].map((row) => (
              <tr key={row.inquiryId}>
                <td>{row.customerName}</td>
                <td>{row.customerPhone}</td>
                <td>{formatDate(row.completedAt)}</td>
                <td>
                  {row.review?.requestedAt
                    ? <span className="admin-badge status-consulting">요청함 · {formatDate(row.review.requestedAt)}</span>
                    : <span className="admin-badge status-new">요청 전</span>}
                </td>
                <td>
                  <ReviewRequestButton message={reviewMessage(row.customerName)} />
                </td>
                <td className="admin-quick-actions">
                  <QuickActions phone={row.customerPhone} />
                  {!row.review?.requestedAt && (
                    <ActionForm action={markReviewRequested}>
                      <input type="hidden" name="inquiryId" value={row.inquiryId} />
                      <button type="submit" className="admin-link-button">요청 표시</button>
                    </ActionForm>
                  )}
                </td>
              </tr>
            ))}
            {notRequested.length + awaitingResponse.length === 0 && (
              <tr><td colSpan={6} className="admin-empty">요청할 대상이 없습니다. 시공 완료 문의가 쌓이면 여기 표시됩니다.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2>받은 후기 기록</h2>
        <div className="admin-review-list">
          {[...notRequested, ...awaitingResponse, ...received].map((row) => (
            <div key={row.inquiryId} className="admin-review-item">
              <div className="admin-review-item-head">
                <strong>{row.customerName}</strong>
                <span className="admin-meta">{formatDate(row.completedAt)} 시공</span>
                {row.review?.featured === 1 && <span className="admin-badge status-scheduled">홈페이지 노출중</span>}
              </div>
              <FormToast action={saveReceivedReview} className="admin-form-col" successMessage="후기를 저장했습니다.">
                <input type="hidden" name="inquiryId" value={row.inquiryId} />
                <textarea name="reviewText" rows={2} defaultValue={row.review?.reviewText ?? ""} placeholder="받은 후기 내용을 옮겨 적어주세요" />
                <input name="reviewUrl" defaultValue={row.review?.reviewUrl ?? ""} placeholder="후기 원문 링크(인스타/블로그 등, 선택)" />
                <button type="submit">후기 저장</button>
              </FormToast>
              {row.review?.receivedAt && (
                <ActionForm action={toggleReviewFeatured} className="admin-review-featured-toggle">
                  <input type="hidden" name="inquiryId" value={row.inquiryId} />
                  <input type="hidden" name="nextFeatured" value={row.review.featured ? "0" : "1"} />
                  <button type="submit" className="admin-link-button">
                    {row.review.featured ? "홈페이지 노출 해제" : "홈페이지 후기로 채택"}
                  </button>
                </ActionForm>
              )}
            </div>
          ))}
          {rows.length === 0 && <p className="admin-empty">아직 시공 완료 문의가 없습니다.</p>}
        </div>
      </section>
    </main>
  );
}
