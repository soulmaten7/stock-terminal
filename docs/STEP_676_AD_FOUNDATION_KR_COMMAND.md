<!-- 2026-07-10 -->
# STEP 676 — 💰 광고 수익화 기반(KR): 슬롯 인벤토리 코드화 + PC 미리보기 배너 + 어필리에이트 배선(OFF)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** STEP 675 후. 광고는 `AdSlotRow`(광고문의 링크) + `/advertise` 문의폼만 존재. 미리보기(`LensPreview`)엔 "전체 렌즈·근거 보기" CTA(132행)만.
**설계 근거:** `docs/AD_MONETIZATION_PLAYBOOK.md` (§2 슬롯 스키마·§3 어필리에이트·§4 요금표·§5 KR 합법성). **이 STEP 착수 전 플레이북 §5 KR을 먼저 읽을 것.**
**목표:** 광고를 "코드=정의"로 만든다. ① **슬롯 인벤토리·어필리에이트·요금표를 `lib/ads.ts` 단일 소스로 코드화**(값이 아니라 정의). ② **`preview_banner_pc` 슬롯**을 미리보기에 배선(지금 바로 작동 — 팔리면 배너, 안 팔리면 광고문의). ③ **어필리에이트 CTA 배선은 깔되 스위치 OFF**(제휴·법률검토 전 — live인 것만 렌더, 지금은 0개라 아무것도 안 뜸). "배선 보존, 스위치만 OFF" 패턴.
**대상:** 신규 `lib/ads.ts`, `components/toolbox/LensPreview.tsx`.
> ⚠️ **가짜 데이터 금지.** 어필리에이트는 실제 증권사 제휴가 없으므로 **빈 배열 + status 플래그**로 둔다. 가짜 브로커 링크 절대 넣지 말 것(§0-5).

---

## 1. 신규 `lib/ads.ts` — 광고 정의 단일 소스 (플레이북 §2·§3·§4의 코드화)

```ts
// lib/ads.ts
// 광고 수익화 정의 — 값이 아니라 "구조"를 코드화. 상세: docs/AD_MONETIZATION_PLAYBOOK.md
// 전 언어권 공통 슬롯. locale마다 rate card / affiliate만 다르게 채운다.

export type SlotFormat = 'in_feed_native' | 'banner' | 'sponsored_row' | 'text_link';
export type BuyerKind = 'broker_affiliate' | 'display_advertiser' | 'feed_ad';

export interface AdSlot {
  id: string;                 // 전역 고유
  정체: string;
  위치: string;
  format: SlotFormat;
  노출단위: 'per_month' | 'per_impression';
  허용buyer: BuyerKind[];
  표시의무: string[];         // 법정/정책 표시 (Sponsored 등)
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
  label: string;             // 표시명 (증권사 제공 심의필 소재 기준)
  정체: 'referral' | 'brand_ad';
  href: string;              // 추적 링크 (제휴 시 채움)
  status: AffiliateStatus;
  규제게이트: string[];       // §5 KR 조건
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
  월가격: number | null;      // null = 미정(open). locale 통화.
  판매방식: 'monthly_exclusive' | 'rotation';
  status: 'open' | 'sold' | 'paused';
}

export const RATE_CARD: RateCardEntry[] = [
  { slot_id: 'list_inline_10',    locale: 'ko', 월가격: null, 판매방식: 'monthly_exclusive', status: 'open' },
  { slot_id: 'preview_banner_pc', locale: 'ko', 월가격: null, 판매방식: 'monthly_exclusive', status: 'open' },
  { slot_id: 'sheet_native_mobile', locale: 'ko', 월가격: null, 판매방식: 'rotation', status: 'open' },
];

// 특정 슬롯에 지금 게재할 "판매된" 광고 소재 (없으면 null → 광고문의 노출).
// 실제 판매 시 여기(또는 DB) 연결. 지금은 전부 미판매.
export function soldCreative(_slotId: string, _locale = 'ko'): { label: string; href: string } | null {
  return null;
}
```

## 2. `LensPreview.tsx` — PC 미리보기 배너 슬롯 + 어필리에이트 배선(OFF)

현 132~134행("전체 렌즈·근거 보기" Link) **아래, 135행 `</div>` 앞**에 삽입:

