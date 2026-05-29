"use client";

import Link from "next/link";
import { ArrowLeft, Filter, ArrowUpDown } from "lucide-react";

type CardMeta = {
  title: string;
  emoji: string;
  subtitle: string;
  windowLabel: string;
};

const CARD_META: Record<string, CardMeta> = {
  "scalper-movers":      { title: "Movers · 등락률 TOP",         emoji: "🚀", subtitle: "실시간 KOSPI/KOSDAQ",      windowLabel: "단타창" },
  "scalper-volume":      { title: "Volume · 거래량 폭증",          emoji: "🔥", subtitle: "전일 대비 3배+",           windowLabel: "단타창" },
  "scalper-vi":          { title: "VI · 변동성 완화장치",           emoji: "🚨", subtitle: "실시간 발동/해제",          windowLabel: "단타창" },
  "scalper-netbuy":      { title: "NetBuy + 거래원",               emoji: "💰", subtitle: "외인·기관 + 매수 1위",      windowLabel: "단타창" },
  "scalper-disclosure":  { title: "공시 · 실시간",                  emoji: "📄", subtitle: "DART",                   windowLabel: "단타창" },
  "scalper-theme":       { title: "테마 TOP10",                    emoji: "🎯", subtitle: "실시간 등락률 순",          windowLabel: "단타창" },
  "scalper-short":       { title: "공매도 잔고 변화",               emoji: "⚠️", subtitle: "숏커버·위험 시그널",        windowLabel: "단타창" },

  "longterm-disclosure": { title: "공시 · 실적·배당·증자",          emoji: "📊", subtitle: "DART",                   windowLabel: "장타창" },
  "longterm-earnings":   { title: "분기 실적 캘린더",               emoji: "📅", subtitle: "발표 예정",               windowLabel: "장타창" },
  "longterm-value":      { title: "저평가 스크리너",                emoji: "💎", subtitle: "PER · PBR · ROE",        windowLabel: "장타창" },
  "longterm-dividend":   { title: "배당 TOP 5",                    emoji: "💰", subtitle: "배당수익률 순위",           windowLabel: "장타창" },
  "longterm-lows":       { title: "52주 신저가",                   emoji: "📉", subtitle: "우량주 신저가",             windowLabel: "장타창" },
  "longterm-sector":     { title: "섹터 히트맵",                   emoji: "🗺️", subtitle: "업종별 등락",             windowLabel: "장타창" },
  "longterm-warning":    { title: "관리·주의 종목",                 emoji: "⚠️", subtitle: "관리종목·투자유의·단기과열", windowLabel: "장타창" },

  "us-indices":          { title: "글로벌 지수",                   emoji: "🌐", subtitle: "S&P/Nasdaq/Dow/VIX",     windowLabel: "미국주식창" },
  "us-prepost":          { title: "Pre-market / After-hours",     emoji: "🌅", subtitle: "시간외 변동 TOP",           windowLabel: "미국주식창" },
  "us-m7":               { title: "Magnificent 7",                emoji: "⭐", subtitle: "미국 7대 대장주",           windowLabel: "미국주식창" },
  "us-movers":           { title: "미국 Movers",                  emoji: "🇺🇸", subtitle: "정규장 TOP",              windowLabel: "미국주식창" },
  "us-forex":            { title: "USD/KRW + 미국 시계",           emoji: "💱", subtitle: "환율 · 시장 상태",          windowLabel: "미국주식창" },
  "us-news":             { title: "미국 뉴스",                     emoji: "📰", subtitle: "Bloomberg/CNBC/WSJ",      windowLabel: "미국주식창" },
  "us-fomc":             { title: "FOMC·CPI·NFP 캘린더",          emoji: "📅", subtitle: "미국 거시 이벤트",           windowLabel: "미국주식창" },
};

const WINDOW_HREF: Record<string, string> = {
  scalper: "/scalper",
  longterm: "/longterm",
  us: "/us",
};

type CardDetailProps = {
  window: "scalper" | "longterm" | "us";
  card: string;
};

export function CardDetail({ window, card }: CardDetailProps) {
  const meta = CARD_META[`${window}-${card}`];

  if (!meta) {
    return (
      <div className="rounded-lg border border-dashed border-unjong-border bg-unjong-surface p-6 text-center">
        <p className="text-sm text-unjong-muted">
          알 수 없는 카드 —{" "}
          <code className="text-unjong-primary">{window}/{card}</code>
        </p>
        <Link
          href={WINDOW_HREF[window] ?? "/scalper"}
          className="mt-2 inline-block text-xs text-unjong-accent hover:underline"
        >
          ← 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 뒤로가기 헤더 */}
      <div className="flex items-center justify-between">
        <Link
          href={WINDOW_HREF[window]}
          className="flex items-center gap-1.5 text-sm text-unjong-muted hover:text-unjong-primary transition-colors"
        >
          <ArrowLeft size={16} />
          <span>{meta.windowLabel}으로</span>
        </Link>
        <span className="text-[10px] text-unjong-muted italic">
          준비 중
        </span>
      </div>

      {/* 카드 타이틀 */}
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-2xl">{meta.emoji}</span>
          <div>
            <h1 className="text-lg font-bold text-unjong-primary">{meta.title}</h1>
            <p className="text-xs text-unjong-muted mt-0.5">{meta.subtitle}</p>
          </div>
        </div>
      </div>

      {/* 필터/정렬 UI placeholder */}
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-unjong-muted">
            <Filter size={12} />
            <span>필터</span>
            <span className="text-unjong-primary font-medium">전체</span>
            <span className="text-[10px]">·</span>
            <span className="hover:text-unjong-primary cursor-pointer">KOSPI</span>
            <span className="text-[10px]">·</span>
            <span className="hover:text-unjong-primary cursor-pointer">KOSDAQ</span>
            <span className="text-[10px]">·</span>
            <span className="hover:text-unjong-primary cursor-pointer">시총 1조+</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-unjong-muted ml-auto">
            <ArrowUpDown size={12} />
            <span>정렬</span>
            <span className="text-unjong-primary font-medium">등락률 ↓</span>
          </div>
        </div>
        <p className="text-[10px] text-unjong-muted italic mt-2 pl-4">
          준비 중
        </p>
      </div>

      {/* 데이터 영역 — Layer 1 안내 */}
      <div className="rounded-lg border-2 border-dashed border-unjong-border bg-unjong-surface p-8 text-center">
        <p className="text-2xl mb-2">{meta.emoji}</p>
        <p className="text-sm font-medium text-unjong-primary mb-1">
          {meta.title} 풀 리스트
        </p>
        <p className="text-xs text-unjong-muted leading-relaxed max-w-md mx-auto">
          Layer 1 에서 30~100건+ 풀 데이터 + 필터/정렬 + 검색 + 시간별 추이 연결.
          <br />
          현재 메인 카드 (요약 5건) 는{" "}
          <Link href={WINDOW_HREF[window]} className="text-unjong-accent hover:underline">
            {meta.windowLabel}
          </Link>
          {" "}에서 확인.
        </p>
      </div>
    </div>
  );
}
