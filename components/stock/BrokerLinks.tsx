"use client";

type Broker = { name: string; url: (code: string) => string; deep?: boolean };

// 도메인: KB·한투·신한 검색 확인 / 토스·키움·미래에셋·삼성·NH 공식 도메인
const BROKERS: Broker[] = [
  { name: "토스증권", url: (c) => `https://tossinvest.com/stocks/${c}`, deep: true },
  { name: "키움증권", url: () => "https://www.kiwoom.com" },
  { name: "미래에셋증권", url: () => "https://securities.miraeasset.com" },
  { name: "삼성증권", url: () => "https://www.samsungpop.com" },
  { name: "NH투자증권", url: () => "https://www.nhqv.com" },
  { name: "KB증권", url: () => "https://www.kbsec.com" },
  { name: "한국투자증권", url: () => "https://securities.koreainvestment.com" },
  { name: "신한투자증권", url: () => "https://www.shinhansec.com" },
];

export default function BrokerLinks({ code }: { code: string }) {
  if (!/^\d{6}$/.test(code)) return null; // 국내 종목/ETF만

  return (
    <section className="mt-3 rounded-2xl border border-unjong-border bg-unjong-surface p-4 shadow-soft">
      <h3 className="text-sm font-bold text-unjong-primary">어디서 거래할까</h3>
      <p className="mt-0.5 text-[11px] leading-relaxed text-unjong-muted">
        ETF·주식은 어느 증권사에서나 거래돼요. 토스는 종목 바로가기, 나머지는 해당 증권사에서 코드{" "}
        <b className="text-unjong-primary">{code}</b> 검색.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {BROKERS.map((b) => (
          <a
            key={b.name}
            href={b.url(code)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border border-unjong-border px-3 py-2 text-xs font-medium text-unjong-primary transition-colors hover:border-unjong-accent hover:bg-unjong-background"
          >
            {b.name}
            <span className="text-unjong-muted">{b.deep ? "바로가기 →" : "→"}</span>
          </a>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-unjong-muted">운종은 정보·동선만 안내해요(거래 중개 X).</p>
    </section>
  );
}
