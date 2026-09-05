<!-- 2026-07-10 -->
# STEP 678 — 🔗 OG 링크 미리보기 문구 확정 반영 (전문가 시각·TR-AI·무료 분석)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** `app/layout.tsx` 메타데이터가 전부 옛 "흩어진 금융정보를 한눈에".
**목표:** 확정된 브랜드 공유 멘트를 **링크 미리보기(카톡·메신저·OG)**와 SEO 타이틀·설명에 반영.
**확정 문구(`docs/BRAND_IDENTITY.md` §6):**
- OG 타이틀: **"전문가 시각으로, TR-AI가 무료로 분석해 드립니다"**
- OG 설명: **"가격은 시장이 붙이고, 가치는 당신이 매깁니다. 우린 그 가치를 볼 수 있게 거들 뿐 — 판단은 당신 몫입니다."**
**대상:** `app/layout.tsx` (메타데이터만).

---

## 1. `title.default` — 브라우저 탭·구글 결과 제목 (SEO)
```tsx
    default: "Trillion — 흩어진 금융정보를 한눈에",
```
→
```tsx
    default: "Trillion — 전문가 시각의 무료 주식 분석",
```

## 2. `description` — 구글 검색 스니펫 (SEO·키워드 유지)
```tsx
  description:
    "흩어진 금융정보를 한곳에 모아 한눈에 — 시세·뉴스·공시·거시지표·ETF·공모주, 그리고 리딩방 검증까지. Trillion.",
```
→
```tsx
  description:
    "전문가 시각의 분석을 TR-AI가 무료로. 시세·뉴스·공시·거시·ETF·공모주부터 리딩방 검증까지 — 가치 판단은 당신 몫.",
```

## 3. `openGraph` — 링크 미리보기 카드 (확정 문구 그대로)
```tsx
  openGraph: {
    title: "Trillion",
    description: "흩어진 금융정보를 한눈에 — 시세·뉴스·공시·거시·리딩방 검증",
    type: "website",
    locale: "ko_KR",
  },
```
→
```tsx
  openGraph: {
    title: "전문가 시각으로, TR-AI가 무료로 분석해 드립니다",
    description: "가격은 시장이 붙이고, 가치는 당신이 매깁니다. 우린 그 가치를 볼 수 있게 거들 뿐 — 판단은 당신 몫입니다.",
    siteName: "Trillion",
    type: "website",
    locale: "ko_KR",
  },
```
> ⚠️ `locale: "ko_KR"`는 KR 기준. 다국어 확장 시 언어권별 OG는 후속(각 locale 번역 + `alternateLocale`).

## 4. `keywords` — 신규 키워드 추가 (기존 유지 + 아래 추가)
`keywords` 배열에 추가:
```tsx
    "주식 분석",
    "무료 주식 분석",
    "AI 주식 분석",
    "TR-AI",
```

## 5. 검증 → 커밋
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && npm run dev
```
- 빌드 통과. `/` 페이지 소스에서 `<meta property="og:title" content="전문가 시각으로, TR-AI가 무료로 분석해 드립니다">` 확인.
- (선택) 배포 후 카톡/메신저에 `onetrillion.app` 링크 붙여 미리보기 카드 문구 확인. **캐시 때문에 즉시 안 바뀌면 카카오 디버거 등에서 스크랩 갱신 필요.**
- console.log 금지. tsc 에러 0.
```bash
git add app/layout.tsx docs/BRAND_IDENTITY.md docs/STEP_678_OG_META_COMMAND.md
git commit -m "feat(brand): OG·SEO 문구 확정 — 전문가 시각·TR-AI 무료 분석·판단은 당신(BRAND_IDENTITY §6)"
git push
```

## 6. 세션 종료 문서 4개 헤더 날짜 2026-07-10 + CHANGELOG 한 줄(STEP 678).

## Cowork에게 보고
- 링크 미리보기/구글 스니펫 문구 반영 확인.
→ 다음: (a) OG 이미지(미드나잇+민트 카드) 추가로 미리보기 더 강하게, (b) TR-AI 명칭 코드·UI 통일(선택), (c) 탭 재구조("링크모음" 종속), (d) 상하이종합 한글 표기 버그.
