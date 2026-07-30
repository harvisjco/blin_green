import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Raw submissions from the public website consultation form.
export const consultations = sqliteTable("consultations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  area: text("area").notNull().default(""),
  method: text("method").notNull().default(""),
  message: text("message").notNull().default(""),
  detail: text("detail").notNull().default(""),
  // Marketing attribution captured from the visitor's landing URL at first touch.
  utmSource: text("utm_source").notNull().default(""), // e.g. instagram, naver, google
  utmMedium: text("utm_medium").notNull().default(""), // e.g. cpc, social, referral
  utmCampaign: text("utm_campaign").notNull().default(""),
  referrer: text("referrer").notNull().default(""), // document.referrer fallback when no UTM present
  landingPath: text("landing_path").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// A customer, identified by phone number. Reused across repeat visits.
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  area: text("area").notNull().default(""),
  memo: text("memo").notNull().default(""),
  referredByCustomerId: integer("referred_by_customer_id"), // self-reference: which existing customer sent them
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// One consultation/job case for a customer: quote, schedule, and status.
export const inquiries = sqliteTable("inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  consultationId: integer("consultation_id").references(() => consultations.id),
  source: text("source").notNull().default("manual"), // "website" | "manual"
  status: text("status").notNull().default("new"), // new | consulting | quoted | scheduled | completed | cancelled
  interest: text("interest").notNull().default(""),
  quoteAmount: integer("quote_amount"),
  quoteNote: text("quote_note").notNull().default(""),
  scheduledAt: text("scheduled_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// A dated meeting/call log entry attached to an inquiry.
export const inquiryNotes = sqliteTable("inquiry_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inquiryId: integer("inquiry_id").notNull().references(() => inquiries.id),
  author: text("author").notNull().default(""),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Append-only log of status transitions for an inquiry.
export const inquiryStatusEvents = sqliteTable("inquiry_status_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inquiryId: integer("inquiry_id").notNull().references(() => inquiries.id),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Product catalog: curtain/blind items priced per square meter.
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  family: text("family").notNull().default("커튼"), // "커튼" | "블라인드"
  unit: text("unit").notNull().default("m2"),
  priceCents: integer("price_cents").notNull(), // sale price per m2, in KRW cents-free integer won
  costCents: integer("cost_cents").notNull().default(0), // cost per m2, in won
  active: integer("active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// A priced line item on an inquiry's quote: product x width x height.
export const inquiryItems = sqliteTable("inquiry_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inquiryId: integer("inquiry_id").notNull().references(() => inquiries.id),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  widthCm: integer("width_cm").notNull(),
  heightCm: integer("height_cm").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(), // snapshot of sale price per m2 at quote time
  unitCost: integer("unit_cost").notNull().default(0), // snapshot of cost per m2 at quote time
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Tracks the post-completion review request/collection workflow for an inquiry.
export const inquiryReviews = sqliteTable("inquiry_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inquiryId: integer("inquiry_id").notNull().references(() => inquiries.id).unique(),
  requestedAt: text("requested_at"), // when the admin marked the review request as sent
  receivedAt: text("received_at"), // when a review actually came back
  reviewText: text("review_text").notNull().default(""),
  reviewUrl: text("review_url").notNull().default(""), // link to the live post if published elsewhere
  featured: integer("featured").notNull().default(0), // 1 if picked for the homepage reviews section
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// External contractors/vendors that overflow or out-of-scope inquiries can be referred to.
export const partners = sqliteTable("partners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // business or contact name
  category: text("category").notNull().default("커튼·블라인드"), // e.g. 커튼·블라인드, 마루, 도배, 조명
  phone: text("phone").notNull().default(""),
  areas: text("areas").notNull().default(""), // free-text service areas, comma separated
  feeType: text("fee_type").notNull().default("percent"), // "percent" | "flat"
  feeValue: integer("fee_value").notNull().default(0), // percent (0-100) or flat won amount, depending on feeType
  memo: text("memo").notNull().default(""),
  active: integer("active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// One inquiry referred to one partner, with the resulting referral fee lifecycle.
export const partnerReferrals = sqliteTable("partner_referrals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inquiryId: integer("inquiry_id").notNull().references(() => inquiries.id).unique(),
  partnerId: integer("partner_id").notNull().references(() => partners.id),
  referredAt: text("referred_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  jobAmount: integer("job_amount"), // final job value reported by/confirmed with the partner, in won
  feeAmount: integer("fee_amount"), // referral fee owed to blingreen, in won
  feeStatus: text("fee_status").notNull().default("pending"), // pending | invoiced | paid
  paidAt: text("paid_at"),
  memo: text("memo").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// A manually-recorded competitor price snapshot for one of our catalog products.
// Admin looks the product up on a marketplace themselves and logs what they found here —
// no automated scraping/crawling of external sites.
export const competitorPrices = sqliteTable("competitor_prices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  siteName: text("site_name").notNull(), // e.g. 네이버쇼핑, 쿠팡, 지그재그
  listingTitle: text("listing_title").notNull().default(""), // the competitor's product title, for reference
  listingUrl: text("listing_url").notNull().default(""),
  priceWon: integer("price_won").notNull(), // observed price per m2 (or per listing, noted in memo), in won
  observedAt: text("observed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  memo: text("memo").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
