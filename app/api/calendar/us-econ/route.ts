import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Importance = "high" | "medium" | "low";

type EconEvent = {
  date: string;
  event: string;
  importance: Importance;
  daysLeft: number;
};

function getUpcomingEvents(): EconEvent[] {
  const now = new Date();
  const events: Array<{ month: number; day: number; name: string; importance: Importance }> = [
    { month: 6,  day: 11, name: "FOMC 회의",           importance: "high"   },
    { month: 6,  day: 11, name: "CPI 발표",             importance: "high"   },
    { month: 7,  day: 3,  name: "NFP (비농업 고용)",    importance: "high"   },
    { month: 7,  day: 9,  name: "FOMC 의사록",          importance: "medium" },
    { month: 7,  day: 11, name: "CPI 발표",             importance: "high"   },
    { month: 7,  day: 30, name: "FOMC 회의",            importance: "high"   },
    { month: 8,  day: 1,  name: "NFP (비농업 고용)",    importance: "high"   },
    { month: 8,  day: 13, name: "CPI 발표",             importance: "high"   },
    { month: 9,  day: 17, name: "FOMC 회의 + 점도표",   importance: "high"   },
    { month: 11, day: 5,  name: "FOMC 회의",            importance: "high"   },
    { month: 12, day: 10, name: "FOMC 회의 + 점도표",   importance: "high"   },
  ];

  const thisYear = now.getFullYear();

  return events
    .map((e) => {
      const year =
        e.month < now.getMonth() + 1 ||
        (e.month === now.getMonth() + 1 && e.day < now.getDate())
          ? thisYear + 1
          : thisYear;
      const target = new Date(year, e.month - 1, e.day);
      const daysLeft = Math.ceil(
        (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        date: `${String(e.month).padStart(2, "0")}/${String(e.day).padStart(2, "0")}`,
        event: e.name,
        importance: e.importance,
        daysLeft: Math.max(daysLeft, 0),
      };
    })
    .filter((e) => e.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 6);
}

export async function GET() {
  try {
    return NextResponse.json({
      items: getUpcomingEvents(),
      source: "seed",
    });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
