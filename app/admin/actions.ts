"use server";

import { and, desc, eq, gte, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../../db";
import {
  competitorPrices,
  customers,
  inquiries,
  inquiryItems,
  inquiryNotes,
  inquiryReviews,
  inquiryStatusEvents,
  partnerReferrals,
  partners,
  products,
} from "../../db/schema";
import { itemAmount } from "./pricing";

const STATUSES = ["new", "consulting", "quoted", "scheduled", "completed", "cancelled"] as const;
export type InquiryStatus = (typeof STATUSES)[number];

export type ActionResult = { ok: true } | { ok: false; error: string };

function logActionError(action: string, error: unknown) {
  console.error(`[admin action failed] ${action}:`, error);
}

async function recalculateQuoteAmount(db: ReturnType<typeof getDb>, inquiryId: number) {
  const items = await db.select().from(inquiryItems).where(eq(inquiryItems.inquiryId, inquiryId));
  const total = items.reduce(
    (acc, item) => acc + itemAmount(item.widthCm, item.heightCm, item.quantity, item.unitPrice),
    0,
  );
  await db
    .update(inquiries)
    .set({ quoteAmount: items.length ? total : null, updatedAt: new Date().toISOString() })
    .where(eq(inquiries.id, inquiryId));
}

const DUPLICATE_WINDOW_HOURS = 48;

export async function createManualInquiry(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const interest = String(formData.get("interest") ?? "").trim();
  const confirmDuplicate = String(formData.get("confirmDuplicate") ?? "") === "1";
  const referredByCustomerId = Number(formData.get("referredByCustomerId")) || null;

  if (!name || !phone) return { ok: false, error: "성함과 연락처를 입력해 주세요." };

  try {
    const db = getDb();
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone))
      .limit(1);

    if (existingCustomer && !confirmDuplicate) {
      const since = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
      const recentOpen = await db
        .select({ id: inquiries.id, status: inquiries.status, createdAt: inquiries.createdAt })
        .from(inquiries)
        .where(
          and(
            eq(inquiries.customerId, existingCustomer.id),
            ne(inquiries.status, "cancelled"),
            ne(inquiries.status, "completed"),
          ),
        )
        .orderBy(desc(inquiries.createdAt))
        .limit(1);

      if (recentOpen.length > 0) {
        return {
          ok: false,
          error: `DUPLICATE:${existingCustomer.name}님은 이미 진행 중인 문의(#${recentOpen[0].id})가 있습니다. 그래도 새로 등록하려면 다시 눌러주세요.`,
        };
      }

      const recentAny = await db
        .select({ id: inquiries.id, createdAt: inquiries.createdAt })
        .from(inquiries)
        .where(and(eq(inquiries.customerId, existingCustomer.id), gte(inquiries.createdAt, since)))
        .orderBy(desc(inquiries.createdAt))
        .limit(1);

      if (recentAny.length > 0) {
        return {
          ok: false,
          error: `DUPLICATE:${existingCustomer.name}님은 최근 ${DUPLICATE_WINDOW_HOURS}시간 내 이미 문의(#${recentAny[0].id})를 등록했습니다. 그래도 새로 등록하려면 다시 눌러주세요.`,
        };
      }
    }

    const customerId = existingCustomer
      ? existingCustomer.id
      : (await db.insert(customers).values({ name, phone, area, referredByCustomerId }).returning())[0].id;

    const [inquiry] = await db
      .insert(inquiries)
      .values({ customerId, source: "manual", interest })
      .returning();
    await db.insert(inquiryStatusEvents).values({ inquiryId: inquiry.id, fromStatus: null, toStatus: "new" });

    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    logActionError("createManualInquiry", error);
    return { ok: false, error: "등록에 실패했습니다. 다시 시도해 주세요." };
  }
}

