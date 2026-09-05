<!-- 2026-05-27 -->
# STEP 88 — 운종(雲從) 브랜드 정체성 적용

> **목표**: Stock Terminal → 운종(雲從) 브랜드 전환 + Layer 0 시작점 표시
> **세션**: #25
> **전제**: STEP 87 완료 상태 (`1f46fa3` 또는 그 이후 커밋), 빌드 클린
> **참조 스펙**: `docs/PRODUCT_SPEC_V4.md` (이번 세션에서 이미 작성됨)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에 다음 한 줄 입력:

```
@docs/STEP_88_COMMAND.md 파일 내용대로 실행해줘
```

---

## 작업 1 — package.json 변경

**파일**: `package.json`

```diff
- "name": "stock-platform",
+ "name": "unjong",
```

`version`, `private`, `scripts`, `dependencies` 등 나머지는 그대로.

---

## 작업 2 — Root Layout 메타데이터 변경

**파일**: `app/layout.tsx`

`metadata` 객체를 다음과 같이 변경:

```typescript
export const metadata: Metadata = {
  title: {
    default: "운종(雲從) — 한국 주식 동선의 출발점",
    template: "%s | 운종",
  },
  description:
    "운종(雲從) — 정보·대화·허브·신뢰 4박자 플랫폼. 단타·장타·미국주식 3창 분리. " +
    "모든 자산이 운집(雲集)하는 곳.",
  keywords: [
    "운종",
    "雲從",
    "한국 주식",
    "주식 채팅",
    "단타",
    "장기투자",
    "미국주식",
    "주식 커뮤니티",
    "운종가",
  ],
  authors: [{ name: "운종" }],
  openGraph: {
    title: "운종(雲從)",
    description: "한국 주식 동선의 출발점 — 정보·대화·허브·신뢰",
    type: "website",
    locale: "ko_KR",
  },
};
```

기존 `lang="en"` 이 있으면 `lang="ko"` 로 변경.

---

## 작업 3 — Tailwind 색상 팔레트 추가

**파일**: `tailwind.config.ts` 또는 `tailwind.config.js`

`theme.extend.colors` 에 `unjong` 네임스페이스 추가:

```typescript
theme: {
  extend: {
    colors: {
      unjong: {
        primary: "#0F1E3D",      // 짙은 남색 (먹물·밤하늘)
        accent: "#D4AF37",       // 금색 (부의 상징)
        success: "#0E7C7B",      // 청록색 (수익률 상승)
        danger: "#C73E3A",       // 빨강 (하락 — 글로벌 표준)
        muted: "#6B7280",        // 보조 텍스트
        surface: "#FFFFFF",      // 카드 배경
        background: "#F5F5F7",   // 페이지 배경
        border: "#E5E7EB",       // 구분선
        // 다크모드
        "dark-primary": "#E5E7EB",
        "dark-bg": "#0A0A0A",
        "dark-surface": "#1C1C1E",
        "dark-border": "#2C2C2E",
      },
    },
  },
}
```

기존 색상 클래스는 건드리지 말고, **추가만**.

---

## 작업 4 — 브랜드 로고/타이틀 컴포넌트 확인

`components/` 폴더 안에 다음 파일이 있다면 브랜드 문구 변경:
- `Header.tsx`, `Navbar.tsx`, `Footer.tsx`, `Sidebar.tsx`, `Logo.tsx` 등

**검색 명령** (먼저 실행):
```bash
grep -r "Stock Terminal" --include="*.tsx" --include="*.ts" .
grep -r "stock-platform" --include="*.tsx" --include="*.ts" .
```

발견된 모든 "Stock Terminal" 문자열을 "운종(雲從)" 또는 "운종" 으로 변경.

만약 로고 컴포넌트가 있다면 다음 구조로 변경:
```tsx
<div className="flex items-center gap-2">
  <span className="text-2xl font-bold text-unjong-primary">雲從</span>
  <span className="text-sm text-unjong-muted">UNJONG</span>
</div>
```

로고 이미지는 Layer 0 에서 안 만듦 (Layer 6 디자인 단계).

---

## 작업 5 — docs/BRAND_IDENTITY.md 신설

**파일**: `docs/BRAND_IDENTITY.md` (신규 생성)

