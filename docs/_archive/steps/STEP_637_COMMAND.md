<!-- 2026-07-07 -->
# STEP 637 — SEO ③ 홈 구조화 데이터 (Organization + WebSite)

> **문제**: 홈에 사이트 정체성을 알리는 구조화 데이터(JSON-LD)가 없어 구글이 "이 사이트=Trillion(트릴리언)"이라는 엔티티를 명확히 인식하지 못함.
>
> **해결**: 홈(`app/page.tsx`·서버 컴포넌트)에 JSON-LD 추가.
> - **Organization** — Trillion / 트릴리언 / 원트릴리언(별칭), url, 로고(icon.svg).
> - **WebSite** — 사이트명·설명·발행처(Organization) 연결·언어 ko-KR.
> - **SearchAction은 넣지 않음** — 종목 검색 *결과 페이지*(`/search?q=`)가 아직 없어서. 가짜 마크업은 구글 가이드 위반. 검색 페이지 생기면 그때 추가.
>
> **Cowork이 이미 함** (tsc EXIT=0): `app/page.tsx`에 `HOME_JSONLD` 상수 + `<script type="application/ld+json">` 삽입. 화면·데이터 로직은 손 안 댐.
>
> **전제**: STEP 636(`58e89ec`) 이후. 이 STEP은 **빌드 + 커밋만**.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error" | head -8
```
- ✅ 기대: `Compiled successfully`.

## 1) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep "app/page.tsx"
```
- 기대: `M app/page.tsx`

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add app/page.tsx docs/STEP_637_COMMAND.md && git commit -m "seo(home): Organization+WebSite JSON-LD (구글 사이트 엔티티 인식·SearchAction은 검색페이지 생기면)" && git push
```

## 3) (배포 후) Cowork이 라이브 최종 검증 — STEP 638
- 종목페이지: title=회사명 유니크 · h1 원시HTML에 회사명 · canonical · JSON-LD(Breadcrumb·Corporation) — KR·US·JP 3종 교차.
- 홈: Organization·WebSite JSON-LD 존재.
- sitemap.xml: 종목 URL 다수.

## ✅ 완료 시 → SEO ④ STEP 638: **라이브 최종 검증**. 이후 한국어 SEO 마무리 → 광고 설정 단계.