export async function updateInquiryStatus(inquiryId: number, status: InquiryStatus): Promise<ActionResult> {
  if (!STATUSES.includes(status)) return { ok: false, error: "잘못된 상태 값입니다." };
  try {
    const db = getDb();
    const [current] = await db.select({ status: inquiries.status }).from(inquiries).where(eq(inquiries.id, inquiryId)).limit(1);
    if (!current) return { ok: false, error: "문의를 찾을 수 없습니다." };

    await db
      .update(inquiries)
      .set({
        status,
        updatedAt: new Date().toISOString(),
        completedAt: status === "completed" ? new Date().toISOString() : null,
      })
      .where(eq(inquiries.id, inquiryId));

    if (current.status !== status) {
      await db.insert(inquiryStatusEvents).values({ inquiryId, fromStatus: current.status, toStatus: status });
    }

    revalidatePath(`/admin/${inquiryId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/remarketing");
    return { ok: true };
  } catch (error) {
    logActionError("updateInquiryStatus", error);
    return { ok: false, error: "상태 변경에 실패했습니다." };
  }
}

export async function updateInquiryStatusForm(formData: FormData): Promise<ActionResult> {
  const inquiryId = Number(formData.get("inquiryId"));
  const status = String(formData.get("status") ?? "") as InquiryStatus;
  if (!inquiryId) return { ok: false, error: "잘못된 요청입니다." };
  return updateInquiryStatus(inquiryId, status);
}

export async function updateInquiryQuote(formData: FormData): Promise<ActionResult> {
  const inquiryId = Number(formData.get("inquiryId"));
  const amountRaw = String(formData.get("quoteAmount") ?? "").trim();
  const quoteNote = String(formData.get("quoteNote") ?? "").trim();
  if (!inquiryId) return { ok: false, error: "잘못된 요청입니다." };

  const quoteAmount = amountRaw ? Number(amountRaw.replace(/[^0-9]/g, "")) : null;

  try {
    const db = getDb();
    await db
      .update(inquiries)
      .set({ quoteAmount, quoteNote, updatedAt: new Date().toISOString() })
      .where(eq(inquiries.id, inquiryId));
    revalidatePath(`/admin/${inquiryId}`);
    return { ok: true };
  } catch (error) {
    logActionError("updateInquiryQuote", error);
    return { ok: false, error: "저장에 실패했습니다." };
  }
}

export async function updateInquirySchedule(formData: FormData): Promise<ActionResult> {
  const inquiryId = Number(formData.get("inquiryId"));
  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();
  if (!inquiryId) return { ok: false, error: "잘못된 요청입니다." };

  try {
    const db = getDb();
    await db
      .update(inquiries)
      .set({ scheduledAt: scheduledAt || null, updatedAt: new Date().toISOString() })
      .where(eq(inquiries.id, inquiryId));
    revalidatePath(`/admin/${inquiryId}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    logActionError("updateInquirySchedule", error);
    return { ok: false, error: "일정 저장에 실패했습니다." };
  }
}

export async function addInquiryNote(formData: FormData): Promise<ActionResult> {
  const inquiryId = Number(formData.get("inquiryId"));
  const author = String(formData.get("author") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!inquiryId || !content) return { ok: false, error: "내용을 입력해 주세요." };

  try {
    const db = getDb();
    await db.insert(inquiryNotes).values({ inquiryId, author, content });
    revalidatePath(`/admin/${inquiryId}`);
    return { ok: true };
  } catch (error) {
    logActionError("addInquiryNote", error);
    return { ok: false, error: "일지 추가에 실패했습니다." };
  }
}

export async function updateCustomerMemo(formData: FormData): Promise<ActionResult> {
  const customerId = Number(formData.get("customerId"));
  const memo = String(formData.get("memo") ?? "").trim();
  if (!customerId) return { ok: false, error: "잘못된 요청입니다." };

  try {
    const db = getDb();
    await db.update(customers).set({ memo }).where(eq(customers.id, customerId));
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    logActionError("updateCustomerMemo", error);
    return { ok: false, error: "메모 저장에 실패했습니다." };
  }
}

// --- Product catalog ---

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const family = String(formData.get("family") ?? "커튼").trim();
  const price = Number(String(formData.get("price") ?? "").replace(/[^0-9]/g, ""));
  const cost = Number(String(formData.get("cost") ?? "").replace(/[^0-9]/g, "")) || 0;
  if (!name || !price) return { ok: false, error: "제품명과 판매가를 입력해 주세요." };

  try {
    const db = getDb();
    await db.insert(products).values({ name, family, priceCents: price, costCents: cost });
    revalidatePath("/admin/products");
    return { ok: true };
  } catch (error) {
    logActionError("createProduct", error);
    return { ok: false, error: "제품 등록에 실패했습니다." };
  }
}

