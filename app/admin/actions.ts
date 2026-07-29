"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../../db";
import { customers, inquiries, inquiryItems, inquiryNotes, products } from "../../db/schema";
import { itemAmount } from "./pricing";

const STATUSES = ["new", "consulting", "quoted", "scheduled", "completed", "cancelled"] as const;
export type InquiryStatus = (typeof STATUSES)[number];

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

export async function createManualInquiry(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const interest = String(formData.get("interest") ?? "").trim();

  if (!name || !phone) return;

  const db = getDb();
  const [existingCustomer] = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, phone))
    .limit(1);

  const customerId = existingCustomer
    ? existingCustomer.id
    : (await db.insert(customers).values({ name, phone, area }).returning())[0].id;

  await db.insert(inquiries).values({ customerId, source: "manual", interest });

  revalidatePath("/admin");
}

export async function updateInquiryStatus(inquiryId: number, status: InquiryStatus) {
  if (!STATUSES.includes(status)) return;
  const db = getDb();
  await db
    .update(inquiries)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(inquiries.id, inquiryId));
  revalidatePath(`/admin/${inquiryId}`);
  revalidatePath("/admin");
}

export async function updateInquiryQuote(formData: FormData) {
  const inquiryId = Number(formData.get("inquiryId"));
  const amountRaw = String(formData.get("quoteAmount") ?? "").trim();
  const quoteNote = String(formData.get("quoteNote") ?? "").trim();
  if (!inquiryId) return;

  const quoteAmount = amountRaw ? Number(amountRaw.replace(/[^0-9]/g, "")) : null;

  const db = getDb();
  await db
    .update(inquiries)
    .set({ quoteAmount, quoteNote, updatedAt: new Date().toISOString() })
    .where(eq(inquiries.id, inquiryId));
  revalidatePath(`/admin/${inquiryId}`);
}

export async function updateInquirySchedule(formData: FormData) {
  const inquiryId = Number(formData.get("inquiryId"));
  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();
  if (!inquiryId) return;

  const db = getDb();
  await db
    .update(inquiries)
    .set({ scheduledAt: scheduledAt || null, updatedAt: new Date().toISOString() })
    .where(eq(inquiries.id, inquiryId));
  revalidatePath(`/admin/${inquiryId}`);
  revalidatePath("/admin");
}

export async function addInquiryNote(formData: FormData) {
  const inquiryId = Number(formData.get("inquiryId"));
  const author = String(formData.get("author") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!inquiryId || !content) return;

  const db = getDb();
  await db.insert(inquiryNotes).values({ inquiryId, author, content });
  revalidatePath(`/admin/${inquiryId}`);
}

export async function updateCustomerMemo(formData: FormData) {
  const customerId = Number(formData.get("customerId"));
  const memo = String(formData.get("memo") ?? "").trim();
  if (!customerId) return;

  const db = getDb();
  await db.update(customers).set({ memo }).where(eq(customers.id, customerId));
  revalidatePath("/admin");
}

// --- Product catalog ---

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const family = String(formData.get("family") ?? "커튼").trim();
  const price = Number(String(formData.get("price") ?? "").replace(/[^0-9]/g, ""));
  const cost = Number(String(formData.get("cost") ?? "").replace(/[^0-9]/g, "")) || 0;
  if (!name || !price) return;

  const db = getDb();
  await db.insert(products).values({ name, family, priceCents: price, costCents: cost });
  revalidatePath("/admin/products");
}

export async function updateProduct(formData: FormData) {
  const productId = Number(formData.get("productId"));
  const price = Number(String(formData.get("price") ?? "").replace(/[^0-9]/g, ""));
  const cost = Number(String(formData.get("cost") ?? "").replace(/[^0-9]/g, "")) || 0;
  if (!productId || !price) return;

  const db = getDb();
  await db.update(products).set({ priceCents: price, costCents: cost }).where(eq(products.id, productId));
  revalidatePath("/admin/products");
}

export async function toggleProductActive(productId: number, active: boolean) {
  const db = getDb();
  await db.update(products).set({ active: active ? 1 : 0 }).where(eq(products.id, productId));
  revalidatePath("/admin/products");
}

// --- Quote line items ---

export async function addInquiryItem(formData: FormData) {
  const inquiryId = Number(formData.get("inquiryId"));
  const productId = Number(formData.get("productId")) || null;
  const widthCm = Number(formData.get("widthCm"));
  const heightCm = Number(formData.get("heightCm"));
  const quantity = Number(formData.get("quantity")) || 1;
  if (!inquiryId || !widthCm || !heightCm) return;

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
  if (!productName) return;

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
}

export async function removeInquiryItem(formData: FormData) {
  const itemId = Number(formData.get("itemId"));
  const inquiryId = Number(formData.get("inquiryId"));
  if (!itemId || !inquiryId) return;

  const db = getDb();
  await db.delete(inquiryItems).where(eq(inquiryItems.id, itemId));
  await recalculateQuoteAmount(db, inquiryId);
  revalidatePath(`/admin/${inquiryId}`);
  revalidatePath("/admin");
}
