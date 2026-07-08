<!-- 2026-07-08 (2nd) -->
# 🇻🇳 [완료·마감] VN 공시층 + R1 — 결과 기록

> **✅ 2026-07-08 (2nd) 처리 완료 · 🏁 VN 마감.** STEP 657(`04cae64`)·657B(`5459b0b`)·658(`1b8e1e1`).
> **결과 요약**: 아래 계획대로 착수했으나 **VN엔 공식 공시원문 소스가 없음**을 실측 확인 —
> ① **TCBS** `tcanalysis` v1/v2 전 경로 **404(폐기)** · ② **CafeF** AJAX 200이나 빈 `<ul>`(세션/쿠키 필요) · ③ **Vietstock** 공시 AJAX 토큰(`__RequestVerificationToken`)이 **JS 렌더 후 삽입**→서버fetch 불가 · ④ 최종 대체 **Google News RSS(vi·VN)** 로 이벤트층은 붙였으나, R1용 기사 원문 링크 `/rss/articles/CBMi...`는 **JS전용 디코딩(서버fetch 400)** 이라 **resolve 0%**(로컬·Vercel 동일).
> **최종 상태**: VN = **이벤트층(뉴스·이벤트 · Google News) + R3 한국어 뉴스요약**으로 커버. **R1은 보류**(VnFilingSummary 코드는 숨김상태로 보존 — 나중 진짜 공시 소스 생기면 배선만). 베트남 시장 규모 대비 노력상한 도달로 **VN 마감**(사용자 승인). 공식 공시 R1 = US·KR·JP·GB 4개국.
> **▶ 다음 = CN 공시** → `docs/NEXT_SESSION_CN_PLAN.md`.
>
> _(아래는 착수 당시 원계획 — 히스토리로 보존.)_

---

# 🇻🇳 [원계획] VN(베트남) 공시층 + R1 원문요약 (완전성 계속)

> **이 파일 하나로 다음 세션이 VN 공시를 처음부터 끝까지 진행할 수 있게 만든 자급형 실행 계획.**
> 상위 맥락(현재 상태 전반) = `docs/NEW_SESSION_HANDOFF.md` · 최신 배너 = `docs/SESSION_BOOT.md` · 이 파일 = **VN 전용 실행 플랜**.
> 새 세션은: ① `NEW_SESSION_HANDOFF.md`로 전체 상태 파악 → ② **이 파일로 VN 착수.**

---

## 0. 지금 어디까지 왔나 (2026-07-08 세션 종료 시점)
- **공시 원문요약(R1) = US(EDGAR)·KR(DART)·JP(EDINET)·GB(RNS/Investegate) 4개국 완성.** 코드 HEAD `fef75ee`(STEP 654) → 문서 `e0daf12`(STEP 655) → 이 문서(STEP 656).
- **완전성 로드맵**: JP✅ → GB✅ → **VN(지금 할 것)** → CN → 광고(대화 먼저).
- VN 탭 자체는 이미 있음(종목보드 HOSE·피드·지수바 VN-Index/VN30·매매처·R3 뉴스 vi = STEP 622~627). **없는 것 = 종목 페이지 "공시층 + 공시 원문요약(R1)".** 이걸 JP/GB와 동급으로 붙이는 게 이번 목표.

## 1. 목표 (JP/GB와 완전 동급)
VN 종목 페이지(`/stock/{TICKER}.VN`)에:
1. **공시 이벤트층** — "최근 중대 공시" 카드 (`VnEventLayer`, GbEventLayer 복제).
2. **R1 원문 요약** — 각 공시 아래 "AI 요약·원문 기반" **베트남어→한국어** 사실 요약 (`VnFilingSummary`, GbFilingSummary 복제).

## 2. 🔴 소스 정찰 결과 (STEP 656 · 이번 세션에 실측 — 반드시 먼저 읽기)
VN도 GB처럼 **EDINET급 공식 무료 종합 API가 없음.** 두 갈래, A 먼저 시도:

### 후보 A: TCBS 공개 API (`apipubaws.tcbs.com.vn`) — 깔끔하나 엔드포인트가 이동됨
- vnstock(파이썬 라이브러리)이 쓰는 비공식 공개 API. **도달성 OK**(브라우저 실측 — JSON 응답 받음 = 네트워크 통함).
- ⚠️ **함정(이번 세션에 헛짚음)**: `tcanalysis/v1/ticker/{ticker}/overview` 와 `.../events-news` **둘 다 `{"status":404,"message":"Service not found"}`** = 그 `tcanalysis` 서비스 경로가 **폐기/이동됨.** (bars는 `stock-insight/v1/...` 계열에서 됨.) **경로 추측 금지 — 이미 실패함.**
- **다음 세션 첫 할 일 = 진짜 회사-이벤트 엔드포인트를 네트워크 캡처로 확보**:
  - Chrome MCP로 베트남 금융 화면(예: `https://tcinvest.tcbs.com.vn`, `https://simplize.vn/co-phieu/FPT`, `https://finance.vietstock.vn`)의 **회사 공시/이벤트 탭**을 열고 → `mcp__claude-in-chrome__read_network_requests`로 `apipubaws.tcbs.com.vn`(또는 자체 API) 호출을 캡처 → **유효 엔드포인트 URL·파라미터·응답 구조** 확보.
  - 또는 최신 vnstock 소스(GitHub `vnstock-official/vnstock` → `vnstock/explorer/tcbs/company.py`)에서 현재 events/news 엔드포인트 확인.
- 되면 = **JSON API 온디맨드**(GB HTML 스크랩보다 깔끔·ToS 부담 적음). ✅ 우선 목표.