export async function updateProduct(formData: FormData): Promise<ActionResult> {
  const productId = Number(formData.get("productId"));
  const price = Number(String(formData.get("price") ?? "").replace(/[^0-9]/g, ""));
  const cost = Number(String(formData.get("cost") ?? "").replace(/[^0-9]/g, "")) || 0;
  if (!productId || !price) return { ok: false, error: "판매가를 입력해 주세요." };

  try {
    const db = getDb();
    await db.update(products).set({ priceCents: price, costCents: cost }).where(eq(products.id, productId));
    revalidatePath("/admin/products");
    return { ok: true };
  } catch (error) {
    logActionError("updateProduct", error);
    return { ok: false, error: "저장에 실패했습니다." };
  }
}

export async function toggleProductActive(productId: number, active: boolean): Promise<ActionResult> {
  try {
    const db = getDb();
    await db.update(products).set({ active: active ? 1 : 0 }).where(eq(products.id, productId));
    revalidatePath("/admin/products");
    return { ok: true };
  } catch (error) {
    logActionError("toggleProductActive", error);
    return { ok: false, error: "상태 변경에 실패했습니다." };
  }
}

export async function toggleProductActiveForm(formData: FormData): Promise<ActionResult> {
  const productId = Number(formData.get("productId"));
  const nextActive = String(formData.get("nextActive")) === "1";
  if (!productId) return { ok: false, error: "잘못된 요청입니다." };
  return toggleProductActive(productId, nextActive);
}

// --- Quote line items ---