```tsx
{/* ── 어필리에이트(증권사) — 큰 파이(T2). live 제휴만 렌더. 지금 0개라 안 뜸. 배선 보존. ── */}
{liveAffiliates('ko').slice(0, 1).map((aff) => (
  <a key={aff.broker_id} href={aff.href} target="_blank" rel="noopener noreferrer nofollow sponsored"
     className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-unjong-border py-2 text-[12px] font-semibold text-unjong-primary hover:border-unjong-accent hover:text-unjong-accent">
    {aff.label} <ExternalLink size={12} />
    <span className="ml-1 rounded bg-unjong-background px-1 text-[9px] text-unjong-muted">광고</span>
  </a>
))}

{/* ── preview_banner_pc 슬롯(T3) — 팔렸으면 배너, 아니면 광고문의. compact(모바일)에선 숨김. ── */}
{!compact && (() => {
  const sold = soldCreative('preview_banner_pc', 'ko');
  return sold ? (
    <a href={sold.href} target="_blank" rel="noopener noreferrer nofollow sponsored"
       className="mt-2 block rounded-lg border border-unjong-border p-2 text-center text-[12px] text-unjong-primary hover:border-unjong-accent">
      {sold.label}
      <span className="ml-1 rounded bg-unjong-background px-1 text-[9px] text-unjong-muted">광고</span>
    </a>
  ) : (
    <Link href="/advertise?slot=preview_banner_pc"
       className="mt-2 flex items-center justify-center gap-0.5 rounded-lg border border-dashed border-unjong-border py-2 text-[11px] text-unjong-muted transition-colors hover:text-unjong-accent">
      광고 문의하기 <ChevronRight size={12} />
    </Link>
  );
})()}
```

상단 import에 추가:
```tsx
import { ExternalLink, ChevronRight } from 'lucide-react'; // 기존 lucide import에 병합(Sparkles 등 옆)
import { liveAffiliates, soldCreative } from '@/lib/ads';
```
> `compact` prop은 이미 있음(모바일 시트용). 모바일은 `preview_banner_pc` 숨기고, 모바일 전용 `sheet_native_mobile`은 **다음 STEP**에서(전면광고 아님·시트 내부 네이티브). 이번엔 배선/타입만.

## 3. 검증 → 커밋
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && npm run dev
```
확인:
- PC에서 종목 hover/선택 → 미리보기 하단 "전체 렌즈·근거 보기" **아래**에 **점선 "광고 문의하기"**(preview_banner_pc, 미판매 상태) 노출. 클릭 → `/advertise?slot=preview_banner_pc`.
- 어필리에이트 CTA는 **안 뜸**(AFFILIATES 빈 배열 — 정상. 제휴 성사 시 켜짐).
- 모바일 시트(compact): preview 배너 안 뜸(정상).
- console.log 금지. tsc 에러 0.
```bash
git add lib/ads.ts components/toolbox/LensPreview.tsx docs/AD_MONETIZATION_PLAYBOOK.md docs/STEP_676_AD_FOUNDATION_KR_COMMAND.md
git commit -m "feat(ads): 광고 수익화 기반 KR — 슬롯 인벤토리/어필리에이트/요금표 코드화(lib/ads.ts) + PC 미리보기 배너 슬롯 배선 + 어필리에이트 스켈레톤(OFF). 설계: AD_MONETIZATION_PLAYBOOK"
git push
```

## 4. 세션 종료 문서 갱신 (4개 헤더 오늘 날짜)
`CLAUDE.md`·`docs/CHANGELOG.md`·`session-context.md`·`docs/NEXT_SESSION_START.md` 헤더 날짜 2026-07-10 + CHANGELOG에 STEP 676 한 줄.

## Cowork에게 보고
- PC 미리보기에 광고문의 슬롯 노출 확인 + tsc/빌드 통과 여부.
→ 다음 후보: (a) `sheet_native_mobile` 모바일 네이티브 슬롯, (b) `/advertise` 문의폼에 slot 종류(preview/list/mobile) 반영, (c) 증권사 제휴 실제 접촉 시작(어필리에이트 status→live), (d) US 등 §5 원장 다음 국가 조사.
