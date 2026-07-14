<!-- 2026-07-14 -->
# STEP 709C — i18n 2/3단계 (3군: 렌즈 UI — LensPreview·StockLensClient·EtfLensClient)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(정적 UI 문자열 vs 동적 데이터 문자열을 **구분**해야 함 — 판단 필요)
**목표:** 렌즈 UI 3파일의 **정적** 한국어 문자열을 `messages/ko.json`으로. 709/709B 패턴. **한국어 동일·화면 0 변화.**
**전제:** STEP 709B 완료(`ec6052c`).

---

## ⚠️ 핵심 판단 — 정적 UI만 이관, 동적 데이터는 제외
- **이관(정적 UI):** 섹션 헤더("시간축으로 한눈에"·"최근 중대 공시"·"이 종목 브리핑"·"TR-AI 렌즈"·"이렇게 봅니다"), 기간·게이지 라벨(단기·중기·장기·RSI 등), 배지("참고"·"신뢰"·"재무·팩터"·"AI 분석 아님"·"원문 기반"·"상품 구성"·"상품 정보"), 빈 상태·로딩·에러, 정직 표시("재무 데이터 없음"·"데이터 부족 — 상장·거래 이력이 짧아…"·"사고팔 신호가 아니라, 스스로 판단할 재료예요"), "이 화면 읽는 법 · 신뢰도 등급", 자세히/한계 라벨 등 **JSX에 하드코딩된 정적 한국어 전부**.
- **제외(동적 데이터 — 이번 X, 손대지 말 것):** `l.name`(모멘텀·밸류 등 렌즈명), `l.verdict.phrase`(판정 문구), 브리핑 본문, 공시 제목·AI요약, 종목명·가격 등 **props·함수반환·API에서 오는 문자열.** 이건 데이터 레이어라 별도(추후). props/변수에서 오면 그대로 둔다.

## 작업 (709·709B 패턴 그대로)
1. 읽기: `components/toolbox/LensPreview.tsx`, `app/stock/[symbol]/StockLensClient.tsx`, `app/stock/[symbol]/EtfLensClient.tsx`.
2. `messages/ko.json`에 네임스페이스 추가(파일별 "LensPreview"/"StockLens"/"EtfLens" 또는 공유 "Lens" — 판단). 값은 코드와 **오타·띄어쓰기·중점·따옴표까지 100% 동일**.
3. `useTranslations`로 정적 문자열 교체. 모듈 상수·`t` 이름 충돌은 709B 방식(값 키화·기존 t 리네임). 속성(aria-label·title) 문자열도. **동적 데이터는 절대 t()로 감싸지 말 것**(MISSING_MESSAGE 남).
4. 빌드+검증: `npm run build` + tsc 0. dev(3333)로 **렌즈 미리보기 + 종목 상세** 열어 육안 100% 동일, `IntlError`·MISSING_MESSAGE **0**.
5. 커밋:
```bash
git add -A && git commit -m "i18n(2/3·렌즈): LensPreview·StockLensClient·EtfLensClient 정적 UI 문자열 → ko.json (동적 데이터 제외·한국어 동일·화면 0)" && git push
```

## 다음
- **709D:** 6개 보드(`MarketBoard`·`Us`·`Jp`·`Cn`·`Vn`·`Gb`) — 공유 패턴이라 일괄.
- 이후 나머지 페이지/컴포넌트(about·feedback·advertise·business·mypage·admin·AdvisorDirectory·피드들).
- 그 후 **STEP 710(3/3, 집중 세션):** `app/[locale]` 라우팅 + `en.json` + 언어 스위처 + 로케일→기본 시장 매핑.