export async function addInquiryItem(formData: FormData): Promise<ActionResult> {
  const inquiryId = Number(formData.get("inquiryId"));
  const productId = Number(formData.get("productId")) || null;
  const widthCm = Number(formData.get("widthCm"));
  const heightCm = Number(formData.get("heightCm"));
  const quantity = Number(formData.get("quantity")) || 1;
  if (!inquiryId) return { ok: false, error: "잘못된 요청입니다." };
  if (!(widthCm > 0) || !(heightCm > 0) || !(quantity > 0)) {
    return { ok: false, error: "폭·높이·수량은 0보다 큰 값이어야 합니다." };
  }

  try {
    const db = getDb();
    let productName = String(formData.get("productName") ?? "").trim();
    let unitPrice = 0;
    let unitCost = 0;

    if (productId) {
      const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      if (product) {
        productName = product.name;
        unitPrice = product.priceCents;
        unitCost = product.costCents;
      }
    }
    if (!productName) return { ok: false, error: "제품을 선택하거나 이름을 입력해 주세요." };

    await db.insert(inquiryItems).values({
      inquiryId,
      productId,
      productName,
      widthCm,
      heightCm,
      quantity,
      unitPrice,
      unitCost,
    });

    await recalculateQuoteAmount(db, inquiryId);
    revalidatePath(`/admin/${inquiryId}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    logActionError("addInquiryItem", error);
    return { ok: false, error: "품목 추가에 실패했습니다." };
  }
}

export async function removeInquiryItem(formData: FormData): Promise<ActionResult> {
  const itemId = Number(formData.get("itemId"));
  const inquiryId = Number(formData.get("inquiryId"));
  if (!itemId || !inquiryId) return { ok: false, error: "잘못된 요청입니다." };

  try {
    const db = getDb();
    await db.delete(inquiryItems).where(eq(inquiryItems.id, itemId));
    await recalculateQuoteAmount(db, inquiryId);
    revalidatePath(`/admin/${inquiryId}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    logActionError("removeInquiryItem", error);
    return { ok: false, error: "삭제에 실패했습니다." };
  }
}

// --- Reviews ---

async function ensureReviewRow(db: ReturnType<typeof getDb>, inquiryId: number) {
  const [existing] = await db.select().from(inquiryReviews).where(eq(inquiryReviews.inquiryId, inquiryId)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(inquiryReviews).values({ inquiryId }).returning();
  return created;
}

export async function markReviewRequested(formData: FormData): Promise<ActionResult> {
  const inquiryId = Number(formData.get("inquiryId"));
  if (!inquiryId) return { ok: false, error: "잘못된 요청입니다." };

  try {
    const db = getDb();
    const row = await ensureReviewRow(db, inquiryId);
    await db
      .update(inquiryReviews)
      .set({ requestedAt: new Date().toISOString() })
      .where(eq(inquiryReviews.id, row.id));
    revalidatePath("/admin/reviews");
    revalidatePath(`/admin/${inquiryId}`);
    return { ok: true };
  } catch (error) {
    logActionError("markReviewRequested", error);
    return { ok: false, error: "요청 표시에 실패했습니다." };
  }
}

export async function saveReceivedReview(formData: FormData): Promise<ActionResult> {
  const inquiryId = Number(formData.get("inquiryId"));
  const reviewText = String(formData.get("reviewText") ?? "").trim();
  const reviewUrl = String(formData.get("reviewUrl") ?? "").trim();
  if (!inquiryId) return { ok: false, error: "잘못된 요청입니다." };
  if (!reviewText && !reviewUrl) return { ok: false, error: "후기 내용 또는 링크를 입력해 주세요." };

  try {
    const db = getDb();
    const row = await ensureReviewRow(db, inquiryId);
    await db
      .update(inquiryReviews)
      .set({ reviewText, reviewUrl, receivedAt: row.receivedAt ?? new Date().toISOString() })
      .where(eq(inquiryReviews.id, row.id));
    revalidatePath("/admin/reviews");
    revalidatePath(`/admin/${inquiryId}`);
    return { ok: true };
  } catch (error) {
    logActionError("saveReceivedReview", error);
    return { ok: false, error: "후기 저장에 실패했습니다." };
  }
}

export async function toggleReviewFeatured(formData: FormData): Promise<ActionResult> {
  const inquiryId = Number(formData.get("inquiryId"));
  const nextFeatured = String(formData.get("nextFeatured")) === "1";
  if (!inquiryId) return { ok: false, error: "잘못된 요청입니다." };

  try {
    const db = getDb();
    const row = await ensureReviewRow(db, inquiryId);
    await db
      .update(inquiryReviews)
      .set({ featured: nextFeatured ? 1 : 0 })
      .where(eq(inquiryReviews.id, row.id));
    revalidatePath("/admin/reviews");
    return { ok: true };
  } catch (error) {
    logActionError("toggleReviewFeatured", error);
    return { ok: false, error: "상태 변경에 실패했습니다." };
  }
}

// --- Partner network (referral pipeline) ---

const FEE_TYPES = ["percent", "flat"] as const;
const FEE_STATUSES = ["pending", "invoiced", "paid"] as const;
export type FeeStatus = (typeof FEE_STATUSES)[number];

export async function createPartner(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "커튼·블라인드";
  const phone = String(formData.get("phone") ?? "").trim();
  const areas = String(formData.get("areas") ?? "").trim();
  const feeType = String(formData.get("feeType") ?? "percent");
  const feeValue = Number(String(formData.get("feeValue") ?? "").replace(/[^0-9]/g, "")) || 0;
  const memo = String(formData.get("memo") ?? "").trim();

  if (!name) return { ok: false, error: "업체명을 입력해 주세요." };
  if (!FEE_TYPES.includes(feeType as (typeof FEE_TYPES)[number])) {
    return { ok: false, error: "잘못된 수수료 방식입니다." };
  }

  try {
    const db = getDb();
    await db.insert(partners).values({ name, category, phone, areas, feeType, feeValue, memo });
    revalidatePath("/admin/partners");
    return { ok: true };
  } catch (error) {
    logActionError("createPartner", error);
    return { ok: false, error: "파트너 등록에 실패했습니다." };
  }
}

export async function updatePartner(formData: FormData): Promise<ActionResult> {
  const partnerId = Number(formData.get("partnerId"));
  const phone = String(formData.get("phone") ?? "").trim();
  const areas = String(formData.get("areas") ?? "").trim();
  const feeType = String(formData.get("feeType") ?? "percent");
  const feeValue = Number(String(formData.get("feeValue") ?? "").replace(/[^0-9]/g, "")) || 0;
  const memo = String(formData.get("memo") ?? "").trim();
  if (!partnerId) return { ok: false, error: "잘못된 요청입니다." };
  if (!FEE_TYPES.includes(feeType as (typeof FEE_TYPES)[number])) {
    return { ok: false, error: "잘못된 수수료 방식입니다." };
  }

  try {
    const db = getDb();
    await db.update(partners).set({ phone, areas, feeType, feeValue, memo }).where(eq(partners.id, partnerId));
    revalidatePath("/admin/partners");
    return { ok: true };
  } catch (error) {
    logActionError("updatePartner", error);
    return { ok: false, error: "저장에 실패했습니다." };
  }
}

export async function togglePartnerActive(formData: FormData): Promise<ActionResult> {
  const partnerId = Number(formData.get("partnerId"));
  const nextActive = String(formData.get("nextActive")) === "1";
  if (!partnerId) return { ok: false, error: "잘못된 요청입니다." };

  try {
    const db = getDb();
    await db.update(partners).set({ active: nextActive ? 1 : 0 }).where(eq(partners.id, partnerId));
    revalidatePath("/admin/partners");
    return { ok: true };
  } catch (error) {
    logActionError("togglePartnerActive", error);
    return { ok: false, error: "상태 변경에 실패했습니다." };
  }
}

function calculateFee(feeType: string, feeValue: number, jobAmount: number | null): number | null {
  if (jobAmount === null) return null;
  if (feeType === "flat") return feeValue;
  return Math.round((jobAmount * feeValue) / 100);
}

export async function referInquiryToPartner(formData: FormData): Promise<ActionResult> {
  const inquiryId = Number(formData.get("inquiryId"));
  const partnerId = Number(formData.get("partnerId"));
  const memo = String(formData.get("memo") ?? "").trim();
  if (!inquiryId || !partnerId) return { ok: false, error: "파트너를 선택해 주세요." };

  try {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(partnerReferrals)
      .where(eq(partnerReferrals.inquiryId, inquiryId))
      .limit(1);
    if (existing) return { ok: false, error: "이미 파트너에게 배정된 문의입니다." };

    await db.insert(partnerReferrals).values({ inquiryId, partnerId, memo });
    revalidatePath(`/admin/${inquiryId}`);
    revalidatePath("/admin/partners");
    return { ok: true };
  } catch (error) {
    logActionError("referInquiryToPartner", error);
    return { ok: false, error: "배정에 실패했습니다." };
  }
}

export async function updateReferralOutcome(formData: FormData): Promise<ActionResult> {
  const referralId = Number(formData.get("referralId"));
  const jobAmountRaw = String(formData.get("jobAmount") ?? "").trim();
  const feeStatus = String(formData.get("feeStatus") ?? "pending");
  const memo = String(formData.get("memo") ?? "").trim();
  if (!referralId) return { ok: false, error: "잘못된 요청입니다." };
  if (!FEE_STATUSES.includes(feeStatus as FeeStatus)) return { ok: false, error: "잘못된 상태 값입니다." };

  const jobAmount = jobAmountRaw ? Number(jobAmountRaw.replace(/[^0-9]/g, "")) : null;

  try {
    const db = getDb();
    const [referral] = await db.select().from(partnerReferrals).where(eq(partnerReferrals.id, referralId)).limit(1);
    if (!referral) return { ok: false, error: "배정 기록을 찾을 수 없습니다." };

    // Once a fee is marked paid, its amount is a settled financial fact — don't let a
    // later edit (e.g. a partner's fee rate changing, or just re-saving the memo)
    // silently recompute and overwrite money that was already paid out.
    if (referral.feeStatus === "paid") {
      return { ok: false, error: "이미 정산 완료된 건은 수정할 수 없습니다. 금액이 잘못됐다면 관리자에게 문의해 별도로 정정해 주세요." };
    }

    const [partner] = await db.select().from(partners).where(eq(partners.id, referral.partnerId)).limit(1);
    const feeAmount = partner ? calculateFee(partner.feeType, partner.feeValue, jobAmount) : null;

    await db
      .update(partnerReferrals)
      .set({
        jobAmount,
        feeAmount,
        feeStatus,
        memo,
        paidAt: feeStatus === "paid" ? new Date().toISOString() : null,
      })
      .where(eq(partnerReferrals.id, referralId));

    revalidatePath("/admin/partners");
    revalidatePath(`/admin/${referral.inquiryId}`);
    return { ok: true };
  } catch (error) {
    logActionError("updateReferralOutcome", error);
    return { ok: false, error: "저장에 실패했습니다." };
  }
}

// --- Competitor price tracking (manual entries only, no scraping) ---

function isSafeHttpUrl(value: string): boolean {
  if (!value) return true; // empty is allowed, field is optional
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function addCompetitorPrice(formData: FormData): Promise<ActionResult> {
  const productId = Number(formData.get("productId"));
  const siteName = String(formData.get("siteName") ?? "").trim();
  const listingTitle = String(formData.get("listingTitle") ?? "").trim();
  const listingUrl = String(formData.get("listingUrl") ?? "").trim();
  const priceWon = Number(String(formData.get("priceWon") ?? "").replace(/[^0-9]/g, ""));
  const memo = String(formData.get("memo") ?? "").trim();

  if (!productId) return { ok: false, error: "제품을 선택해 주세요." };
  if (!siteName) return { ok: false, error: "사이트명을 입력해 주세요." };
  if (!(priceWon > 0)) return { ok: false, error: "가격은 0보다 큰 값이어야 합니다." };
  if (!isSafeHttpUrl(listingUrl)) return { ok: false, error: "상품 링크는 http:// 또는 https:// 로 시작하는 주소여야 합니다." };

  try {
    const db = getDb();
    await db.insert(competitorPrices).values({ productId, siteName, listingTitle, listingUrl, priceWon, memo });
    revalidatePath("/admin/pricing-watch");
    return { ok: true };
  } catch (error) {
    logActionError("addCompetitorPrice", error);
    return { ok: false, error: "가격 기록에 실패했습니다." };
  }
}

export async function removeCompetitorPrice(formData: FormData): Promise<ActionResult> {
  const priceId = Number(formData.get("priceId"));
  if (!priceId) return { ok: false, error: "잘못된 요청입니다." };

  try {
    const db = getDb();
    await db.delete(competitorPrices).where(eq(competitorPrices.id, priceId));
    revalidatePath("/admin/pricing-watch");
    return { ok: true };
  } catch (error) {
    logActionError("removeCompetitorPrice", error);
    return { ok: false, error: "삭제에 실패했습니다." };
  }
}
