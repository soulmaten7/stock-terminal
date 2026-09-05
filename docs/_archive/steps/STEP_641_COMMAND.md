<!-- 2026-07-07 -->
# STEP 641 — 구글 서치콘솔 소유권 인증 태그 심기

> **목적**: 구글 서치콘솔이 준 HTML 태그 인증 토큰을 사이트 `<head>`에 심어 소유권 인증 → sitemap 제출 가능하게.
>
> **Cowork이 이미 함** (tsc EXIT=0): `app/layout.tsx`의 `metadata`에 `verification.google` 추가 → Next가 `<meta name="google-site-verification" content="mSXx…">`를 전 페이지 head에 자동 삽입.
>
> **전제**: STEP 640(`21a87d9`) 이후. 이 STEP은 **빌드 + 커밋만**.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error" | head -8
```
- ✅ 기대: `Compiled successfully`.

## 1) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep "app/layout.tsx"
```
- 기대: `M app/layout.tsx`

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add app/layout.tsx docs/STEP_641_COMMAND.md && git commit -m "seo(gsc): 구글 서치콘솔 소유권 인증 메타태그 추가(verification.google)" && git push
```

## 3) (배포 후) Cowork 확인 + 사용자 인증
- Cowork: 라이브 head에 `google-site-verification` 메타 뜨는지 실측.
- 사용자: 서치콘솔에서 **확인(Verify)** 클릭 → 인증 완료 → 이어서 **Sitemaps** 메뉴에 `sitemap.xml` 제출.

## ✅ 완료 시 → 서치콘솔 인증 + sitemap 제출 완료 = 구글 크롤링 시작.
