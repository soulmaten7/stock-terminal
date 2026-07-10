// 광고 수익화 정의 — 값이 아니라 "구조"를 코드화. 상세: docs/AD_MONETIZATION_PLAYBOOK.md
// 전 언어권 공통 슬롯. locale마다 rate card / affiliate만 다르게 채운다.

export type SlotFormat = 'in_feed_native' | 'banner' | 'sponsored_row' | 'text_link';
export type BuyerKind = 'broker_affiliate' | 'display_advertiser' | 'feed_ad';

export interface AdSlot {
  id: string;
  정체: string;
  위치: string;
  format: SlotFormat;
  노출단위: 'per_month' | 'per_impression';
  허용buyer: BuyerKind[];
  표시의무: string[];
  금지: string[];
}

// 전 언어권 공통 표준 슬롯 3종 (플레이북 §2)
export const AD_SLOTS: Record<string, AdSlot> = {
  list_inline_10: {
    id: 'list_inline_10',
    정체: '리스트 10개마다 인피드 광고 행',
    위치: '종목 보드 리스트',
    format: 'in_feed_native',
    노출단위: 'per_month',
    허용buyer: ['display_advertiser', 'feed_ad', 'broker_affiliate'],
    표시의무: ['Sponsored 표기'],
    금지: ['자동재생', '전면광고'],
  },
  preview_banner_pc: {
    id: 'preview_banner_pc',
    정체: '미리보기 패널 배너(PC) — 전체 렌즈보기 아래',
    위치: 'LensPreview 하단',
    format: 'banner',
    노출단위: 'per_month',
    허용buyer: ['display_advertiser', 'broker_affiliate'],
    표시의무: ['Sponsored 표기'],
    금지: ['렌즈 콘텐츠 가림', '전면광고'],
  },
  sheet_native_mobile: {
    id: 'sheet_native_mobile',
    정체: '모바일 종목 시트 네이티브 배너',
    위치: '모바일 종목 시트 내부',
    format: 'in_feed_native',
    노출단위: 'per_month',
    허용buyer: ['display_advertiser', 'broker_affiliate'],
    표시의무: ['Sponsored 표기'],
    금지: ['전면광고(interstitial) — 구글 SEO 페널티·신뢰 훼손'],
  },
};

// ── 어필리에이트 레지스트리 (플레이북 §3) — T2 큰 파이. 지금은 제휴 0개(배선만). ──
export type AffiliateStatus = 'live' | 'contract_pending' | 'legal_review' | 'blocked';
export interface Affiliate {
  broker_id: string;
  locale: string;
  label: string;
  정체: 'referral' | 'brand_ad';
  href: string;
  status: AffiliateStatus;
  규제게이트: string[];
}

// 🅿️ 실제 제휴 전까지 빈 배열. 가짜 링크 금지. 제휴 성사 시 status:'live'로 켠다.
export const AFFILIATES: Affiliate[] = [
  // 예시(주석) — 실제 계약·법률검토 후 아래 형태로 추가:
  // { broker_id:'kr_toss_sec', locale:'ko', label:'토스증권 계좌개설', 정체:'referral',
  //   href:'https://…?ref=trillion', status:'legal_review',
  //   규제게이트:['투자광고 심의필 소재만','권유 문구 금지','Sponsored 표기'] },
];

export function liveAffiliates(locale: string): Affiliate[] {
  return AFFILIATES.filter((a) => a.locale === locale && a.status === 'live');
}

// ── 요금표 (플레이북 §4) — 슬롯당 월 고정. 트래픽 성장 전 고정가. ──
export interface RateCardEntry {
  slot_id: string;
  locale: string;
  월가격: number | null;
  판매방식: 'monthly_exclusive' | 'rotation';
  status: 'open' | 'sold' | 'paused';
}

export const RATE_CARD: RateCardEntry[] = [
  { slot_id: 'list_inline_10',      locale: 'ko', 월가격: null, 판매방식: 'monthly_exclusive', status: 'open' },
  { slot_id: 'preview_banner_pc',   locale: 'ko', 월가격: null, 판매방식: 'monthly_exclusive', status: 'open' },
  { slot_id: 'sheet_native_mobile', locale: 'ko', 월가격: null, 판매방식: 'rotation',          status: 'open' },
];

// 특정 슬롯에 지금 게재할 "판매된" 광고 소재 (없으면 null → 광고문의 노출).
// 실제 판매 시 여기(또는 DB) 연결. 지금은 전부 미판매.
export function soldCreative(_slotId: string, _locale = 'ko'): { label: string; href: string } | null {
  return null;
}

// ── 인리스트 증권사 광고(종목 보드 10개마다) ──────────────────
// 한국은 퍼블리셔 어필리에이트가 없음(자본시장법) → 직접 광고 제휴가 수익 경로.
// 지금은 하우스(데모) 광고: 낮은 순위 증권사를 넣어 인벤토리 시연(프리미엄 자리는 상위사 유료 판매 여지).
// 실제 유료 광고주/제휴 잡히면 이 함수만 교체(또는 DB 연결). 광고는 "거래처 안내"지 "투자권유" 아님(§5 KR).
export interface BoardBrokerAd { name: string; domain: string; url: string; note?: string; cta?: string; }
export function boardBrokerAd(locale: string): BoardBrokerAd | null {
  if (locale === 'ko') return { name: '대신증권', domain: 'daishin.com', url: 'https://www.daishin.com', note: '대신금융그룹(독립계)', cta: '계좌개설' };
  return null; // 다른 언어권: 주식 어필리에이트 활발 → 제휴/광고주 확보 시 채움
}
