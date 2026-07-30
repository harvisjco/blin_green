"use server";

import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { consultations, customers, inquiries, inquiryStatusEvents } from "../db/schema";

export type SubmitConsultationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitConsultation(
  formData: FormData,
): Promise<SubmitConsultationResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const method = String(formData.get("method") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const detail = String(formData.get("detail") ?? "").trim();
  const utmSource = String(formData.get("utmSource") ?? "").trim().slice(0, 100);
  const utmMedium = String(formData.get("utmMedium") ?? "").trim().slice(0, 100);
  const utmCampaign = String(formData.get("utmCampaign") ?? "").trim().slice(0, 100);
  const referrer = String(formData.get("referrer") ?? "").trim().slice(0, 300);
  const landingPath = String(formData.get("landingPath") ?? "").trim().slice(0, 300);

  if (!name || !phone) {
    return { ok: false, error: "성함과 연락처를 입력해 주세요." };
  }

  try {
    const db = getDb();
    const [consultation] = await db
      .insert(consultations)
      .values({ name, phone, area, method, message, detail, utmSource, utmMedium, utmCampaign, referrer, landingPath })
      .returning();

    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone))
      .limit(1);

    const customerId = existingCustomer
      ? existingCustomer.id
      : (await db.insert(customers).values({ name, phone, area }).returning())[0].id;

    const [inquiry] = await db
      .insert(inquiries)
      .values({
        customerId,
        consultationId: consultation.id,
        source: "website",
        interest: message,
        quoteNote: detail,
      })
      .returning();
    await db.insert(inquiryStatusEvents).values({ inquiryId: inquiry.id, fromStatus: null, toStatus: "new" });

    return { ok: true };
  } catch {
    return { ok: false, error: "신청 접수 중 문제가 발생했어요. 전화로 문의해 주세요." };
  }
}
