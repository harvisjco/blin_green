import { and, eq, gte, isNotNull, lt } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "../../../db";
import { customers, inquiries } from "../../../db/schema";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  new: "신규",
  consulting: "상담중",
  quoted: "견적완료",
  scheduled: "시공예정",
  completed: "완료",
  cancelled: "취소",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const today = new Date();
  const year = Number(params.year) || today.getFullYear();
  const month = Number(params.month) || today.getMonth() + 1; // 1-12

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const nextMonthStart = new Date(Date.UTC(year, month, 1));

  const db = getDb();
  const jobs = await db
    .select({
      id: inquiries.id,
      status: inquiries.status,
      scheduledAt: inquiries.scheduledAt,
      customerName: customers.name,
      customerArea: customers.area,
    })
    .from(inquiries)
    .innerJoin(customers, eq(inquiries.customerId, customers.id))
    .where(
      and(
        isNotNull(inquiries.scheduledAt),
        gte(inquiries.scheduledAt, monthStart.toISOString()),
        lt(inquiries.scheduledAt, nextMonthStart.toISOString()),
      ),
    );

  const jobsByDay = new Map<number, typeof jobs>();
  for (const job of jobs) {
    const date = new Date(job.scheduledAt!.includes("T") ? job.scheduledAt! : job.scheduledAt!.replace(" ", "T") + "Z");
    const day = date.getUTCDate();
    const existing = jobsByDay.get(day) ?? [];
    existing.push(job);
    jobsByDay.set(day, existing);
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = monthStart.getUTCDay(); // 0 = Sun
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const todayDate = today.getDate();

  return (
    <main className="admin">
      <header className="admin-header">
        <h1>시공 일정 달력</h1>
        <p>시공예정일이 등록된 문의 {jobs.length}건 · {year}년 {month}월</p>
      </header>

      <section className="admin-card">
        <div className="admin-calendar-nav">
          <Link href={`/admin/calendar?year=${prev.year}&month=${prev.month}`}>← 이전달</Link>
          <strong>{year}년 {month}월</strong>
          <Link href={`/admin/calendar?year=${next.year}&month=${next.month}`}>다음달 →</Link>
        </div>

        <div className="admin-calendar-grid admin-calendar-weekdays">
          {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
        </div>
        <div className="admin-calendar-grid">
          {cells.map((day, idx) => (
            <div key={idx} className={`admin-calendar-cell ${day === null ? "empty" : ""} ${isCurrentMonth && day === todayDate ? "today" : ""}`}>
              {day !== null && (
                <>
                  <span className="admin-calendar-day">{day}</span>
                  <div className="admin-calendar-jobs">
                    {(jobsByDay.get(day) ?? []).map((job) => (
                      <Link key={job.id} href={`/admin/${job.id}`} className={`admin-calendar-job status-${job.status}`}>
                        <b>{job.customerName}</b>
                        <span>{job.customerArea || STATUS_LABEL[job.status]}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