### 후보 B: CafeF / Vietstock 서버렌더 스크랩 (GB Investegate 방식·폴백)
- TCBS 캡처가 막히면 = **CafeF**(`cafef.vn`) 또는 **Vietstock**(`finance.vietstock.vn`) 회사별 공시/사건 페이지를 **서버렌더 HTML 파싱**(GB `/api/gb-events`와 완전 동일 패턴).
- 먼저 `mcp__workspace__web_fetch`로 (a) 서버렌더 여부 (b) 회사별 페이지 URL 구조 확인(GB 때 Investegate `/company/{TIDM}` 확인한 것처럼).
- 원문 링크 귀속 + 온디맨드 + 캐시로 ToS 완화(GB와 동일).

## 3. 빌드 계획 (JP/GB 패턴 그대로 미러 — 2 STEP)

### STEP A: VN 공시 이벤트층
- **`app/api/vn-events/route.ts`** — `?symbol=FPT.VN` → `tidmOf`(`.VN` 제거·대문자) → [소스 A: TCBS JSON 호출 / 소스 B: CafeF·Vietstock HTML 파싱] → 노이즈 필터 후 최근 8건 → 온디맨드 + 10분 인메모리 캐시. 소스 B면 UA 헤더 + 원문 URL 귀속. (GB `gb-events/route.ts` 복제 후 소스만 교체.)
- **`app/stock/[symbol]/StockLensClient.tsx`**:
  - `VnEventLayer` 추가 = **`GbEventLayer` 복제**(제목·날짜·중대 배지·원문 링크). 소스 라벨 예 "HOSE·공시" 또는 "CafeF".
  - `const isVN = /\.VN$/i.test(symbol);` 추가(isGB 옆).
  - 배선(현재 ~754행): `{isKR ? <KrEventLayer/> : isJP ? <JpEventLayer/> : isGB ? <GbEventLayer/> : isVN ? <VnEventLayer symbol={symbol}/> : <EventLayer .../>}`
- tsc EXIT=0 → 커밋 → **라이브 검증(최대 관건=Vercel 도달성)**: `onetrillion.app/api/vn-events?symbol=FPT.VN` 직접 호출로 JSON 확인 → 종목 페이지 렌더.

### STEP B: VN R1 원문 요약
- **`app/api/vn-events/summary/route.ts`** — 공시 상세(TCBS JSON 본문 or CafeF 상세 HTML) → 본문 추출 → **gpt-4o-mini 베트남어→한국어 사실 요약** → `filing_summaries` 캐시(accession=`VN`+id·SSRF 방지 URL 검증). **`gb-events/summary/route.ts` 복제** 후 소스·프롬프트만 교체.
  - 시스템 프롬프트: "베트남 공시(베트남어)를 한국 개인투자자에게 사실만 2~3문장…예측·추천 금지·원문에 없는 내용 금지·통화(동 ₫)·숫자 원문 그대로·해요체."
- **`VnFilingSummary`**(url/id 전달) = `GbFilingSummary` 복제 → VnEventLayer 각 항목에 배선.
- 라이브 검증: FPT/VIC/VNM 공시 밑 한국어 요약.

## 4. 참조 (그대로 베낄 원본)
- **미러 원본(GB)**: `app/api/gb-events/route.ts`(리스트 파서) · `app/api/gb-events/summary/route.ts`(요약) · `StockLensClient.tsx`의 `GbEventLayer`·`GbFilingSummary`·`isGB`·배선 삼항식.
- **공용**: `filing_summaries` 테이블(accession PK·summary_ko·model·symbol — US/KR/JP/GB 공용, VN도 accession=`VN`+id로 합류) · `OPENAI_API_KEY`(Vercel 등록됨) · `createAdminClient()`(`@/lib/supabase/admin`).
- **VN 이름**: `vn_names` 테이블(베트남어명·STEP 623~627). R3 뉴스가 이미 vi 로케일로 씀. 종목명은 SSR `lib/stockName.ts`.
- **완전성 룰**(CLAUDE.md 절대규칙): MVP=축소 아님 · 소스 막히면 대체 찾아서라도(TCBS 막히면 CafeF/Vietstock) · DoD 빠짐없이.

## 5. ⚠️ 주의 / 함정 (이번 세션 교훈 + 과거 전례)
- **Vercel 도달성이 최대 리스크** — GB Investegate는 통과했지만 VN 소스(TCBS/CafeF)가 Vercel(데이터센터 IP)에서 되는지는 **배포 후 `/api/vn-events?symbol=FPT.VN` 직접 호출로 반드시 실측.** 막히면 헤더 조정 or 대체 소스.
  - 전례: STEP 618~619에서 **东方財富(CN)이 KR·데이터센터 IP 차단**(exit52/502) → 텐센트 우회함. VN도 차단 가능성 염두.
- **TCBS `tcanalysis` 경로는 죽었음(404)** — 이번 세션에 이미 확인. 새 경로는 **네트워크 캡처로만** 확보(추측 금지).
- **베트남어 요약이 영어로 나올 수 있음** — JP R3에서 겪은 함정(야후 영어명→LLM 영어 출력). 한국어 아니면 재시도/번역 폴백 고려(JP R3 결정론 후처리 참고).
- **브라우저 멀티-fetch 스크립트는 Chrome 안전층이 차단**(이번 세션 겪음) → 엔드포인트는 한 번에 하나씩 navigate+read 또는 read_network_requests로.

## 6. VN 다음엔 → **CN 공시**(cninfo·HKEXnews · ⚠️东方財富 IP차단 전례로 **도달성 프로브 먼저**) → **광고**(사용자와 대화 먼저 — 사용자 지침).

---
*작성: 2026-07-08 STEP 656 (VN 정찰 종료·빌드는 다음 세션). 코드 HEAD `fef75ee`.*
