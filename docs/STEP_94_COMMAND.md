<!-- 2026-05-27 -->
# STEP 94 — V3 5섹션 → `/dashboard` 강등 + 루트 `/scalper` 리다이렉트

> **목표**: 운종 3창을 메인 진입점으로. 기존 V3 5섹션 홈은 `/dashboard` 로 이동 (보존). **Layer 0 의 마지막 STEP**.
> **세션**: #25
> **전제**: STEP 93 완료 (`7026306`), 운종 3창 + 헤더·사이드·카드·우측패널 모두 작동
> **참조 스펙**: `docs/PRODUCT_SPEC_V4.md` 섹션 11 (폐기·강등)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_94_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **V3 페이지 보존** — 폐기 아니라 `/dashboard` 로 이동. 기존 사용자가 들어와도 작동
2. **루트 `/` → `/scalper` 자동 리다이렉트** — Layer 0 단순. Layer 1 에서 성향 선택 추가
3. **FloatingChat v3 처리** — root layout 에 있으면 빼서 `/dashboard` 에만 살림 (운종 3창에서는 UnjongSidebar 가 대체)
4. **EconCalendar · ScreenerExpanded** — 이미 별도 페이지면 그대로, 없으면 dashboard 안에서 작동
5. **문서 4종 헤더 갱신** + CHANGELOG + NEXT_SESSION_START 업데이트 (Layer 0 완료 명시)

---

## 작업 1 — 기존 V3 구조 파악

```bash
cd ~/stock-terminal
ls -la app/
cat app/page.tsx | head -30
grep -rn "FloatingChat" --include="*.tsx" --include="*.ts" app components 2>/dev/null
grep -rn "EconCalendar\|ScreenerExpanded" --include="*.tsx" --include="*.ts" app 2>/dev/null | head -10
```

확인할 것:
- `app/page.tsx` (V3 5섹션 홈) 의 import·구조
- `app/dashboard/` 폴더 존재 여부 (있으면 충돌 가능)
- `FloatingChat` 어디서 import 되는지 (root layout vs page)
- `EconCalendar` / `ScreenerExpanded` 가 어떤 페이지에 있는지

---

## 작업 2 — `app/dashboard/page.tsx` 생성 (V3 5섹션 이동)

### 시나리오 A — `app/dashboard/` 폴더 없음 (가장 흔한 경우)

```bash
mkdir -p app/dashboard
```

`app/page.tsx` 의 내용 그대로를 `app/dashboard/page.tsx` 로 복사. 이름·export·import 경로 그대로 유지.

```bash
cp app/page.tsx app/dashboard/page.tsx
```

그 후 `app/dashboard/page.tsx` 의 metadata 만 살짝 수정:
- `title`: "V3 대시보드" 또는 "5섹션 대시보드 (V3 보존)"
- `description`: "기존 V3 5섹션 대시보드. 운종 3창으로 진화하기 전 버전 보존."

### 시나리오 B — `app/dashboard/` 이미 존재
- 기존 dashboard 내용 확인
- 충돌 없으면 그대로 두고, 5섹션 코드만 다른 이름 (예: `app/legacy/page.tsx`) 으로 이동
- Cowork 에게 보고 후 결정

---

## 작업 3 — `app/page.tsx` 를 리다이렉트로 교체

기존 5섹션 코드를 모두 지우고 다음으로 교체:

```tsx
import { redirect } from "next/navigation";

/**
 * 운종 루트 진입
 *
 * Layer 0: 단타창(/scalper) 자동 리다이렉트 (한국 인구 최대)
 * Layer 1 예정: 사용자 성향 선택 기억 + 시간 기반 동적 리다이렉트
 *   - 첫 방문 → 성향 선택 페이지
 *   - 재방문 → localStorage 기반 본인 창 자동 입장
 *   - 비로그인 → 시간 기반 (장중=단타 / 저녁=장타 / 새벽=미장)
 *
 * 기존 V3 5섹션 홈은 /dashboard 에 보존.
 */
export default function RootPage() {
  redirect("/scalper");
}
```

`metadata` 는 추가하지 않음 (redirect 만 함, 메타데이터 무의미).

---

## 작업 4 — FloatingChat 처리

### 4-1. `app/layout.tsx` (root) 에서 FloatingChat import 확인

만약 root layout 에 FloatingChat 이 있으면:
- 운종 3창에서도 표시됨 → UnjongSidebar + FloatingChat 충돌
- **root layout 에서 제거**

```diff
- import { FloatingChat } from "@/components/FloatingChat";
...
- <FloatingChat />
```

### 4-2. `/dashboard` 페이지에서만 FloatingChat 활성화

