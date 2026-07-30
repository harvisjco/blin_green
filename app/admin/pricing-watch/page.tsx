import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { competitorPrices, products } from "../../../db/schema";
import { ActionForm } from "../ActionForm";
import { addCompetitorPrice, removeCompetitorPrice } from "../actions";
import { ConfirmDeleteButton } from "../ConfirmDeleteButton";
import { FormToast } from "../FormToast";
import { buildSearchLinks } from "./searchLinks";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default async function AdminPricingWatchPage() {
  const db = getDb();

  const productRows = await db.select().from(products).where(eq(products.active, 1)).orderBy(desc(products.createdAt));
  const priceRows = await db.select().from(competitorPrices).orderBy(desc(competitorPrices.observedAt));

  const pricesByProduct = new Map<number, typeof priceRows>();
  for (const row of priceRows) {
    const list = pricesByProduct.get(row.productId) ?? [];
    list.push(row);
    pricesByProduct.set(row.productId, list);
  }

  return (
    <main className="admin">
      <header className="admin-header">
        <h1>가격 비교 관찰</h1>
        <p>
          제품명으로 주요 쇼핑몰 검색 링크를 열어 직접 확인한 뒤, 발견한 가격을 기록하면 우리 단가와 비교해 보여줍니다.
          자동 수집은 하지 않으며, 모든 기록은 관리자가 직접 입력합니다.
        </p>
      </header>

      {productRows.map((product) => {
        const prices = pricesByProduct.get(product.id) ?? [];
        const links = buildSearchLinks(product.name);
        const lowest = prices.length ? Math.min(...prices.map((p) => p.priceWon)) : null;
        const avg = prices.length ? Math.round(prices.reduce((a, p) => a + p.priceWon, 0) / prices.length) : null;
        const diffFromLowest = lowest !== null ? product.priceCents - lowest : null;

        return (
          <section className="admin-card" key={product.id}>
            <h2>{product.name} <span className="admin-meta">({product.family} · 우리 단가 {product.priceCents.toLocaleString()}원/m²)</span></h2>

            <div className="admin-pricewatch-links">
              {links.map((link) => (
                <a key={link.label} href={link.url} target="_blank" rel="noreferrer" className="admin-pricewatch-link">
                  {link.label} 검색 ↗
                </a>
              ))}
            </div>

            {prices.length > 0 && (
              <div className="admin-summary" style={{ marginTop: 14 }}>
                <div><span>관찰 최저가</span><strong>{lowest!.toLocaleString()}원</strong></div>
                <div><span>관찰 평균가</span><strong>{avg!.toLocaleString()}원</strong></div>
                <div>
                  <span>우리 단가와 차이</span>
                  <strong className={diffFromLowest !== null && diffFromLowest > 0 ? "admin-pricewatch-higher" : "admin-pricewatch-lower"}>
                    {diffFromLowest !== null && diffFromLowest > 0 ? "+" : ""}{diffFromLowest?.toLocaleString()}원
                    {diffFromLowest !== null && (diffFromLowest > 0 ? " (더 비쌈)" : diffFromLowest < 0 ? " (더 저렴)" : " (동일)")}
                  </strong>
                </div>
              </div>
            )}

            <details className="admin-collapsible" style={{ marginTop: 14 }}>
              <summary>가격 기록 추가</summary>
              <FormToast action={addCompetitorPrice} className="admin-form-row" successMessage="가격을 기록했습니다." resetOnSuccess>
                <input type="hidden" name="productId" value={product.id} />
                <select name="siteName" required>
                  <option value="">사이트 선택</option>
                  <option value="네이버쇼핑">네이버쇼핑</option>
                  <option value="쿠팡">쿠팡</option>
                  <option value="지그재그">지그재그</option>
                  <option value="11번가">11번가</option>
                  <option value="기타">기타</option>
                </select>
                <input name="priceWon" placeholder="가격(원/m² 기준)" inputMode="numeric" required style={{ width: 140 }} />
                <input name="listingTitle" placeholder="상품명(선택)" style={{ width: 180 }} />
                <input name="listingUrl" placeholder="상품 링크(선택)" style={{ width: 200 }} />
                <input name="memo" placeholder="메모" style={{ width: 160 }} />
                <button type="submit">기록 추가</button>
              </FormToast>
              <p className="admin-meta">
                가격은 우리 단가와 같은 기준(m²당)으로 환산해 입력해 주세요. 상품이 세트/개당 판매라면 메모에 환산 방법을 남겨두세요.
              </p>
            </details>

            {prices.length > 0 && (
              <table className="admin-table" style={{ marginTop: 14 }}>
                <thead>
                  <tr>
                    <th>사이트</th>
                    <th>상품명</th>
                    <th>가격</th>
                    <th>관찰일</th>
                    <th>메모</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((p) => (
                    <tr key={p.id}>
                      <td>{p.siteName}</td>
                      <td>
                        {p.listingUrl ? (
                          <a href={p.listingUrl} target="_blank" rel="noreferrer">{p.listingTitle || p.listingUrl}</a>
                        ) : (
                          p.listingTitle || "-"
                        )}
                      </td>
                      <td>{p.priceWon.toLocaleString()}원</td>
                      <td>{formatDate(p.observedAt)}</td>
                      <td className="admin-truncate">{p.memo || "-"}</td>
                      <td>
                        <ActionForm action={removeCompetitorPrice}>
                          <input type="hidden" name="priceId" value={p.id} />
                          <ConfirmDeleteButton message="이 가격 기록을 삭제하시겠습니까?" />
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        );
      })}

      {productRows.length === 0 && (
        <section className="admin-card admin-empty">
          활성화된 제품이 없습니다. 먼저 제품 관리에서 제품을 등록해 주세요.
        </section>
      )}
    </main>
  );
}
