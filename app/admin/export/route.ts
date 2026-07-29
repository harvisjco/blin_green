import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { customers, inquiries } from "../../../db/schema";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const STATUS_LABEL: Record<string, string> = {
  new: "신규",
  consulting: "상담중",
  quoted: "견적완료",
  scheduled: "시공예정",
  completed: "완료",
  cancelled: "취소",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") ?? "";

  const db = getDb();
  let rows = await db
    .select({
      id: inquiries.id,
      status: inquiries.status,
      source: inquiries.source,
      interest: inquiries.interest,
      quoteAmount: inquiries.quoteAmount,
      quoteNote: inquiries.quoteNote,
      scheduledAt: inquiries.scheduledAt,
      createdAt: inquiries.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerArea: customers.area,
    })
    .from(inquiries)
    .innerJoin(customers, eq(inquiries.customerId, customers.id))
    .orderBy(desc(inquiries.createdAt));

  if (statusFilter) {
    rows = rows.filter((row) => row.status === statusFilter);
  }

  const header = ["접수일", "고객명", "연락처", "지역", "관심/내용", "경로", "상태", "견적금액", "견적메모", "시공일"];
  const lines = [header.join(",")];

  for (const row of rows) {
    lines.push(
      [
        formatDate(row.createdAt),
        row.customerName,
        row.customerPhone,
        row.customerArea,
        row.interest,
        row.source === "website" ? "웹 신청" : "직접 등록",
        STATUS_LABEL[row.status] ?? row.status,
        row.quoteAmount ?? "",
        row.quoteNote,
        formatDate(row.scheduledAt),
      ]
        .map((v) => csvEscape(String(v ?? "")))
        .join(","),
    );
  }

  const csv = "﻿" + lines.join("\r\n");
  const filename = `blingreen-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
