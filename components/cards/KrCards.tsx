"use client";

import {
  MoversCard,
  VolumeCard,
  NetBuyBrokerCard,
  ScalperDisclosureCard,
} from "./ScalperCards";
import { LongtermDisclosureCard } from "./LongtermCards";

/**
 * 한국주식창 (/kr) — 정확도 보장 5개 카드
 *  1. 🚀 Movers · 등락률 TOP        (KIS ranking)
 *  2. 🔥 Volume · 거래량 폭증        (KIS volume-rank)
 *  3. 💰 NetBuy · 외인/기관 순매수   (KIS investor-rank)
 *  4. 📄 단타 공시 (당일)            (DART)
 *  5. 📊 장타 공시 (실적·배당·증자)   (DART 필터)
 */
export function KrCards() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <MoversCard />
      <VolumeCard />
      <NetBuyBrokerCard />
      <ScalperDisclosureCard />
      <LongtermDisclosureCard />
    </div>
  );
}
