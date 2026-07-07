<!-- 2026-07-07 -->
# STEP 642 — 네이버 서치어드바이저 소유권 인증 태그 심기

> **목적**: 네이버 서치어드바이저가 준 HTML 태그 인증 토큰을 사이트 `<head>`에 심어 소유권 인증 → 네이버 sitemap 제출 가능하게. (한국 검색 = 네이버 비중 큼.)
>
> **Cowork이 이미 함** (tsc EXIT=0): `app/layout.tsx`의 `metadata.verification`에 `other["naver-site-verification"]` 추가 → Next가 `<meta name="naver-site-verification" content="7a43…">`를 전 페이지 head에 삽입(기존 구글 태그와 공존).
>
> **전제**: STEP 641(`087b948`) 이후. 이 STEP은 **빌드 + 커밋만**.

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
cd ~/stock-terminal && git add app/layout.tsx docs/STEP_642_COMMAND.md && git commit -m "seo(naver): 네이버 서치어드바이저 소유권 인증 메타태그 추가(verification.other)" && git push
```

## 3) (배포 후) Cowork 확인 + 사용자 인증
- Cowork: 라이브 head에 `naver-site-verification` 메타 뜨는지 실측.
- 사용자: 서치어드바이저에서 **확인** 클릭 → 인증 완료 → **요청 > 사이트맵 제출**에 `sitemap.xml` 제출.

## ✅ 완료 시 → 구글 + 네이버 양대 검색엔진 등록 완료 = 한국어 SEO 활성화 완결.