`app/dashboard/page.tsx` (또는 `app/dashboard/layout.tsx` 신설) 안에서 FloatingChat 사용. V3 호환성 보장.

만약 dashboard 페이지 자체가 컴포넌트 트리에 FloatingChat 을 포함하고 있다면 그대로 두면 됨 (root layout 만 정리).

### 4-3. FloatingChat 컴포넌트 파일 자체는 보존

```bash
# 삭제 X
# ls components/FloatingChat* 정도로 확인만
```

운종이 V3 호환 모드 (`/dashboard`) 를 운영하는 한 보존.

⚠️ **확실하지 않으면 root layout 에서만 import 제거** + dashboard 페이지 안의 FloatingChat 은 그대로. 가장 안전.

---

## 작업 5 — `/dashboard` 진입 시 안내 배너 (선택)

V3 사용자가 `/dashboard` 들어왔을 때 "운종 3창으로 옮겼다" 안내. `app/dashboard/page.tsx` 상단에 추가:

```tsx
// app/dashboard/page.tsx 가 클라이언트 컴포넌트면 직접, 서버 컴포넌트면 다른 방식

// (페이지 컴포넌트 안에서)
<div className="rounded-lg border-2 border-dashed border-unjong-accent bg-unjong-surface p-4 mb-6">
  <p className="text-sm font-semibold text-unjong-primary">
    📦 V3 대시보드 (보존 페이지)
  </p>
  <p className="text-xs text-unjong-muted mt-1">
    운종이 3창 구조로 진화했어요. 새 메인은{" "}
    <a href="/scalper" className="text-unjong-accent underline font-medium">
      단타창
    </a>{" "}
    ·{" "}
    <a href="/longterm" className="text-unjong-accent underline font-medium">
      장타창
    </a>{" "}
    ·{" "}
    <a href="/us" className="text-unjong-accent underline font-medium">
      미국주식창
    </a>
    {" "}으로 진입하세요.
  </p>
</div>
```

이 배너는 V3 5섹션 컴포넌트 위에 한 번만 표시. 페이지 구조에 따라 적절한 위치 선택.

만약 dashboard 페이지가 너무 복잡해서 배너 삽입이 어려우면 **스킵** (필수 아님). Cowork 에게 보고.

---

## 작업 6 — 4개 핵심 문서 헤더 + 본문 업데이트

### 6-1. `CLAUDE.md` 헤더 — 이미 2026-05-27 이면 OK, 아니면 갱신

### 6-2. `docs/CHANGELOG.md` — STEP 94 + Layer 0 완료 블록 추가

기존 CHANGELOG 의 STEP 88 블록 위 (가장 최신) 에:

```markdown
## 2026-05-27 — STEP 94 + Layer 0 완료 (세션 #25)

### V3 → 운종 메인 전환
- `app/page.tsx` 루트를 `/scalper` 자동 리다이렉트로 교체
- 기존 V3 5섹션 홈을 `app/dashboard/page.tsx` 로 이동 (보존)
- 루트 진입 시 단타창이 첫 화면 (Layer 1 에서 성향 선택 추가 예정)
- FloatingChat v3 — root layout 에서 제거, /dashboard 안에서만 작동
- `/dashboard` 상단에 "V3 보존 페이지" 안내 배너 추가

### Layer 0 (틀) 완료 — 8개 STEP 모두 ✅
- STEP 88: 운종 브랜드 정체성
- STEP 89: 3창 라우트 (/scalper /longterm /us)
- STEP 90: 헤더 (로고 · 검색 · 글로벌 티커 · 3창 카드 박스)
- STEP 91: 좌측 사이드 (채팅 + 관심종목)
- STEP 92: 메인 카드 그리드 (창별 3개 더미)
- STEP 93: 우측 사이드패널 (4탭 · 종목 클릭 연결)
- STEP 94: V3 5섹션 → /dashboard 강등 (본 STEP)
- STEP 95: PRODUCT_SPEC_V4 문서

### Layer 1 진입 (다음 세션)
- 카드 7개씩 완성 (단타·장타·미장 각 4개 신규 카드 추가)
- 신규 데이터 연결: VI · 거래원 · 공매도 · 저평가 · 신저가 · M7 · Pre/After · 환율
- Supabase Realtime 채팅 실작동
- 카드 종목 클릭 → 우측 패널 연결 확장
- 글로벌 티커 실시간 (Yahoo + KIS)
```

### 6-3. `session-context.md` — 세션 #25 블록 업데이트

기존 STEP 88 블록을 STEP 94 까지 누적 결과로 확장. Layer 0 완료 명시.

### 6-4. `docs/NEXT_SESSION_START.md` — Layer 1 진입 가이드로 전면 갱신

