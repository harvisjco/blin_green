import { desc } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "../../../db";
import { products } from "../../../db/schema";
import { createProduct, toggleProductActiveForm, updateProduct } from "../actions";
import { FormToast } from "../FormToast";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const db = getDb();
  const rows = await db.select().from(products).orderBy(desc(products.createdAt));

  return (
    <main className="admin">
      <Link href="/admin" className="admin-back">← 목록으로</Link>

      <header className="admin-header">
        <h1>제품 · 단가 관리</h1>
        <p>m²(폭×높이) 기준 판매가·원가를 등록하면, 견적에서 자동으로 금액과 마진이 계산됩니다.</p>
      </header>

      <section className="admin-card">
        <h2>새 제품 등록</h2>
        <FormToast action={createProduct} className="admin-form-row" successMessage="제품을 등록했습니다." resetOnSuccess>
          <select name="family" defaultValue="커튼">
            <option value="커튼">커튼</option>
            <option value="블라인드">블라인드</option>
          </select>
          <input name="name" placeholder="제품명 (예: 암막 커튼)" required />
          <input name="price" placeholder="판매가 (원/m²)" inputMode="numeric" required />
          <input name="cost" placeholder="원가 (원/m²)" inputMode="numeric" />
          <button type="submit">등록</button>
        </FormToast>
      </section>

      <table className="admin-table">
        <thead>
          <tr>
            <th>구분</th>
            <th>제품명</th>
            <th>판매가(원/m²)</th>
            <th>원가(원/m²)</th>
            <th>마진율</th>
            <th>상태</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((product) => {
            const margin = product.priceCents > 0
              ? Math.round(((product.priceCents - product.costCents) / product.priceCents) * 100)
              : 0;
            return (
              <tr key={product.id}>
                <td>{product.family}</td>
                <td>{product.name}</td>
                <td colSpan={2}>
                  <FormToast action={updateProduct} className="admin-form-row" successMessage="단가를 저장했습니다.">
                    <input type="hidden" name="productId" value={product.id} />
                    <input name="price" defaultValue={product.priceCents} inputMode="numeric" style={{ width: 100 }} />
                    <input name="cost" defaultValue={product.costCents} inputMode="numeric" style={{ width: 100 }} />
                    <button type="submit">저장</button>
                  </FormToast>
                </td>
                <td>{margin}%</td>
                <td><span className={`admin-badge ${product.active ? "status-scheduled" : "status-cancelled"}`}>{product.active ? "판매중" : "중단"}</span></td>
                <td>
                  <form action={toggleProductActiveForm}>
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="nextActive" value={product.active ? "0" : "1"} />
                    <button type="submit" className="admin-link-button">{product.active ? "판매중지" : "재활성화"}</button>
                  </form>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr><td colSpan={7} className="admin-empty">등록된 제품이 없습니다.</td></tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
