<!-- 2026-07-14 -->
# STEP 709B — i18n 2/3단계 (2군: ToolboxClient — 보드 셸)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(탭 라벨이 **모듈 최상위 상수**라 훅으로 못 옮김 → 키화 후 렌더에서 `t()` 해석하는 판단 필요)
**목표:** `ToolboxClient.tsx`의 사용자 문자열을 `messages/ko.json`으로. 709 패턴 유지. **한국어 동일·화면 0 변화.**
**전제:** STEP 709 완료(`b6c503e`).

---

## ⚠️ 핵심 주의 — 모듈 상수 라벨맵
`ToolboxClient.tsx`의 `TOP_LABELS`·`INFO_LABELS`·`FEED_SUB_LABEL` 등은 **모듈 최상위 `const`**라 훅(`useTranslations`)을 쓸 수 없다. → **값을 '키 문자열'로 바꾸고, 렌더 지점에서 `t()`로 해석**한다:
```tsx
// 전:  const INFO_LABELS = { news: '뉴스', disclosure: '공시', ... };
//      ... 렌더: {s.label}   (s.label 이 '뉴스')
// 후:  const INFO_LABELS = { news: 'info.news', disclosure: 'info.disclosure', ... };  // 값=키
//      const t = useTranslations('Toolbox');
//      ... 렌더: {t(s.label)}   (s.label 이 'info.news' → t가 '뉴스'로)
```
`TOP_LABELS`(종목·정보)도 동일하게 키화 + `{t(TOP_LABELS[x])}`. 실제 한국어 값은 `ko.json`에.

## 작업
1. `components/toolbox/ToolboxClient.tsx` 읽기.
2. `messages/ko.json`에 **"Toolbox"** 네임스페이스 추가 — 사용자에게 보이는 한국어 **전부**:
   - 상단 탭(종목·정보), 하위탭(뉴스·공시·리포트·기업·재무·거시·ETF·공모주·증권사·유사투자자문사·차트·거래소·토론·커뮤니티·유튜브), 서브 라벨(모아보기 등), 빈 상태·안내 문구, 검색 placeholder, 버튼 등.
   - 값은 코드의 한국어와 **오타·띄어쓰기·중점(·)까지 100% 동일**.
3. `const t = useTranslations('Toolbox')`(ToolboxClient는 client). 모듈 상수 라벨맵은 위 방식으로 키화 + 렌더 `t()`. JSX·속성(placeholder·aria-label)의 하드코딩 문자열은 직접 `t()`.
   - 브랜드 고유명사·국가명(한국/미국/일본/중국/베트남/영국 — 이건 store/상수에서 올 수 있으니, ToolboxClient에 하드코딩된 것만) 등은 실제 렌더 문자열 기준으로 판단. 안 보이는(주석·키) 문자열은 손대지 말 것.
4. 빌드 + 검증(화면 0 변화): `npm run build` + tsc 0. 렌더가 이전과 **100% 동일**(탭·하위탭·빈상태 라벨 그대로). dev로 홈 열어 탭 라벨 육안 확인 권장.
5. 커밋:
```bash
git add -A && git commit -m "i18n(2/3·보드셸): ToolboxClient 문자열 → ko.json + useTranslations (모듈 라벨맵 키화·한국어 동일·화면 0)" && git push
```

## 다음
- **709C:** `LensPreview`·`StockLensClient`·`EtfLensClient`(렌즈 UI).
- **709D:** 6개 보드(`MarketBoard`·`Us`·`Jp`·`Cn`·`Vn`·`Gb`) — 공유 패턴이라 일괄.
- 이후 나머지 페이지/컴포넌트.
- 그 후 **STEP 710(3/3, 집중 세션):** `app/[locale]` 라우팅 + `en.json` + 언어 스위처 + 로케일→기본 시장 매핑.
