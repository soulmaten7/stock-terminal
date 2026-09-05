<!-- 2026-05-31 -->
# STEP 119 — Vercel 배포 + unjong.com 도메인 + 출시

🟢 **Sonnet 가능** (코드 변경 적음 — README + .env.example + next.config 점검)

## 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

## 전제 상태
- 이전 커밋: `cbe50a9` (STEP 117 새 홈 + V3 2차 청소)
- 운종 V5 페이지 구조 확정: `/`, `/kr`, `/us`, `/stock/[code]`, `/screener`, `/calendar`, `/auth/*`, `/mypage`
- 빌드 클린, DB 마이그레이션 005·014·015·016·017 적용 완료
- 카카오 OAuth = 코드만 적용, 활성화 X (사용자 작업 추후)
- 도메인 가능 (Vercel MCP 확인):
  - **unjong.com** $11.25/년 ⭐ (사용자 보류 결정)
  - unjong.app $9.99/년
  - unjong.io $37.99/년
  - unjong.co $17.99/년

## 목표

| 영역 | 변경 |
|------|------|
| **README.md** | 운종 V5 정체성·페이지 구조·기능 소개로 전면 갱신 |
| **.env.example** | 배포 환경변수 가이드 (KIS·DART·Yahoo·Supabase·Kakao) |
| **next.config.ts** | redirect·images.domains·환경변수·robots 점검 |
| **vercel.json** | (필요 시) Vercel 빌드·redirect 설정 |
| **robots.txt + sitemap** | SEO 기초 |
| **public/favicon** | 운종 favicon (현재 그대로 유지 가능) |

## ⚠️ 사용자 (Jang Eun) 직접 작업 필요

Claude Code 가 할 수 없는 작업 — 사용자 직접:

### 사용자 작업 1 — Vercel 가입 + 프로젝트 연결

1. https://vercel.com/signup → GitHub 로그인 (soulmaten7 계정)
2. **Add New → Project**
3. **Import Git Repository → soulmaten7/stock-terminal** 선택
4. **Framework Preset**: Next.js 자동 인식
5. **Project Name**: `unjong` (또는 원하는 이름)
6. **Environment Variables** 입력 (사용자 작업 2 에서 디테일)
7. **Deploy** 클릭

### 사용자 작업 2 — 환경변수 입력 (Vercel Dashboard)

⚠️ **시크릿은 .env.local 에서 복사 — 이 명령서에 평문 X**

`.env.local` 의 키들을 Vercel Dashboard 의 **Environment Variables** 에 입력:

| 변수 | 출처 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | .env.local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | .env.local |
| `SUPABASE_SERVICE_ROLE_KEY` | .env.local (서버 사이드 전용) |
| `DATABASE_URL` | .env.local |
| `SUPABASE_ACCESS_TOKEN` | .env.local (Management API PAT) |
| `SUPABASE_PROJECT_REF` | qxkmwlkchyxfzxbonhtj |
| `DART_API_KEY` | .env.local |
| `FRED_API_KEY` | .env.local |
| `SEC_USER_AGENT` | "Unjong soulmaten7@gmail.com" 형식 |
| `KIS_APP_KEY` | .env.local |
| `KIS_APP_SECRET` | .env.local |
| `KIS_ACCOUNT_NO` | .env.local |
| `KIS_ACCOUNT_PROD` | `01` |
| `KIS_BASE_URL` | `https://openapi.koreainvestment.com:9443` |
| `KIS_RATE_LIMIT_MS` | `60` |
| `OPENAI_API_KEY` | .env.local (선택) |

⚠️ 모든 변수 **Production · Preview · Development** 3가지 환경 모두 체크.
⚠️ **이 명령서에 실제 키 값 절대 적지 X** (GitHub Push Protection 이 차단함).

### 사용자 작업 3 — unjong.com 도메인 구매

**옵션 A — Vercel 에서 직접 구매 (추천, 자동 연결)**:
1. Vercel Project → Settings → **Domains**
2. **Add Domain → unjong.com** 입력
3. **Buy** 클릭 → $11.25 결제
4. DNS 자동 설정 + SSL 자동 발급 (~5분)

**옵션 B — Namecheap/GoDaddy 등 외부 구매**:
1. Namecheap 등에서 `unjong.com` 구매
2. Vercel Project → Settings → Domains → Add Domain
3. DNS 안내 (A record `76.76.21.21` 또는 CNAME `cname.vercel-dns.com`)
4. SSL 자동

→ **옵션 A 가 가장 단순**. Vercel 자체 도메인 관리.

### 사용자 작업 4 (선택) — 카카오 OAuth 활성화

도메인 확정 후 STEP 118 의 카카오 활성화 진행:

1. **카카오 Developers 콘솔** → 운종 앱:
   - 사이트 도메인 추가: `https://unjong.com`, `https://www.unjong.com`
