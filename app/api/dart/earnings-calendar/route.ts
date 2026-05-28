import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function nextDate(month: number, day: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const target = new Date(year, month - 1, day);
  if (target < now) target.setFullYear(year + 1);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
}

const UPCOMING = [
  { code: "005930", name: "삼성전자",       date: nextDate(7, 31), consensus: "12.4조" },
  { code: "000660", name: "SK하이닉스",     date: nextDate(7, 29), consensus: "5.8조"  },
  { code: "035720", name: "카카오",         date: nextDate(8,  2), consensus: "3,400억" },
  { code: "035420", name: "NAVER",          date: nextDate(8,  5), consensus: "4,200억" },
  { code: "207940", name: "삼성바이오로직스", date: nextDate(8,  8), consensus: "5,800억" },
];

export async function GET() {
  return NextResponse.json({ items: UPCOMING, source: "seed" });
}
