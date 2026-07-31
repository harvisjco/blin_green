import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { customers, inquiries, inquiryReviews } from "../db/schema";
import Home, { type DbReview } from "./HomeClient";

export const dynamic = "force-dynamic";

async function getFeaturedReviews(): Promise<DbReview[]> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: inquiryReviews.id,
        reviewText: inquiryReviews.reviewText,
        reviewUrl: inquiryReviews.reviewUrl,
        completedAt: inquiries.completedAt,
        customerArea: customers.area,
      })
      .from(inquiryReviews)
      .innerJoin(inquiries, eq(inquiryReviews.inquiryId, inquiries.id))
      .innerJoin(customers, eq(inquiries.customerId, customers.id))
      .where(eq(inquiryReviews.featured, 1))
      .orderBy(desc(inquiryReviews.receivedAt))
      .limit(6);

    return rows
      .filter((row) => row.reviewText.trim().length > 0)
      .map((row) => ({
        id: row.id,
        customerArea: row.customerArea,
        quote: row.reviewText,
        reviewUrl: row.reviewUrl,
        completedAt: row.completedAt,
      }));
  } catch (error) {
    console.error("[getFeaturedReviews failed]", error);
    return [];
  }
}

export default async function Page() {
  const dbReviews = await getFeaturedReviews();
  return <Home dbReviews={dbReviews} />;
}