2. **Supabase Dashboard** → Auth → Providers → Kakao ON + REST API 키 입력

---

## 작업 디테일 (Claude Code 가 할 일)

### [1] README.md — 운종 V5 소개로 전면 갱신

기존 README 가 V3/V4 시절 stock-terminal 소개일 가능성. 운종 V5 정체성으로 새로 작성:

```markdown
# 운종 (UNJONG)

> 한국 주식 동선의 출발점 — 정보·대화·허브·신뢰

운종은 한국 주식 사용자를 위한 통합 정보·커뮤니티 플랫폼입니다.
가격을 빠르게 확인하고, 다른 트레이더와 대화하고, 신뢰할 만한 출처로 이동하는 출발점.

## 핵심 기능

- 🔍 **빠른 종목 검색** — 2,780개 종목 자동완성
- 📈 **실시간 시세** — KIS Developer API (한투 OpenAPI)
- 💬 **종목별 토론** — 좋아요 정렬 · 신고 자동 모더레이션
- ⚡ **실시간 채팅** — 종목별 / 전체 채팅
- ⭐ **관심 종목** — 멀티 기기 동기화 (로그인 시)
- 📊 **시장 핫 이슈** — Movers · Volume · NetBuy · 공시 (DART)
- 🌙 **미국 주식** — Yahoo Finance · S&P · Nasdaq · M7

## 페이지 구조

| 라우트 | 역할 |
|--------|------|
| `/` | 새 홈 — 시장 핫 이슈 + HOT 토론 + 관심종목 |
| `/kr` | 한국주식 카드 5개 |
| `/us` | 미국주식 카드 4개 |
| `/stock/[code]` | 종목 페이지 — 좌 종목정보 · 중 토론 · 우 실시간 채팅 |
| `/screener` | 종목 발굴 |
| `/calendar` | 경제 캘린더 |
| `/auth/login` | 카카오 로그인 |
| `/mypage` | 마이페이지 |

## 데이터 소스

- **KIS Developer (한국투자증권)** — 종목 시세·호가·체결·차트·랭킹
- **DART Open API** — 한국 공시
- **Yahoo Finance** — 미국 주식·환율
- **Supabase** — 채팅·토론·사용자 관리

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Zustand (상태 관리)
- Supabase (PostgreSQL + Realtime + Auth)
- TradingView lightweight-charts (차트)
- Vercel (배포)

## 운종 정체성

- ✅ 정보 (실시간 시세·공시·뉴스)
- ✅ 대화 (정제된 채팅·토론)
- ✅ 허브 (외부 정확한 출처로 동선 안내)
- ✅ 신뢰 (Tier 인증 + 모더레이션)
- ❌ 거래 X (증권사 라이선스 없음, 매매는 외부 증권사로)

## 로컬 개발

```bash
git clone https://github.com/soulmaten7/stock-terminal.git
cd stock-terminal
npm install
cp .env.example .env.local  # 환경변수 입력
npm run dev
```

## 라이선스

(추가 결정 필요 — MIT / Proprietary / 등)
```

### [2] .env.example — 환경변수 가이드 생성

루트에 `.env.example` 신규:

```
# 운종 V5 환경변수 가이드
# 실제 값은 .env.local 에 (절대 git push X)

# === Supabase (운종 전용 프로젝트, 구 stock-platform 명) ===
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
SUPABASE_ACCESS_TOKEN=sbp_...
SUPABASE_PROJECT_REF=YOUR_PROJECT

# === 한국투자증권 KIS Developer (실전투자) ===
KIS_APP_KEY=YOUR_KIS_APP_KEY
KIS_APP_SECRET=YOUR_KIS_APP_SECRET
KIS_ACCOUNT_NO=YOUR_ACCOUNT
KIS_ACCOUNT_PROD=01
KIS_BASE_URL=https://openapi.koreainvestment.com:9443
KIS_RATE_LIMIT_MS=60

# === DART (전자공시) ===
DART_API_KEY=YOUR_DART_KEY

# === FRED (미국 경제 지표) ===
FRED_API_KEY=YOUR_FRED_KEY

# === SEC EDGAR ===
SEC_USER_AGENT=Unjong contact@example.com

# === OpenAI (선택) ===
OPENAI_API_KEY=sk-...

# === 카카오 OAuth (Supabase Auth Provider 에서 설정) ===
# Kakao 키는 Supabase Dashboard 의 Auth Provider 에 직접 입력
# 코드에서 사용하지 않음 — Supabase 가 자동 처리
```

### [3] next.config.ts 점검

