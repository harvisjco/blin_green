import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "../../../db";
import { customers, inquiries, partnerReferrals, partners } from "../../../db/schema";
import { ActionForm } from "../ActionForm";
import { createPartner, togglePartnerActive, updatePartner, updateReferralOutcome } from "../actions";
import { FormToast } from "../FormToast";

export const dynamic = "force-dynamic";

const FEE_STATUS_LABEL: Record<string, string> = {
  pending: "정산 대기",
  invoiced: "청구함",
  paid: "정산 완료",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default async function AdminPartnersPage() {
  const db = getDb();

  const partnerRows = await db.select().from(partners).orderBy(desc(partners.createdAt));

  const referralRows = await db
    .select({
      id: partnerReferrals.id,
      inquiryId: partnerReferrals.inquiryId,
      partnerId: partnerReferrals.partnerId,
      referredAt: partnerReferrals.referredAt,
      jobAmount: partnerReferrals.jobAmount,
      feeAmount: partnerReferrals.feeAmount,
      feeStatus: partnerReferrals.feeStatus,
      memo: partnerReferrals.memo,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(partnerReferrals)
    .innerJoin(inquiries, eq(partnerReferrals.inquiryId, inquiries.id))
    .innerJoin(customers, eq(inquiries.customerId, customers.id))
    .orderBy(desc(partnerReferrals.referredAt));

  const partnerById = new Map(partnerRows.map((p) => [p.id, p]));

  const totalFeePending = referralRows
    .filter((r) => r.feeStatus !== "paid")
    .reduce((acc, r) => acc + (r.feeAmount ?? 0), 0);
  const totalFeePaid = referralRows
    .filter((r) => r.feeStatus === "paid")
    .reduce((acc, r) => acc + (r.feeAmount ?? 0), 0);

  type PartnerStat = {
    partnerId: number;
    name: string;
    category: string;
    referralCount: number;
    closedCount: number; // referrals with a confirmed job amount
    totalJobAmount: number;
    totalFee: number;
    paidFee: number;
  };

  const statsByPartner = new Map<number, PartnerStat>();
  for (const partner of partnerRows) {
    statsByPartner.set(partner.id, {
      partnerId: partner.id,
      name: partner.name,
      category: partner.category,
      referralCount: 0,
      closedCount: 0,
      totalJobAmount: 0,
      totalFee: 0,
      paidFee: 0,
    });
  }
  for (const r of referralRows) {
    const stat = statsByPartner.get(r.partnerId);
    if (!stat) continue; // partner was deleted; skip from summary
    stat.referralCount += 1;
    if (r.jobAmount !== null) {
      stat.closedCount += 1;
      stat.totalJobAmount += r.jobAmount;
    }
    if (r.feeAmount !== null) {
      stat.totalFee += r.feeAmount;
      if (r.feeStatus === "paid") stat.paidFee += r.feeAmount;
    }
  }
  const partnerStats = [...statsByPartner.values()]
    .filter((s) => s.referralCount > 0)
    .sort((a, b) => b.referralCount - a.referralCount);

  return (
    <main className="admin">
      <header className="admin-header">
        <h1>파트너 네트워크</h1>
        <p>
          직접 시공이 어려운 지역·시기·전문분야의 문의를 신뢰하는 시공업체에 소개하고 소개료를 관리합니다.
          문의 상세 페이지에서 파트너에게 배정할 수 있습니다.
        </p>
      </header>

      <section className="admin-card admin-summary">
        <div><span>등록 파트너</span><strong>{partnerRows.filter((p) => p.active).length}곳</strong></div>
        <div><span>정산 대기 소개료</span><strong>{totalFeePending.toLocaleString()}원</strong></div>
        <div><span>정산 완료 소개료</span><strong>{totalFeePaid.toLocaleString()}원</strong></div>
      </section>

      <details className="admin-card admin-collapsible">
        <summary>새 파트너 등록</summary>
        <FormToast action={createPartner} className="admin-form-row" successMessage="파트너를 등록했습니다." resetOnSuccess>
          <input name="name" placeholder="업체명" required />
          <select name="category" defaultValue="커튼·블라인드">
            <option value="커튼·블라인드">커튼·블라인드</option>
            <option value="마루·바닥재">마루·바닥재</option>
            <option value="도배·페인트">도배·페인트</option>
            <option value="조명·전기">조명·전기</option>
            <option value="기타">기타</option>
          </select>
          <input name="phone" placeholder="연락처" />
          <input name="areas" placeholder="서비스 지역 (예: 서울, 경기 남부)" style={{ width: 200 }} />
          <select name="feeType" defaultValue="percent">
            <option value="percent">시공금액의 %</option>
            <option value="flat">건당 고정액</option>
          </select>
          <input name="feeValue" placeholder="수수료 값 (%, 또는 원)" inputMode="numeric" style={{ width: 140 }} />
          <input name="memo" placeholder="메모" style={{ width: 200 }} />
          <button type="submit">등록</button>
        </FormToast>
        <p className="admin-meta">
          예: 시공금액의 10%를 소개료로 받기로 했다면 방식은 &quot;시공금액의 %&quot;, 값은 10. 건당 5만원 고정이라면 방식은 &quot;건당 고정액&quot;, 값은 50000.
        </p>
      </details>

      <section className="admin-card">
        <h2>파트너 목록</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>업체명</th>
              <th>분야</th>
              <th>지역</th>
              <th>연락처 · 수수료 조건</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {partnerRows.map((partner) => (
              <tr key={partner.id}>
                <td>{partner.name}</td>
                <td>{partner.category}</td>
                <td>{partner.areas || "-"}</td>
                <td>
                  <FormToast action={updatePartner} className="admin-form-row" successMessage="저장했습니다.">
                    <input type="hidden" name="partnerId" value={partner.id} />
                    <input name="phone" defaultValue={partner.phone} placeholder="연락처" style={{ width: 110 }} />
                    <select name="feeType" defaultValue={partner.feeType} style={{ width: 100 }}>
                      <option value="percent">금액의 %</option>
                      <option value="flat">건당 고정</option>
                    </select>
                    <input name="feeValue" defaultValue={partner.feeValue} inputMode="numeric" style={{ width: 80 }} />
                    <input name="areas" defaultValue={partner.areas} placeholder="지역" style={{ width: 120 }} />
                    <input name="memo" defaultValue={partner.memo} placeholder="메모" style={{ width: 120 }} />
                    <button type="submit">저장</button>
                  </FormToast>
                </td>
                <td><span className={`admin-badge ${partner.active ? "status-scheduled" : "status-cancelled"}`}>{partner.active ? "활성" : "중단"}</span></td>
                <td>
                  <ActionForm action={togglePartnerActive}>
                    <input type="hidden" name="partnerId" value={partner.id} />
                    <input type="hidden" name="nextActive" value={partner.active ? "0" : "1"} />
                    <button type="submit" className="admin-link-button">{partner.active ? "중단" : "재활성화"}</button>
                  </ActionForm>
                </td>
              </tr>
            ))}
            {partnerRows.length === 0 && (
              <tr><td colSpan={6} className="admin-empty">등록된 파트너가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2>파트너별 실적 요약</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>업체명</th>
              <th>분야</th>
              <th>배정 건수</th>
              <th>성사(시공금액 확인) 건수</th>
              <th>성사율</th>
              <th>누적 시공금액</th>
              <th>누적 소개료 (정산완료)</th>
            </tr>
          </thead>
          <tbody>
            {partnerStats.map((s) => {
              const closeRate = s.referralCount > 0 ? Math.round((s.closedCount / s.referralCount) * 100) : 0;
              return (
                <tr key={s.partnerId}>
                  <td>{s.name}</td>
                  <td>{s.category}</td>
                  <td>{s.referralCount}건</td>
                  <td>{s.closedCount}건</td>
                  <td>{closeRate}%</td>
                  <td>{s.totalJobAmount.toLocaleString()}원</td>
                  <td>{s.totalFee.toLocaleString()}원 ({s.paidFee.toLocaleString()}원)</td>
                </tr>
              );
            })}
            {partnerStats.length === 0 && (
              <tr><td colSpan={7} className="admin-empty">아직 배정 이력이 있는 파트너가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
        <p className="admin-meta" style={{ marginTop: 10 }}>
          &quot;성사&quot;는 아래 배정 현황에서 시공금액을 입력한 건을 기준으로 집계됩니다. 누적 소개료의 괄호 안은 그중 실제로 정산 완료된 금액입니다.
        </p>
      </section>

      <section className="admin-card">
        <h2>배정 및 소개료 현황</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>배정일</th>
              <th>고객</th>
              <th>파트너</th>
              <th>시공금액 · 소개료</th>
              <th>정산 상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {referralRows.map((r) => {
              const partner = partnerById.get(r.partnerId);
              return (
                <tr key={r.id}>
                  <td>{formatDate(r.referredAt)}</td>
                  <td><Link href={`/admin/${r.inquiryId}`}>{r.customerName}</Link><br /><span className="admin-meta">{r.customerPhone}</span></td>
                  <td>{partner?.name ?? "-"}</td>
                  <td>
                    {r.feeStatus === "paid" ? (
                      <p className="admin-detail-text">
                        시공금액 {(r.jobAmount ?? 0).toLocaleString()}원 · 소개료 {(r.feeAmount ?? 0).toLocaleString()}원<br />
                        <span className="admin-meta">정산 완료된 건은 금액을 다시 수정할 수 없습니다.</span>
                      </p>
                    ) : (
                      <>
                        <FormToast action={updateReferralOutcome} className="admin-form-row" successMessage="저장했습니다.">
                          <input type="hidden" name="referralId" value={r.id} />
                          <input name="jobAmount" defaultValue={r.jobAmount ?? ""} placeholder="시공금액(원)" inputMode="numeric" style={{ width: 110 }} />
                          <select name="feeStatus" defaultValue={r.feeStatus} style={{ width: 100 }}>
                            <option value="pending">정산 대기</option>
                            <option value="invoiced">청구함</option>
                            <option value="paid">정산 완료</option>
                          </select>
                          <input name="memo" defaultValue={r.memo} placeholder="메모" style={{ width: 120 }} />
                          <button type="submit">저장</button>
                        </FormToast>
                        {r.feeAmount !== null && <p className="admin-meta" style={{ marginTop: 6 }}>소개료 {r.feeAmount.toLocaleString()}원</p>}
                      </>
                    )}
                  </td>
                  <td><span className={`admin-badge ${r.feeStatus === "paid" ? "status-scheduled" : "status-new"}`}>{FEE_STATUS_LABEL[r.feeStatus] ?? r.feeStatus}</span></td>
                  <td></td>
                </tr>
              );
            })}
            {referralRows.length === 0 && (
              <tr><td colSpan={6} className="admin-empty">아직 파트너에게 배정된 문의가 없습니다. 문의 상세 페이지에서 배정할 수 있습니다.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