```markdown
<!-- 2026-05-27 -->
# 운종(雲從) — 다음 세션 시작 가이드

> **Last updated**: 2026-05-27 (Layer 0 완료 · 세션 #25)
> **현재 상태**: Layer 0 (틀) 100% 완료. 다음은 Layer 1 (카드 확장 + 실데이터).

## 1. 즉시 확인할 파일
1. `docs/PRODUCT_SPEC_V4.md` — V4 비전·구조 전체
2. `docs/BRAND_IDENTITY.md` — 운종 브랜드 정체성
3. `CLAUDE.md` — Cowork ↔ Claude Code 역할 분담
4. `session-context.md` — TODO + 세션 #25 결정사항 누적

## 2. Layer 0 완료 상태 ✅
| STEP | 작업 | 커밋 |
|------|------|------|
| 88 | 운종 브랜드 적용 | 892c662 |
| 89 | 3창 라우트 (/scalper /longterm /us) | e8bc870 |
| 90 | 헤더 (로고·검색·티커·3창박스) | 052c439 |
| 91 | 좌측 사이드 (채팅+관심종목) | 13ae6c4 |
| 92 | 메인 카드 그리드 (창별 3개) | ef1bf4d |
| 93 | 우측 사이드패널 (4탭) | 7026306 |
| 94 | V3 → /dashboard 강등 | (이번) |
| 95 | PRODUCT_SPEC_V4 문서 | (세션 시작) |

## 3. 다음 — Layer 1 진입
**카드 7개 완성 + 실데이터 + 채팅 실시간**

### 3-1. 단타창 신규 카드 4개
- VI 발동/해제 (KIS 추가 호출)
- NetBuy + 거래원 매수상위
- 테마 TOP10 (기존 V3 재활용 가능)
- 공매도 잔고 변화 (KRX 크롤링)

### 3-2. 장타창 신규 카드 4개
- 저평가 종목 랭킹 (quant_factors DB 활용)
- 배당 캘린더 + 수익률 TOP
- 52주 신저가 우량주
- 관리종목·투자유의 경고

### 3-3. 미국주식창 신규 카드 4개
- Pre-market / After-hours TOP
- Magnificent 7 모음
- USD/KRW 환율 + 미국 시계
- FOMC·CPI·NFP 캘린더

### 3-4. 채팅 실시간
- Supabase Realtime 연결
- 닉네임 시스템 (Layer 4 의 점수제는 별도)
- 채팅 메시지 영구 저장

### 3-5. 카드 → 우측 패널 연결
- 9개 카드 (Layer 0) + 12개 신규 카드 (Layer 1) 모두 종목 클릭 시 `setSelectedSymbol` 호출
- 우측 패널 자동 변경

### 3-6. 글로벌 티커 실시간
- 헤더의 KOSPI/KOSDAQ/S&P/Nasdaq/USD-KRW 더미 → 실데이터

## 4. Layer 2 이후 로드맵
| Layer | 내용 | 시점 |
|-------|------|------|
| Layer 2 | 광고 허브 + 참고 사이트 + 헤더 사이트 모아보기 | Layer 1 후 |
| Layer 3 | 인증 시스템 (Tier 1·2·3) + 광고주 신청 | 그 다음 |
| Layer 4 | 모더레이션 + 신고 + 닉네임 점수 | 베타 직전 |
| Layer 5 | 통합 종목 검색 + AI 봇 (@운종AI) | 차별화 |
| Layer 6 | unjong.com 도메인 + Vercel 배포 + 광고주 영업 | 출시 |

## 5. 절대 잊지 말 것
- 운종 정체성 = **정보 · 대화 · 허브 · 신뢰** (거래 X)
- 영어판 안 만든다 (국가별 별도)
- 5섹션 대시보드 → /dashboard (보존)
- 채팅창 크기 고정, 스크롤로 보기
- 매매 스타일별 화면 자체가 다름 (단타·장타·미장 페이지 분리 + 우측 패널만 공통)
- WatchlistPanel 외 카드의 종목 클릭 연결은 Layer 1 작업

## 6. 도메인 현황
- ✅ 보유: `onetrillion.app` (메인 도메인 예정)
- ⏸️ 보호용 보류: `unjong.com` ($11.25), `unjong.app` ($9.99) — Layer 6 에서 구매

## 7. 즉시 시작할 작업 (Layer 1 첫 STEP 후보)
- **STEP 96 — Layer 1 — 단타창 신규 카드 4개**: VI · 거래원 · 테마 · 공매도
- 또는 **STEP 96 — Supabase Realtime 채팅 실시간 연결** (기반 인프라 먼저)
- 또는 **STEP 96 — 글로벌 티커 실데이터** (헤더 즉시 효과)

Cowork 과 다음 세션 시작 시 어디부터 갈지 결정.
```