기존 redirect 확인 + 필요 시 도메인 redirect 추가:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // STEP 114 redirect 유지
      { source: "/scalper", destination: "/kr", permanent: true },
      { source: "/scalper/:path*", destination: "/kr/:path*", permanent: true },
      { source: "/longterm", destination: "/kr", permanent: true },
      { source: "/longterm/:path*", destination: "/kr/:path*", permanent: true },
      // www → apex
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.unjong.com" }],
        destination: "https://unjong.com/:path*",
        permanent: true,
      },
    ];
  },
  // 외부 이미지 (카카오 프로필 등)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "k.kakaocdn.net" },
      { protocol: "https", hostname: "img1.kakaocdn.net" },
      { protocol: "https", hostname: "qxkmwlkchyxfzxbonhtj.supabase.co" },
    ],
  },
};

export default nextConfig;
```

### [4] public/robots.txt — SEO 기초

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /mypage

Sitemap: https://unjong.com/sitemap.xml
```

### [5] app/sitemap.ts — 동적 사이트맵

```ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://unjong.com";
  return [
    { url: `${base}/`, lastModified: new Date(), priority: 1.0 },
    { url: `${base}/kr`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/us`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/screener`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/calendar`, lastModified: new Date(), priority: 0.7 },
  ];
}
```

### [6] .gitignore 점검

`.env.local`, `.next`, `node_modules` 등이 무시되는지 확인. 추가 항목:
```
# Vercel
.vercel
```

### [7] 빌드 검증

```bash
npm run build 2>&1 | tail -15
```

### [8] 4개 문서 헤더 갱신 + 로그

CHANGELOG.md / session-context.md / NEXT_SESSION_START.md / CLAUDE.md 헤더 날짜 갱신.

### [9] 커밋 + 푸시

```bash
git add -A
git commit -m "docs(release): 운종 V5 출시 준비 — README·.env.example·sitemap·robots

신규/수정:
- README.md — 운종 V5 정체성·페이지 구조·기능 소개로 전면 재작성
- .env.example — 배포 환경변수 가이드 (Supabase·KIS·DART·Yahoo·Kakao)
- next.config.ts — www → apex redirect 추가, images.remotePatterns (카카오 프로필·Supabase)
- public/robots.txt — SEO 기초 (/api, /auth, /mypage 차단)
- app/sitemap.ts — 동적 사이트맵 (/, /kr, /us, /screener, /calendar)
- .gitignore — .vercel 추가

운종 V5 페이지 구조 최종:
- / : 새 홈 (출발점)
- /kr : 한국주식 5카드
- /us : 미국주식 4카드
- /stock/[code] : 종목 페이지 (정보·토론·채팅)
- /screener : 종목발굴
- /calendar : 경제 캘린더
- /auth/* : 카카오 OAuth (활성화 추후)
- /mypage : 마이페이지

사용자 직접 작업:
1. Vercel 가입 + soulmaten7/stock-terminal import
2. Environment Variables 입력 (.env.local 그대로)
3. unjong.com 도메인 구매 ($11.25) + DNS 자동
4. 카카오 OAuth 도메인 추가 (배포 후) + Supabase Kakao Provider ON"
git push
```

## 검증 (사용자 안내용)

푸시 + Vercel 배포 + 도메인 + 카카오 활성화 후:

1. `https://unjong.com/` → 운종 새 홈 정상
2. `https://unjong.com/kr`, `/us`, `/stock/005930` 등 정상
3. `https://unjong.com/sitemap.xml` → 사이트맵 노출
4. `https://unjong.com/robots.txt` → 검색 엔진 가이드 노출
5. `https://www.unjong.com` → `https://unjong.com` 자동 redirect
6. 카카오 로그인 → 정상 진입
7. 좌측 채팅 + 우측 관심종목 + 카드 4종 + HOT 토론 모듈 정상

## 완료 후 보고

- ✅/❌ 빌드 클린
- ✅/❌ README V5 갱신
- ✅/❌ .env.example 생성
- ✅/❌ sitemap·robots 추가
- ✅/❌ next.config redirect/images 점검
- ✅/❌ 커밋 + 푸시
- ⚠️ Vercel·도메인·카카오 활성화 = 사용자 직접

## 출시 후 후속

| 항목 | 우선순위 |
|------|---------|
| 토론 좋아요·신고·댓글 onClick 구현 | 높음 |
| 미국 주식 종목 정보 (Yahoo) StockInfoPanel 통합 | 중간 |
| 종목 페이지 차트 영역 (lightweight-charts inline) | 중간 |
| 모바일 반응형 (< 1024px) | 높음 |
| 카카오 도메인 추가 + Supabase Kakao Provider | 사용자 |
| 자체 글로벌 티커 (TradingView 로고 제거) | 낮음 |
| 분석·뉴스 매핑 (네이버 검색 API) | 중간 |
| Tier 인증 시스템 (광고주·전문가) | 추후 |
| 상품·리딩방 평가 | 추후 |

## 운종 V5 출시 — 끝

이 STEP 완료 시 운종 V5 가 실제 인터넷에 배포된 상태가 됩니다.
사용자가 unjong.com 도메인 구매 + 카카오 활성화까지 마치면 완전한 출시.
