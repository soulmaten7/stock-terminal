<!-- 2026-05-31 -->
# STEP 116 — V3 잔재 정리 1차 (9개 페이지 + 의존 컴포넌트·API)

🔴 **Opus 권장** (의존성 추적 + 다중 파일 삭제)

## 실행 명령어 (Opus)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- 이전 커밋: `18eef3a` (STEP 114 — 운종 V5 1차 리뉴얼)
- V3 잔재 페이지 26개 중 **dashboard 보존** 으로 인해 V3 의존 12개는 유지 필요
- Cowork 의존성 분석 결과:
  - dashboard → HomeClient → widgets → V3 페이지 12개 (briefing/analysis/chat/chart/orderbook/ticks/disclosures/investor-flow/movers/net-buy/news/themes/market-map) **보존**
  - 안전 청소 가능: 9개 페이지 (외부 dashboard·widgets 의존성 없음)

## 목표

| 카테고리 | 항목 | 사유 |
|----------|------|------|
| **OTMarketing 잔재** | ad / advertiser / admin / partner | 운종 ↔ OTMarketing 분리 (2026-04-23) |
| **V3 결제 시스템** | payment / pricing + PaywallModal | 운종은 거래 X, 결제 X. Layer 3 인증 도입 시 새로 |
| **V3 도구** | toolbox | V4 가 대체 |
| **V3 종목/관심종목** | stocks / watchlist | V4 가 검색 + Screener + WatchlistPanel 로 대체 |
| **V3 API endpoints** | api/payment / api/advertiser / api/admin/partners | 위 페이지 의존 |
| **연관 컴포넌트** | PaywallModal / FloatingChat | 삭제할 페이지에서만 사용 |
| **잔여 링크** | Header.tsx 의 /stocks 링크 | 프로필 드롭다운 잔재 |

## 보존 (이번 STEP X — 다음 STEP 117 에서 결정)
- `app/dashboard/` + `components/home/HomeClient.tsx` + `components/widgets/*`
- `app/briefing`, `app/analysis`, `app/chat`, `app/chart`, `app/orderbook`, `app/ticks`, `app/disclosures`, `app/investor-flow`, `app/movers`, `app/net-buy`, `app/news`, `app/themes`, `app/market-map`
- `app/auth`, `app/mypage` (Layer 3 인증 도입 시 활용)
- `app/api/dart/*`, `app/api/kis/*`, `app/api/yahoo/*` 등 V4 API (사용 중)

---

## 작업 디테일

### [1] 페이지 폴더 9개 삭제

```bash
rm -rf app/ad
rm -rf app/advertiser
rm -rf app/admin
rm -rf app/partner
rm -rf app/payment
rm -rf app/pricing
rm -rf app/toolbox
rm -rf app/stocks
rm -rf app/watchlist
```

### [2] V3 결제·광고 API endpoints 삭제

```bash
rm -rf app/api/payment
rm -rf app/api/advertiser
rm -rf app/api/admin
```

### [3] 의존 컴포넌트 삭제 / 수정

#### 3-A. `components/common/PaywallModal.tsx` — 삭제
이 컴포넌트는 app/stocks/page.tsx + components/auth/AuthGuard.tsx 에서만 사용.
app/stocks 삭제 후 AuthGuard 만 정리하면 됨.

```bash
rm -f components/common/PaywallModal.tsx
```

#### 3-B. `components/auth/AuthGuard.tsx` — 수정

기존:
```tsx
import PaywallModal from '@/components/common/PaywallModal';
// ...
return <PaywallModal requiredPlan={minPlan as 'free' | 'premium' | 'pro'} />;
```

변경 (PaywallModal 대신 단순 차단 메시지):
```tsx
// import PaywallModal 줄 삭제

// PaywallModal 사용처 (return <PaywallModal ... />) 변경:
return (
  <div className="flex items-center justify-center min-h-[400px] p-8 text-center">
    <div>
      <p className="text-lg font-semibold text-unjong-primary mb-2">로그인이 필요합니다</p>
      <p className="text-sm text-unjong-muted">이 페이지는 로그인 후 이용 가능합니다.</p>
    </div>
  </div>
);
```

또는 AuthGuard 자체가 V3 잔재라면 통째로 삭제 가능. 단 grep 으로 사용처 확인:
```bash
grep -rn "AuthGuard" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v ".next"
```
- 사용처가 있으면 위 단순화 적용
- 사용처가 0 이면 `rm -f components/auth/AuthGuard.tsx`

#### 3-C. `components/chat/FloatingChat.tsx` — grep 후 결정

```bash
grep -rn "FloatingChat" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v "^./components/chat/FloatingChat.tsx"
```

- 위 결과에서 `app/admin/partners/page.tsx` 만 나오면 (admin 삭제됐으므로) → **FloatingChat 도 삭제**
- `components/home/HomeClient.tsx` 도 사용 중 → **FloatingChat 보존** (dashboard 의존)
- 결과에 따라 결정

### [4] 잔여 링크 정리

#### 4-A. `components/layout/Header.tsx` 의 /stocks 링크 제거

기존 (line 113 부근, 프로필 드롭다운):
```tsx
<Link href="/stocks?tab=watchlist" className="..." onClick={...}>
  관심종목
</Link>
```

→ 이 `<Link>` 통째로 **삭제** (V4 는 우측 WatchlistPanel 사용)

#### 4-B. `components/widgets/WatchlistWidget.tsx` 의 href 정리

기존:
```tsx
href="/watchlist"
```

변경:
```tsx
href="/kr"
```