---

## 작업 7 — 빌드 검증 + dev 페이지 동작 확인 (수동)

```bash
cd ~/stock-terminal
npm run build
```

확인 사항:
- 빌드 성공, TypeScript 오류 0
- 라우트 build output 에:
  - `/` (redirect)
  - `/scalper` `/longterm` `/us`
  - `/dashboard`
  - 기타 기존 페이지들 그대로

빌드 출력에 `/` 가 `redirect` 로 표시되거나 동적 라우트로 마킹되는지 확인.

⚠️ **dev 서버 켜지 말 것** — 사용자 환경 침범 방지. 빌드만 검증.

---

## 작업 8 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add app docs/STEP_94_COMMAND.md docs/CHANGELOG.md docs/NEXT_SESSION_START.md session-context.md CLAUDE.md
git status
git commit -m "feat: STEP 94 - V3 → /dashboard 강등 + Layer 0 완료

- app/page.tsx — 단타창(/scalper) 자동 리다이렉트로 교체
- app/dashboard/page.tsx — V3 5섹션 홈 보존 이동
- /dashboard 상단 안내 배너 (V3 보존 페이지)
- FloatingChat v3 — root layout 정리 (/dashboard 에서만 작동)
- docs/CHANGELOG.md — Layer 0 완료 블록 + STEP 88~94 정리
- docs/NEXT_SESSION_START.md — Layer 1 진입 가이드로 전면 갱신
- session-context.md — 세션 #25 누적 결정사항

🏁 Layer 0 (틀) 완료 — 운종 시각적 완성
다음 세션 Layer 1 — 카드 7개 확장 + 실데이터 + Supabase Realtime"
git push
```

---

## 검증 체크리스트

- [ ] `app/page.tsx` 가 `redirect("/scalper")` 만 함
- [ ] `app/dashboard/page.tsx` 에 기존 V3 5섹션 코드 보존
- [ ] `/dashboard` 상단 안내 배너 표시 (스킵 시 보고)
- [ ] FloatingChat 처리 결과 보고 (root layout 제거 / page level 보존 / 그대로 둠 중 어느 패턴인지)
- [ ] `npm run build` 성공
- [ ] 4개 문서 (CLAUDE / CHANGELOG / session-context / NEXT_SESSION_START) 모두 2026-05-27
- [ ] NEXT_SESSION_START 가 Layer 1 안내로 전면 갱신됨
- [ ] git commit + push 완료
- [ ] GitHub 에 커밋 반영

---

## 완료 보고 (Claude Code → 사용자)

```
🏁 STEP 94 + Layer 0 (틀) 완료.

- app/page.tsx → redirect("/scalper")
- app/dashboard/page.tsx — V3 5섹션 보존 [신규 / 기존 dashboard 충돌 회피 결과]
- /dashboard 안내 배너 [추가 / 스킵 — 사유]
- FloatingChat — [root layout 제거 / page level 그대로 / 다른 처리]
- 4개 문서 헤더 + 본문 모두 2026-05-27 로 통일
- CHANGELOG Layer 0 완료 블록 추가
- NEXT_SESSION_START 가 Layer 1 진입 가이드로 전면 갱신
- 빌드 클린, git push 완료 (커밋 [해시])

운종 시각적 완성. 다음 세션 Layer 1 진입 — 카드 12개 신규 + 실데이터 + 채팅 실시간.

브라우저에서 확인:
  http://localhost:3333/ → 자동으로 /scalper 로 이동
  http://localhost:3333/dashboard → V3 보존 페이지 + 안내 배너
  http://localhost:3333/scalper /longterm /us → 운종 3창
```

---

## ⚠️ 주의 사항

1. **V3 페이지 폐기 X** — `/dashboard` 로 보존. 기존 사용자 흔적 남김
2. **dashboard 페이지 import 경로 그대로** — V3 컴포넌트들이 작동해야 함
3. **FloatingChat 폴백 안전** — 확실하지 않으면 root layout 만 정리 + page level 보존
4. **루트 redirect 는 Next.js redirect()** — 서버 컴포넌트에서. middleware 사용 X (단순화)
5. **dev 서버 켜지 말 것** — 빌드만 검증
6. **console.log 남기지 말 것** — CLAUDE.md 규칙
7. **빌드 깨지면 즉시 멈추고 보고** — 강제 진행 금지
8. **세션 #25 동안 4개 문서 헤더 모두 2026-05-27** — STEP 88 에서 한 번 갱신, 이번에 본문도 누적 결정사항 반영