```markdown
<!-- 2026-05-27 -->
# 운종(雲從) 브랜드 아이덴티티

## 이름
- 한자: **雲從**
- 한글: **운종**
- 영문: **Unjong**

## 의미
조선 한양 종로의 옛 이름 **운종가(雲從街)** — "구름처럼 사람이 모이는 거리".
조선 시대 모든 정보·자본·뉴스가 흐르던 광장. 운종은 그 정체성을 한국 주식 시장에 부활시킨다.

## 태그라인
- 메인: **"한국 주식 동선의 출발점"**
- 보조: **"모든 자산이 운집(雲集)하는 곳"**
- 영문: **"All assets converge"**

## 정체성 5가지
1. **정보** — 매매 스타일별 카드 큐레이션
2. **대화** — 3창 분리 (단타/장타/미국) 실시간 채팅
3. **허브** — 모든 한국 주식 사이트 출발점
4. **수익** — Partner-Agnostic Lead Gen (광고·계좌·강의)
5. **신뢰** — 인증 시스템 3 Tier

## 색상 팔레트
| 용도 | 색상 | HEX |
|------|------|-----|
| 메인 | 짙은 남색 (먹물·밤하늘) | `#0F1E3D` |
| 포인트 | 금색 (부의 상징) | `#D4AF37` |
| 상승 | 청록색 (수익률) | `#0E7C7B` |
| 하락 | 빨강 (글로벌 표준) | `#C73E3A` |
| 배경 | 연회색 | `#F5F5F7` |
| 카드 | 흰색 | `#FFFFFF` |

## 로고 컨셉 (Layer 6 디자인)
- 雲(운) 한자의 부드러운 곡선 + 從(종) 의 따르는 사람 형상
- 또는 단순히 雲從 한자 + Unjong 영문 병기
- 색상: 짙은 남색 + 금색 포인트

## 도메인 전략
- 메인: `onetrillion.app` (보유 중) — 비전 명시
- 보호용 (Layer 6): `unjong.com` + `unjong.app` 추가 구매 권장 ($21)
- 운종 검색 → unjong.com → onetrillion.app 자동 전환

## 글로벌 전략
- 영어판 만들지 않음
- 국가별 별도 페이지 (Layer 7+, 일본·미국 진출 시)
- 한국 시장 전력 집중

## 참조
- 비전·구조 전체: `docs/PRODUCT_SPEC_V4.md`
- 운종가 역사: 조선 한양 종로, 육의전 (六矣廛) 공식 시장
```

---

## 작업 6 — 4개 핵심 문서 헤더 날짜 업데이트

다음 파일들의 첫 줄 (`<!-- YYYY-MM-DD -->`) 을 **`<!-- 2026-05-27 -->`** 로 변경:

1. `CLAUDE.md`
2. `docs/CHANGELOG.md`
3. `session-context.md`
4. `docs/NEXT_SESSION_START.md`

---

## 작업 7 — docs/CHANGELOG.md 항목 추가

`docs/CHANGELOG.md` 의 가장 위 (헤더 날짜 바로 아래) 에 다음 블록 추가:

```markdown
## 2026-05-27 — STEP 88 (세션 #25)

### Stock Terminal → 운종(雲從) 브랜드 전환
- `package.json` name: `stock-platform` → `unjong`
- `app/layout.tsx` 메타데이터: 운종 브랜드로 통일 (title, description, OpenGraph)
- `tailwind.config.ts` 색상 팔레트 추가 (`unjong.*` 네임스페이스)
- 모든 "Stock Terminal" 문자열 → "운종(雲從)" 으로 일괄 변경
- `docs/BRAND_IDENTITY.md` 신설 — 이름·의미·태그라인·색상·도메인 전략

### V4 비전 문서화
- `docs/PRODUCT_SPEC_V4.md` 신설 — 운종 비전·구조·레이어 로드맵
- `docs/PRODUCT_SPEC_V3.md` 는 히스토리 보존 (덮어쓰지 않음)

### Layer 0 (틀) 시작점
- STEP 88~95 의 8단계 작업 정의 (1~1.5주)
- STEP 89~94: 라우트·헤더·사이드·카드·V3 강등
- STEP 95: PRODUCT_SPEC_V4 (이미 완료)

