<!-- 2026-06-07 -->
# STEP 211 — 종목 상세 미세 폴리시 (헤더 로고 + 미국 뒤로가기 링크)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_211_COMMAND.md 파일 내용대로 실행해줘`

## 목표
1. 종목 헤더에 **종목 로고**(`StockLogo`) — 랭킹·관심레일과 일관(토스식)
2. 🐛 **미국 종목 '뒤로가기' 링크 수정** — 지금 US도 "한국주식 /kr"로 감 → KR=한국주식/`/kr`, US=마켓/`/market`
3. 좌측 미니차트는 유지(탭 전환해도 보이는 글랜스라 중복 아님)

## 전제 상태
- HEAD: STEP 210 상태
- 변경: `components/stock/StockInfoPanel.tsx`(3곳) 1파일

---

## 작업 1/3 — `StockInfoPanel.tsx` StockLogo import

**찾기:**
```tsx
import { LoadingState } from "@/components/ui/State";
```
**바꾸기:**
```tsx
import { LoadingState } from "@/components/ui/State";
import { StockLogo } from "@/components/ui/StockLogo";
```

## 작업 2/3 — 뒤로가기 링크 (KR/US 분기)

**찾기:**
```tsx
      <Link href="/kr" className="inline-flex items-center gap-1 text-xs text-unjong-muted hover:text-unjong-primary">
        <ArrowLeft size={12} /> 한국주식
      </Link>
```
**바꾸기:**
```tsx
      <Link href={isKr ? "/kr" : "/market"} className="inline-flex items-center gap-1 text-xs text-unjong-muted hover:text-unjong-primary">
        <ArrowLeft size={12} /> {isKr ? "한국주식" : "마켓"}
      </Link>
```

## 작업 3/3 — 종목 헤더에 로고

**찾기:**
```tsx
      <div className="bg-unjong-surface rounded-lg border border-unjong-border p-4">
        <h2 className="text-base font-bold text-unjong-primary">{data.name}</h2>
        <p className="text-xs text-unjong-muted font-mono">{symbol}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
```
**바꾸기:**
```tsx
      <div className="bg-unjong-surface rounded-lg border border-unjong-border p-4">
        <div className="flex items-center gap-2.5">
          <StockLogo code={symbol} name={data.name} size={36} />
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-unjong-primary">{data.name}</h2>
            <p className="font-mono text-xs text-unjong-muted">{symbol}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/stock/StockInfoPanel.tsx && git commit -m "feat(v7): 종목 상세 폴리시 — 헤더 종목 로고 + 미국 뒤로가기 링크 수정 (STEP 211)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 종목 상세 헤더에 **종목 로고**(주요 종목 실로고/아바타) + 이름·코드
- [ ] **미국 종목** 상세에서 뒤로가기가 "마켓"(`/market`)으로, 국내는 "한국주식"(`/kr`)으로
- [ ] 가격·전일대비·색(STEP 208)은 그대로
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 로고는 logo.dev(STEP 184) — 미매핑 종목은 레터 아바타.
- 미국 마켓 라우트가 `/market`(국가 토글) 기준 — US 전용 `/us`로 바꾸고 싶으면 한 줄 조정.
- **문서 TODO**(다음 갱신): STEP 207~211 + 마이그레이션 024·025.
- "순서대로 쭉" 3종(조회수 RPC·팔로워순·종목폴리시) 완료.

---
> STEP 211 = 종목 상세 폴리시. 전제 STEP 210. 다음: 문서 갱신 or 유튜브 팔로워 수집(B). 문서 묶어 갱신.
