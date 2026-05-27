"use client";

const DUMMY_TICKERS = [
  { label: "KOSPI", value: "2,634.21", change: "+0.42%", trend: "up" },
  { label: "KOSDAQ", value: "847.55", change: "-0.18%", trend: "down" },
  { label: "S&P", value: "5,234.12", change: "+0.87%", trend: "up" },
  { label: "NASDAQ", value: "16,891.50", change: "+1.12%", trend: "up" },
  { label: "USD/KRW", value: "1,387.50", change: "-0.05%", trend: "down" },
] as const;

export function GlobalTickerBar() {
  return (
    <div className="flex items-center gap-4 text-xs">
      {DUMMY_TICKERS.map((t) => (
        <div key={t.label} className="flex items-center gap-1.5">
          <span className="font-medium text-unjong-muted">{t.label}</span>
          <span className="font-semibold text-unjong-primary">{t.value}</span>
          <span
            className={
              t.trend === "up"
                ? "text-unjong-success"
                : "text-unjong-danger"
            }
          >
            {t.change}
          </span>
        </div>
      ))}
      <span className="text-[10px] text-unjong-muted ml-2">
        (Layer 1 실시간 연결 예정)
      </span>
    </div>
  );
}