### 다음 STEP
- STEP 89: 3창 라우트 구조 (`/scalper` `/longterm` `/us`)
```

---

## 작업 8 — session-context.md 세션 #25 블록 추가

`session-context.md` 의 가장 위쪽 (세션 히스토리 영역) 에 다음 블록 추가:

```markdown
## 세션 #25 (2026-05-27) — 운종(雲從) 브랜드 전환 + V4 비전 확정

### 핵심 결정 사항
- **브랜드**: Stock Terminal → **운종(雲從)** 확정
- **도메인**: onetrillion.app (보유) 메인 + unjong.com 보호 (Layer 6)
- **글로벌**: 영어판 X, 국가별 별도 페이지
- **포지셔닝**: 한국 주식 동선의 출발점 (정보·대화·허브·신뢰)

### 화면 구조 (V4)
- 라이브스코어 톤: 메인 카드 65~70% + 좌측 채팅 25% + 헤더 5%
- 3창 분리: 단타창 / 장타창 / 미국주식창 (헤더 고정 + 페이지 라우트)
- 좌측 사이드 (폭 300px): 채팅 위 60% + 입력 10% + 관심종목 아래 30%
- 채팅창 크기 고정, 스크롤로 보기 (확장 X)
- 우측 사이드패널: 종목 클릭 시 차트/호가/체결 (기존 V3 재활용)

### 카드 큐레이션 (창별 7개)
- 단타창: Movers, Volume, VI 발동, NetBuy+거래원, 공시, 테마, 공매도
- 장타창: 공시, 분기실적, 저평가, 배당 TOP, 신저가, 섹터, 관리종목
- 미국주식창: 지수+VIX, Pre/After, M7, Movers, 환율+시계, 뉴스+8-K, FOMC

### 광고 모델 (Layer 2~3)
- Tier 1: 금융위 인증 (증권사)
- Tier 2: 운종 검증 (유튜브·텔레그램·전문가·강의)
- Tier 3: 일반 (회색·AD 라벨)

### 진행 중
- ✅ STEP 88 (운종 브랜드 적용) — 본 세션
- ✅ STEP 95 (PRODUCT_SPEC_V4) — 본 세션
- 다음: STEP 89~94 (라우트·헤더·사이드·카드·V3 강등)
```

---

## 작업 9 — docs/NEXT_SESSION_START.md 업데이트

`docs/NEXT_SESSION_START.md` 의 내용을 다음으로 전면 업데이트 (헤더 날짜 포함):

```markdown
<!-- 2026-05-27 -->
# 운종(雲從) — 다음 세션 시작 가이드

