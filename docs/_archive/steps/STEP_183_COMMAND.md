<!-- 2026-06-06 -->
# STEP 183 — 레버리지/인버스 ETF 로고 배지 (2x·3x·인버스, 토스식)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_183_COMMAND.md 파일 내용대로 실행해줘`

## 목표
토스처럼 레버리지/인버스 ETF는 로고 자리에 **2x / 3x / 인버스 배지**. 종목명에서 배수를 파싱(정확).
- 레버리지(2x/3x) → 파란 원, 인버스 → 빨간 원
- 예: "KODEX 레버리지"=2x · "…단일종목레버리지"=2x · "KODEX 200선물인버스2X"=인버스 2x · "KODEX 인버스"=인버스 · "KORU/BULZ(3X)"=3x
- `StockLogo` 한 곳 수정 → 랭킹·관심레일·상세·투자자동향 **전부 적용**

## 전제 상태
- HEAD: STEP 182 적용된 상태
- 변경: `lib/avatar.ts`(leverageInfo 추가) · `components/ui/StockLogo.tsx`(전체 교체)

---

## 작업 1/2 — `lib/avatar.ts` (leverageInfo 함수 추가)

**찾기:**
```ts
/** 주요 종목이면 실로고 URL, 아니면 null(→아바타 폴백) */
export function logoUrl(code: string): string | null {
  const domain = DOMAIN_MAP[code];
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
}
```
**바꾸기:**
```ts
/** 주요 종목이면 실로고 URL, 아니면 null(→아바타 폴백) */
export function logoUrl(code: string): string | null {
  const domain = DOMAIN_MAP[code];
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
}

/** 레버리지/인버스 ETF면 배지 정보(이름 파싱), 아니면 null */
export function leverageInfo(name: string): { label: string; inverse: boolean } | null {
  const n = (name || "").toUpperCase();
  const inverse = /인버스|INVERSE|BEAR/.test(n);
  let mult: string | null = null;
  if (/3\s*X|3배/.test(n)) mult = "3x";
  else if (/2\s*X|2배/.test(n)) mult = "2x";
  else if (/레버리지|LEVERAGE|BULL/.test(n)) mult = "2x";
  if (mult) return { label: mult, inverse };
  if (inverse) return { label: "인", inverse: true };
  return null;
}
```

---

## 작업 2/2 — `components/ui/StockLogo.tsx` (파일 전체 교체)

```tsx
"use client";

import { useState } from "react";
import { avatarBg, avatarChar, logoUrl, leverageInfo } from "@/lib/avatar";

export function StockLogo({ code, name, size = 28 }: { code: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);

  // 1) 레버리지/인버스 ETF → 배수 배지 (토스식)
  const lev = leverageInfo(name);
  if (lev) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
        style={{
          width: size,
          height: size,
          background: lev.inverse ? "#F04452" : "#2563EB",
          fontSize: Math.round(size * 0.36),
        }}
      >
        {lev.label}
      </span>
    );
  }

  // 2) 주요 종목 실로고
  const url = logoUrl(code);
  if (url && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        onError={() => setErr(true)}
        className="shrink-0 rounded-full border border-unjong-border bg-white object-contain"
        style={{ width: size, height: size }}
      />
    );
  }

  // 3) 레터 아바타 폴백
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

> 우선순위: 레버리지/인버스 배지 → 실로고 → 레터 아바타. KODEX 레버리지 같은 종목이 'K' 아바타 대신 파란 '2x' 배지로.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add lib/avatar.ts components/ui/StockLogo.tsx && git commit -m "feat(v7): 레버리지/인버스 ETF 로고 배지 — 이름에서 2x/3x/인버스 파싱(토스식), StockLogo 공통 (STEP 183)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 랭킹에서 **KODEX 레버리지=파란 "2x"**, **인버스 종목=빨간 배지**, KORU/BULZ 등 **"3x"** 로 뜨는지
- [ ] 일반 종목(삼성전자 등)은 실로고, 나머지는 레터 아바타 그대로
- [ ] 관심레일·상세·투자자동향에도 동일 적용
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 파싱은 이름 기반: "레버리지"→2x, "2X/2배"→2x, "3X/3배"→3x, "인버스"→인버스(+배수 있으면 그 배수, 빨강).
- 혹시 레버리지 아닌데 배지 뜨는 종목 있으면 알려주세요 → 정규식 한 줄 보정.
- 미국 인버스/레버리지는 이름에 "BEAR/BULL/3X" 있으면 잡힘(없으면 아바타).

---
> STEP 183 = 레버리지 배지. 전제 STEP 182. 다음: 카테고리 레이아웃 등. 문서 묶어 갱신.
