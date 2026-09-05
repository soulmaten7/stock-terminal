<!-- 2026-06-27 -->
# STEP 429 — [Phase 2 테스트] 리딩방 광고: 상단 1개 → 인피드(10개마다 1개)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_429_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
STEP 428의 '상단 단일 광고'를 **인피드 광고(리딩방 `AD_EVERY`(=10)개마다 1개)**로 변경 — Coupang/Naver식. 간격은 상수라 쉽게 조절.
- 원칙 유지: **'광고' 라벨 + 금감원 등록 배지 그대로 + 일반 랭킹 순서는 안 바뀜**(광고는 행 사이에 삽입만, 번호 매김은 일반 행만).
- 광고 행은 `SponsoredRoomRow` 컴포넌트로 분리(재사용). 여전히 하드코딩 예시(실제 광고주 아님).

## 전제
- 최신 main + STEP 428 적용분(상단 광고 `<li>`가 존재하는 상태). **`components/toolbox/AdvisorDirectory.tsx` 1파일** → HMR.
- **커밋 보류**. dev 서버 끄지 말 것.

---

## `components/toolbox/AdvisorDirectory.tsx` — 5곳

### (1) `Fragment` import 추가
**찾기:**
```tsx
import { useEffect, useState } from 'react';
```
**바꾸기:**
```tsx
import { Fragment, useEffect, useState } from 'react';
```

### (2) 광고 행 컴포넌트 + 간격 상수 추가 (`roomNameOf` 아래)
**찾기:**
```tsx
function roomNameOf(a: Advisor): string {
  return (a.info_name && a.info_name.trim()) || a.company_name;
}
```
**바꾸기:**
```tsx
function roomNameOf(a: Advisor): string {
  return (a.info_name && a.info_name.trim()) || a.company_name;
}

// 🧪 TEST — 인피드 광고 행(리딩방 N개마다 1개, Coupang/Naver식). 광고라도 사실(금감원 배지)은 안 가림. 실제 광고주 아님 — 추후 DB 연동으로 교체.
const AD_EVERY = 10;
function SponsoredRoomRow() {
  return (
    <li className="flex items-center gap-3 border-b border-b-unjong-border border-l-2 border-l-unjong-accent bg-unjong-accent/[0.06] px-2 py-2.5 ring-1 ring-inset ring-unjong-accent/25">
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span className="shrink-0 rounded bg-unjong-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-unjong-accent">광고</span>
        <Globe size={18} className="shrink-0 text-unjong-muted" />
        <span className="truncate text-sm font-semibold text-unjong-primary">예시 리딩방 (광고 미리보기)</span>
        <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="금감원 등록" />
      </span>
      <a href="#" onClick={(e) => e.preventDefault()} aria-label="바로가기" className="flex shrink-0 items-center rounded-md border border-unjong-border px-2 py-1 text-xs text-unjong-muted">
        <ExternalLink size={12} />
      </a>
    </li>
  );
}
```

### (3) STEP 428의 상단 단일 광고 제거 (인피드로 대체)
**찾기:**
```tsx
            <ul>
              {/* 🧪 TEST — 리딩방 스폰서(광고) 슬롯 예시. 사실 랭킹과 분리된 별도 핀 + '광고' 라벨. 광고라도 금감원 등록 배지는 그대로(형태 확인용, 실제 광고주 아님). */}
              <li className="flex items-center gap-3 border-b border-b-unjong-border border-l-2 border-l-unjong-accent bg-unjong-accent/[0.06] px-2 py-2.5 ring-1 ring-inset ring-unjong-accent/25">
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="shrink-0 rounded bg-unjong-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-unjong-accent">광고</span>
                  <Globe size={18} className="shrink-0 text-unjong-muted" />
                  <span className="truncate text-sm font-semibold text-unjong-primary">예시 리딩방 (광고 미리보기)</span>
                  <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="금감원 등록" />
                </span>
                <a href="#" onClick={(e) => e.preventDefault()} aria-label="바로가기" className="flex shrink-0 items-center rounded-md border border-unjong-border px-2 py-1 text-xs text-unjong-muted">
                  <ExternalLink size={12} />
                </a>
              </li>
              {results.map((a, i) => {
```
**바꾸기:**
```tsx
            <ul>
              {results.map((a, i) => {
```

### (4) 각 행을 Fragment로 감싸 10개마다 광고 삽입
**찾기:**
```tsx
                return (
                  <li
                    key={a.biz_no}
                    className={`group flex items-center gap-3 border-b border-b-unjong-border border-l-2 px-2 py-2.5 transition-colors hover:bg-unjong-background ${
```
**바꾸기:**
```tsx
                return (
                  <Fragment key={a.biz_no}>
                    {i > 0 && i % AD_EVERY === 0 ? <SponsoredRoomRow /> : null}
                    <li
                    className={`group flex items-center gap-3 border-b border-b-unjong-border border-l-2 px-2 py-2.5 transition-colors hover:bg-unjong-background ${
```

### (5) Fragment 닫기 (map 행 끝)
**찾기:**
```tsx
                  </li>
                );
              })}
```
**바꾸기:**
```tsx
                  </li>
                  </Fragment>
                );
              })}
```

---

## 확인 (localhost, 커밋 X)
- 리딩방·검증 탭 → 일반 리딩방 **10개마다 '광고' 행 1개**(금감원 배지 + 바로가기) 삽입. 상단 단독 광고는 사라짐.
- 일반 행 **번호(1·2·3…)는 광고 빼고 정상**(광고는 번호 없음).
- 일반 랭킹 순서·즐겨찾기·신고 그대로.
- 간격 바꾸려면 `AD_EVERY` 숫자만 수정(예: 7, 15).
- 보고 OK면 증권사·리딩방 광고 슬롯 **둘 다 한 번에 커밋**.