> **Last updated**: 2026-05-27 (STEP 88 완료 · 세션 #25)
> **현재 상태**: 운종 브랜드 적용 완료, V4 비전 문서화 완료, Layer 0 진행 중

## 1. 즉시 확인할 파일
1. `docs/PRODUCT_SPEC_V4.md` — V4 비전·구조 전체
2. `docs/BRAND_IDENTITY.md` — 운종 브랜드 정체성
3. `CLAUDE.md` — Cowork ↔ Claude Code 역할 분담
4. `session-context.md` — TODO + 세션 #25 결정사항

## 2. 다음 STEP — STEP 89
**3창 라우트 구조 생성** (`/scalper` `/longterm` `/us`)
- Next.js App Router `app/(creek)/` 라우트 그룹
- `layout.tsx` 공통 헤더 + 좌측 사이드 + 우측 패널 영역 자리
- 각 `page.tsx` 빈 페이지 (다음 STEP 에서 채움)
- 루트 `/` 는 `/scalper` 자동 리다이렉트

## 3. Layer 0 진행 상황
| STEP | 작업 | 상태 |
|------|------|------|
| 88 | 운종 브랜드 적용 | ✅ 완료 |
| 89 | 3창 라우트 구조 | ⏭️ 다음 |
| 90 | 헤더 고정 영역 | 대기 |
| 91 | 좌측 사이드 (채팅+관심종목) | 대기 |
| 92 | 메인 카드 그리드 (3개씩) | 대기 |
| 93 | 우측 사이드패널 | 대기 |
| 94 | V3 5섹션 → `/dashboard` 강등 | 대기 |
| 95 | PRODUCT_SPEC_V4 | ✅ 완료 |

## 4. 운종 4박자 정체성 (잊지 말 것)
1. **정보** — 매매 스타일별 카드 큐레이션
2. **대화** — 3창 분리 (단타·장타·미국주식) 실시간 채팅
3. **허브** — 모든 한국 주식 사이트 출발점
4. **수익** — Partner-Agnostic Lead Gen
5. **신뢰** — 인증 시스템 3 Tier

## 5. 절대 잊지 말 것
- 거래는 안 한다 (증권사 라이선스 X)
- 영어판 안 만든다 (국가별 별도)
- 5섹션 대시보드 → `/dashboard` 강등 (폐기 X, 보존)
- FloatingChat v3 → 폐기 (좌측 고정 채팅으로 대체)
- 채팅창 크기 고정, 스크롤로 보기 (확장 X)

## 6. 도메인 현황
- ✅ 보유: `onetrillion.app` (메인 도메인 예정)
- ⏸️ 보호용 보류: `unjong.com` ($11.25), `unjong.app` ($9.99) — Layer 6 에서 구매
```

---

## 작업 10 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

**확인 사항**:
- TypeScript 오류 0
- ESLint 비차단 경고만 (set-state-in-effect 63건은 그대로 OK)
- 빌드 성공 (출력 마지막 줄에 `Build completed` 또는 `✓ Compiled successfully`)

빌드 실패 시 에러 메시지 그대로 Cowork 에게 공유, 수정 후 재시도.

---

## 작업 11 — git commit + push

빌드 성공 확인 후:

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add -A
git status
git commit -m "feat: STEP 88 - 운종(雲從) 브랜드 정체성 적용 (세션 #25)

- package.json name: stock-platform → unjong
- app/layout.tsx 메타데이터 운종 브랜드로 통일
- Tailwind 색상 팔레트 추가 (unjong.* 네임스페이스)
- 모든 'Stock Terminal' → '운종(雲從)' 일괄 변경
- docs/BRAND_IDENTITY.md 신설
- docs/PRODUCT_SPEC_V4.md 신설 (V4 비전·구조·레이어)
- 4개 핵심 문서 헤더 날짜 2026-05-27 로 업데이트
- CHANGELOG, session-context, NEXT_SESSION_START 세션 #25 블록 추가

Layer 0 시작점. 다음 STEP 89: 3창 라우트 구조."
git push
```

---

## 검증 체크리스트

작업 끝나면 다음 항목 확인:

- [ ] `package.json` name = `unjong`
- [ ] `app/layout.tsx` metadata.title 에 "운종" 포함
- [ ] `tailwind.config.ts` 에 `unjong.*` 색상 추가
- [ ] 코드에 "Stock Terminal" 문자열 0건 (grep 으로 확인)
- [ ] `docs/BRAND_IDENTITY.md` 존재
- [ ] `docs/PRODUCT_SPEC_V4.md` 존재 (Cowork 이 이미 작성, 확인만)
- [ ] 4개 문서 헤더 모두 `<!-- 2026-05-27 -->`
- [ ] `npm run build` 성공
- [ ] git commit + push 완료
- [ ] GitHub `https://github.com/soulmaten7/stock-terminal` 에 새 커밋 반영

---

## 완료 보고 (Claude Code → 사용자)

작업 끝나면 사용자에게:
```
STEP 88 완료. 운종(雲從) 브랜드 적용 끝.
빌드 클린, git push 완료.
다음 STEP 89 (3창 라우트) 명령서 받을 준비 됨.
```

---

## ⚠️ 주의 사항

1. **기존 V3 컴포넌트는 그대로 둠** — 이 STEP 은 브랜드만. 페이지 라우트 변경 없음. 사용자가 기존 5섹션 페이지 계속 볼 수 있어야 함 (STEP 94 에서 강등 예정)
2. **로고 이미지 파일은 만들지 말 것** — Layer 6 디자인 단계
3. **다크모드 토글 등 새 기능 추가 X** — 색상 팔레트 정의만
4. **빌드 깨지면 즉시 멈추고 Cowork 에게 보고** — 강제 진행 금지
5. **console.log 남기지 말 것** — CLAUDE.md 규칙