(WatchlistWidget 은 dashboard 에서 사용 중이라 보존, 단 href 만 V4 라우트로)

### [5] 잔여 import 확인 + 정리

빌드 전 다음 grep 으로 깨진 import 확인:

```bash
echo "=== 삭제한 페이지로의 잔여 참조 ==="
grep -rn "from .*'@/app/ad\|from .*'@/app/advertiser\|from .*'@/app/admin\|from .*'@/app/partner\|from .*'@/app/payment\|from .*'@/app/pricing\|from .*'@/app/toolbox\|from .*'@/app/stocks\|from .*'@/app/watchlist" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v ".next"

echo "=== PaywallModal 잔여 import ==="
grep -rn "PaywallModal" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v ".next"

echo "=== /stocks /watchlist /pricing 링크 잔재 ==="
grep -rn 'href="/stocks\|href="/watchlist\|href="/pricing\|href="/payment\|href="/admin\|href="/advertiser\|href="/partner\|href="/toolbox\|href="/ad' --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v ".next"
```

위 결과가 모두 0건이어야 함. 1건이라도 남으면 해당 파일 정리.

### [6] 빌드 검증

```bash
npm run build 2>&1 | tail -30
```

체크:
- TypeScript 에러 0
- ESLint 에러 0
- 라우트 맵에서 /ad, /advertiser, /admin, /partner, /payment, /pricing, /toolbox, /stocks, /watchlist 사라짐

### [7] 4개 문서 헤더 날짜 갱신

```bash
TODAY=$(date +%Y-%m-%d)
sed -i.bak "1s|.*|<!-- ${TODAY} -->|" CLAUDE.md docs/CHANGELOG.md session-context.md docs/NEXT_SESSION_START.md
rm -f *.bak docs/*.bak
```

### [8] CHANGELOG / session-context / NEXT_SESSION_START 업데이트

- CHANGELOG.md: 세션 #28 또는 #29 블록 추가 (STEP 116 V3 청소 9개 폴더)
- session-context.md: TODO 정리
- NEXT_SESSION_START.md: 현재 상태 갱신 + 다음 STEP 안내 (STEP 118 인증)

### [9] 커밋 + 푸시

```bash
git add -A
git commit -m "chore(cleanup): V3 잔재 1차 청소 — 9개 페이지 + 의존 컴포넌트·API

삭제 페이지 (9개):
- app/ad, app/advertiser, app/admin, app/partner (OTMarketing 잔재 — 2026-04-23 별도 저장소 분리)
- app/payment, app/pricing (V3 결제 시스템 — 운종은 거래 X)
- app/toolbox (V3 도구 — V4 대체)
- app/stocks, app/watchlist (V3 종목/관심종목 — V4 검색·Screener·WatchlistPanel 대체)

삭제 API endpoints:
- app/api/payment, app/api/advertiser, app/api/admin

삭제 컴포넌트:
- components/common/PaywallModal.tsx (app/stocks·AuthGuard 전용)
- components/chat/FloatingChat.tsx (조건부, admin 외 사용처 없을 시)
- components/auth/AuthGuard.tsx 의 PaywallModal 의존성 제거 (단순 차단 메시지)

수정 컴포넌트:
- components/layout/Header.tsx — 프로필 드롭다운의 /stocks?tab=watchlist 링크 제거
- components/widgets/WatchlistWidget.tsx — href '/watchlist' → '/kr'

보존 (dashboard 의존성 — STEP 117 새 홈 결정 시 함께 처리):
- app/dashboard (V3 5섹션 통합 홈)
- components/home/HomeClient.tsx + components/widgets/*
- app/briefing/analysis/chat/chart/orderbook/ticks/disclosures/investor-flow/movers/net-buy/news/themes/market-map

보존 (Layer 3 인증 도입 시 활용):
- app/auth, app/mypage

다음 STEP 118: 카카오 OAuth + Supabase Auth (Layer 3 인증)"
git push
```

## 검증 (사용자 안내용)

푸시 후:

1. `localhost:3333/ad`, `/advertiser`, `/admin`, `/partner`, `/payment`, `/pricing`, `/toolbox`, `/stocks`, `/watchlist` 접속 → **404 Not Found**
2. `/kr`, `/us`, `/screener`, `/calendar`, `/dashboard` → 정상 동작
3. 빌드 라우트 맵에서 위 9개 사라짐
4. 좌측 WatchlistPanel + 우측 검색 + 종목 클릭 → 정상

## 완료 후 보고

- ✅/❌ 빌드 클린 (TypeScript·ESLint 에러 0)
- ✅/❌ grep 결과 잔여 참조 0건
- ✅/❌ 커밋 해시 + 푸시
- 라우트 맵 변화 (몇 개 페이지 줄어듦)

## 잠재 이슈

| 이슈 | 대응 |
|------|------|
| AuthGuard 가 다른 곳에서 사용 중이면 PaywallModal 의존성 정리 필수 | grep 후 단순화 또는 통째 삭제 |
| FloatingChat 이 admin 외 사용처 있으면 보존 | grep 후 결정 |
| WatchlistWidget href 가 V3 라우트라 dashboard 에서 broken | href='/kr' 로 변경 |
| Header.tsx 의 다른 잔여 V3 링크 | grep 으로 추가 확인 |

## 다음 STEP

- **STEP 118** — Layer 3 인증 (카카오 OAuth + Supabase Auth + 닉네임 영구화)
- 이후: STEP 115 (종목 페이지 + 토론), STEP 117 (새 홈), STEP 119 (배포)
