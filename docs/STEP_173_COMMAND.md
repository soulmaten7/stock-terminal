<!-- 2026-06-06 -->
# STEP 173 — #3 종목 실로고 (주요 종목 favicon + 아바타 폴백)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_173_COMMAND.md 파일 내용대로 실행해줘`

## 목표
종목 로고를 **레터 아바타 → 실제 로고(주요 종목)**. 키 없이 즉시: 주요 종목을 회사 도메인에 매핑해 **Google favicon(실로고)** 표시, 매핑 안 된 종목·로딩 실패 시 **레터 아바타 폴백**.
- `lib/avatar.ts`: 도메인 맵 + `logoUrl()` 추가 (avatarBg/avatarChar 유지)
- 신규 `components/ui/StockLogo.tsx`: 로고 `<img>` + 실패 시 아바타 (재사용)
- 관심 레일(WatchlistPanel)·랭킹(MarketClient) 둘 다 `StockLogo`로 교체

## 전제 상태
- HEAD: `a997964`(STEP 171) 이상 + STEP 172(랭킹 아바타) 적용됨
- 변경: `lib/avatar.ts`(교체) · 신규 `components/ui/StockLogo.tsx` · `components/sidebar/WatchlistPanel.tsx`(2곳) · `components/market/MarketClient.tsx`(2곳)

---

## 작업 1/4 — `lib/avatar.ts` (파일 전체 교체)

```ts
// 종목 아바타/로고 유틸 — 주요 종목은 실로고(favicon), 나머지는 레터 아바타 폴백.

const PALETTE = [
  "#FEE2E2", "#FEF3C7", "#D1FAE5", "#DBEAFE",
  "#EDE9FE", "#FCE7F3", "#E0F2FE", "#FEF9C3",
  "#FFE4E6", "#ECFCCB",
];

export function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function avatarChar(name: string): string {
  const t = (name || "").trim();
  return t ? t.charAt(0).toUpperCase() : "?";
}

// 종목코드(KR 6자리)/티커(US) → 회사 도메인. 주요 종목만(나머지는 아바타 폴백).
// 로고가 이상하게 나오는 종목은 이 맵의 도메인만 고치면 됨.
const DOMAIN_MAP: Record<string, string> = {
  // ── 국내 ──
  "005930": "samsung.com",          // 삼성전자
  "005935": "samsung.com",          // 삼성전자우
  "000660": "skhynix.com",          // SK하이닉스
  "035420": "navercorp.com",        // NAVER
  "035720": "kakaocorp.com",        // 카카오
  "005380": "hyundai.com",          // 현대차
  "000270": "kia.com",              // 기아
  "066570": "lge.co.kr",            // LG전자
  "068270": "celltrion.com",        // 셀트리온
  "207940": "samsungbiologics.com", // 삼성바이오로직스
  "006400": "samsungsdi.com",       // 삼성SDI
  "051910": "lgchem.com",           // LG화학
  "373220": "lgensol.com",          // LG에너지솔루션
  "015760": "kepco.co.kr",          // 한국전력
  "017670": "sktelecom.com",        // SK텔레콤
  "030200": "kt.com",               // KT
  "105560": "kbfg.com",             // KB금융
  "055550": "shinhangroup.com",     // 신한지주
  "086790": "hanafn.com",           // 하나금융지주
  "000810": "samsungfire.com",      // 삼성화재
  // ── 미국 ──
  AAPL: "apple.com",
  TSLA: "tesla.com",
  NVDA: "nvidia.com",
  MSFT: "microsoft.com",
  GOOGL: "google.com",
  AMZN: "amazon.com",
  META: "meta.com",
  NFLX: "netflix.com",
};

/** 주요 종목이면 실로고 URL, 아니면 null(→아바타 폴백) */
export function logoUrl(code: string): string | null {
  const domain = DOMAIN_MAP[code];
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
}
```

---

## 작업 2/4 — 신규 파일 `components/ui/StockLogo.tsx`

```tsx
"use client";

import { useState } from "react";
import { avatarBg, avatarChar, logoUrl } from "@/lib/avatar";

// 종목 로고: 주요 종목은 실로고, 없거나 로딩 실패 시 레터 아바타.
export function StockLogo({ code, name, size = 28 }: { code: string; name: string; size?: number }) {
  const url = logoUrl(code);
  const [err, setErr] = useState(false);

  if (url && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        onError={() => setErr(true)}
        className="shrink-0 rounded-full object-contain bg-white border border-unjong-border"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-unjong-primary"
      style={{ width: size, height: size, background: avatarBg(name), fontSize: Math.round(size * 0.4) }}
    >
      {avatarChar(name)}
    </span>
  );
}
```

---

## 작업 3/4 — `components/sidebar/WatchlistPanel.tsx` (2곳)

### ① import 교체
**찾기:**
```tsx
import { avatarBg, avatarChar } from "@/lib/avatar";
```
**바꾸기:**
```tsx
import { StockLogo } from "@/components/ui/StockLogo";
```

### ② 아바타 span → StockLogo
**찾기:**
```tsx
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-unjong-primary" style={{ background: avatarBg(item.name) }}>
                    {avatarChar(item.name)}
                  </span>
```
**바꾸기:**
```tsx
                  <StockLogo code={item.code} name={item.name} size={28} />
```

---

## 작업 4/4 — `components/market/MarketClient.tsx` (2곳)

### ① import 교체
**찾기:**
```tsx
import { avatarBg, avatarChar } from "@/lib/avatar";
```
**바꾸기:**
```tsx
import { StockLogo } from "@/components/ui/StockLogo";
```

### ② 아바타 span → StockLogo
**찾기:**
```tsx
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-unjong-primary"
                              style={{ background: avatarBg(r.name) }}
                            >
                              {avatarChar(r.name)}
                            </span>
```
**바꾸기:**
```tsx
                            <StockLogo code={r.symbol} name={r.name} size={28} />
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add lib/avatar.ts components/ui/StockLogo.tsx components/sidebar/WatchlistPanel.tsx components/market/MarketClient.tsx && git commit -m "feat(v7): 종목 실로고 — 주요 종목 도메인 favicon + 아바타 폴백(StockLogo, 홈·마켓·관심 공통) (STEP 173)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 관심 레일·랭킹에서 **삼성전자·SK하이닉스·카카오·NAVER·Apple·Tesla·NVIDIA 등 = 실제 로고**, KODEX 등 매핑 안 된 건 **레터 아바타**로 보이는지
- [ ] 로고 로딩 실패해도 아바타로 자연스럽게 폴백되는지(깨진 이미지 X)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- **로고가 이상한(엉뚱한/지구본) 종목** 있으면 알려주세요 → `lib/avatar.ts` `DOMAIN_MAP` 도메인 한 줄만 고치면 됨.
- favicon이라 화질이 아주 높진 않음(28px엔 충분). 더 깨끗하게 원하면 **logo.dev(무료 키)** 로 `logoUrl()` URL만 교체.
- ETF(KODEX·TIGER 등)는 발행사 로고 매핑 복잡 → 아바타 유지(추후 선택).
- `<img>` 사용(외부 favicon) → next/image 도메인 설정 불필요. eslint 주석으로 경고 억제.

---
> STEP 173 = #3 실로고(주요 종목). 전제 `a997964`+STEP172. 다음: #2 hover 상세 · #4 카테고리 탭. 문서 묶어 갱신.
