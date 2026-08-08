<!-- 2026-08-08 · Cowork 작성 · Claude Code 실행용 -->

# STEP 945 — Q0 구현 ⑤단계: **종목 리스트 섹터 분류 ＋ 섹터 어휘 GICS 통일**

> **범위**: Q0의 화면. §2 확정 = *"별도 카드 아님 — 각 카드에 「업종 대비」로 녹임 ＋ **리스트 섹터 분류**"* 중 **리스트 쪽만**.
> 🔴 **「각 카드에 업종 대비」는 이 STEP에 없다** — 그 카드(Q1~Q4)가 아직 없다.
> 🔴 **라이브 화면 변경이다.** 장은태 승인 = ⓕ를 **ⓐ(GICS명으로 통일)**로 확정(2026-08-08).

---

## 🔴 확정된 판정 (2026-08-08 장은태)

**ⓕ 섹터 어휘 충돌 → ⓐ 채택.** **GICS명으로 통일한다.** ETF 화면(`EtfLensClient.tsx`)의 야후 어휘도 GICS로 옮긴다.
근거: 야후→GICS 대응표가 이미 있고(11:1), **두 어휘를 남기면 나중에 반드시 다시 손대게 된다.**

## 🔑 Cowork 사전 실측 — **새 번역 키가 0개다**

`messages/ko.json`·`en.json`의 `EtfLens.sector`에 **21키**가 있고, **GICS 11개가 전부 기존 키로 커버된다.**

| GICS 섹터 | 쓸 기존 키 | ko | en |
|---|---|---|---|
| Information Technology | `it` | IT·기술 | IT · technology |
| Financials | `financials` | 금융 | Financials |
| Consumer Discretionary | `consumer_discretionary` | 경기소비재 | Consumer discretionary |
| Consumer Staples | `consumer_staples` | 필수소비재 | Consumer staples |
| Materials | `materials` | 소재 | Materials |
| Health Care | `health_care` | 헬스케어 | Health care |
| Communication Services | `communication_services` | 커뮤니케이션 | Communication services |
| Industrials | `industrials` | 산업재 | Industrials |
| Energy | `energy` | 에너지 | Energy |
| Utilities | `utilities` | 유틸리티 | Utilities |
| Real Estate | `real_estate` | 부동산 | Real estate |

🔴 **키를 추가하지도 삭제하지도 않는다.** 삭제하면 `messages.test.ts` ko·en 패리티와 **KR 화면**이 위험하다. 야후 키 8개(`technology`·`financial_services`·`consumer_cyclical`·`consumer_defensive`·`basic_materials`·`healthcare`·`realestate`·`communication_services`)는 **남겨둔다**.

---

## ⓪-4 4×3 기록

### ③ 자체 데이터 확인 (Cowork)

| # | 열어본 것 | 결과 |
|:--:|---|---|
| 1 | `EtfLensClient.tsx:41-56` | `SECTOR_KEYS`에 **야후(US) 11 ＋ 네이버(KR) 10** — 🔴 **KR 항목이 있다. 동결 대상이라 건드리지 말 것** |
| 2 | `messages/{ko,en}.json` `EtfLens.sector` | 21키 · ko·en **동수** · GICS 11 전부 커버(위 표) |
| 3 | `app/[locale]/explore/page.tsx` → `components/explore/ExploreClient.tsx` | **603줄** · US는 `/api/yahoo/us-list` 호출 — 🔴 **섹터 필드가 없다** |
| 4 | `docs/probe_944_persist.json` | `us_sector_resolved` 1,021 전부 일치 · 미분류 0 |

### ① 3번 검색 ＋ ⓪-5-B

```
필요한 데이터 : 없음 — 저장된 섹터를 화면에 붙이는 STEP
link_hub 후보 : 해당 없음
실제 조회     : 미실시
직접 웹검색   : 미실시
```
🔴 **못 한 축으로 명시.**

### ② 3번 검증

1. **어휘 정합** — 통일 후 ETF 화면의 섹터 라벨이 리스트의 섹터 라벨과 **같은 문자열**이어야 한다
2. **KR 불변** — KR ETF 화면의 섹터 라벨이 **변하지 않아야** 한다(네이버 키 경로)
3. **덧붙이기** — 리스트의 **기존 정보가 하나도 사라지지 않아야** 한다

### ④ 3번 검수 (자기 공격)

1. 🔴 **야후 키를 지우고 싶어질 것이다.** 지우지 말 것 — `messages.test.ts` 패리티와 KR 경로가 걸린다. **매핑 한 겹을 얹는다.**
2. 🔴 **라벨이 한국어로는 거의 안 바뀐다**(기술→IT·기술 · 금융→금융 · 경기소비재→경기소비재). **영어에서 더 바뀐다**(Consumer cyclical → Consumer discretionary). 🔑 **바뀌는 게 적다고 작업이 무의미한 게 아니라, 내부 어휘가 하나가 되는 것이 목적**이다.
3. 🔴 **출처 표기를 빠뜨리기 쉽다.** 규칙 5-2 ④는 **섹터가 표시되는 화면에 출처가 보일 것**을 요구한다. 리스트에 종목별 출처를 다 달면 지저분하니 **하단 공통 안내 한 줄**로 한다(아래 지시 3).

---

## 실행 지시

### 1. 섹터 라벨 단일화 (`lib/sectorLabel.ts` 신설)

```
🔴 규칙 5-2 — 매핑을 한 곳에 둔다. 화면마다 복붙 금지.

내보낼 것 두 개
 (a) YAHOO_TO_GICS : 야후 섹터키 → GICS 섹터명
       technology→Information Technology · financial_services→Financials
       consumer_cyclical→Consumer Discretionary · consumer_defensive→Consumer Staples
       basic_materials→Materials · healthcare→Health Care · realestate→Real Estate
       communication_services·industrials·energy·utilities → 동명
 (b) GICS_TO_MESSAGE_KEY : GICS 섹터명 → messages 키 (위 표 그대로)

🔴 매핑에 없는 값이 오면 원문을 그대로 반환한다(현행 `sectorLabel`과 동일 동작).
🔴 KR(네이버) 키 경로는 이 함수를 거치지 않게 두거나, 거치더라도 결과가 불변이어야 한다.
```

### 2. `EtfLensClient.tsx` 전환

```
- 기존 SECTOR_KEYS·sectorLabel을 lib/sectorLabel.ts로 대체
- 🔴 US(야후) 입력은 (a)→(b)를 거쳐 라벨을 찾는다
- 🔴 KR(네이버) 입력은 기존과 동일한 라벨이 나와야 한다 — 테스트로 고정
- 🔴 messages 키 추가·삭제 0
```

### 3. 섹터 조회 API 신설 — `/api/sector/us`

```
반환: { asOf, items: [ { symbol, sector, source } ] }   (us_sector_resolved 최신 as_of · 1,021건)
🔴 기존 API(/api/yahoo/us-list 등)를 수정하지 말 것 — 새 엔드포인트만 추가
🔴 캐시: 하루 단위로 바뀌는 데이터다. 기존 라우트 관행에 맞춰 revalidate 설정
```

### 4. `ExploreClient.tsx` — 섹터 표시·필터 (**덧붙이기만**)

```
- US 목록의 각 행에 섹터 라벨을 표시(칩 또는 부가 텍스트 — 기존 레이아웃 관행에 맞출 것)
- 섹터 필터: 11개 중 선택 → 목록을 그 섹터로 좁힘. 기본값 = 전체
- 🔴 기존 정보(가격·등락률·점 표시·관심 별)를 하나도 지우지 말 것
- 🔴 KR 목록은 건드리지 말 것 — US 탭에만 적용
- 🔴 출처 공통 안내 한 줄을 목록 하단에 넣는다(규칙 5-2 ④):
     ko: "업종 분류는 S&P 섹터 ETF · Damodaran · Yahoo 순으로 정합니다. 종목마다 출처가 다를 수 있어요."
     en: "Sector is resolved from S&P sector ETFs, then Damodaran, then Yahoo. The source can differ by stock."
  🔴 messages에 새 키 2개(ko·en 동시) 추가 — 이건 허용. 그 외 키 변경 금지.
```

### 5. 테스트

1. `sectorLabel`: 야후 키 11개 → GICS 라벨 (ko·en 각각)
2. 🔴 **KR 회귀**: 네이버 키 10개가 **기존과 동일한 라벨**을 낸다
3. 매핑에 없는 값 → 원문 그대로
4. `/api/sector/us`: 1,021건 · `source` 포함
5. 섹터 필터: 선택 시 해당 섹터만 남는다 · 전체 선택 시 원복
6. 🔴 **회귀**: `messages.test.ts` ko·en 패리티 통과 · 기존 테스트 전부 통과

### 6. 문서

- `docs/CHANGELOG.md` **(106) STEP 945** — 어휘 통일 범위 · 새 messages 키 2개 · 리스트 변경 내용
- `docs/STATE.md` ▶다음 0번 — **⑤단계 상태 갱신 ＋ ⑥(테스트)가 남았음 ＋ 🔴 「각 카드에 업종 대비」는 Q1~Q4 카드와 함께**임을 명시
- `docs/STEP_LEDGER.md` 등재

🔴 **`CLAUDE.md` · `docs/USER_QUESTIONS_2026-08-08.md` · `docs/LENS_COMPLETION_STANDARD.md`는 고치지 않는다.**

---

## 🔴 금지 (전부 불변)

- 🔴 **`messages` 기존 키 삭제·변경 금지** (신규 2개 추가만 · ko·en 동시)
- 🔴 **KR 경로 불변** — 네이버 섹터 키 · KR ETF 화면 · KR 목록
- 🔴 **기존 API 수정 금지** (신규 엔드포인트만)
- 🔴 **기존 렌즈 판정 로직·`lens_cuts`·`lib/sector.ts` 수정 금지**
- 🔴 **「각 카드에 업종 대비」 구현 금지** — 이 STEP 범위 밖
- `revdcf_results` · `us_market_cap` · `lens_scores` — **쓰기 금지**
- `REVDCF_ENABLED` · `data/us_symbols.json` · `.github/workflows/**` · `vercel.json` — 불변
- 크론 등록·수동 실행 — **금지**
- `ACTIVE_MARKETS` · KR 크론 3개 · `messages.test.ts` — **끄지 않는다**
- 🔴 **API 키·비밀번호를 어떤 필드에도 입력하지 않는다**

## 성공 기준

1. 섹터 라벨이 **한 곳(`lib/sectorLabel.ts`)에서만** 결정됨 · ETF 화면이 그걸 씀
2. 🔴 **KR 라벨 불변**(테스트로 고정) · `messages.test.ts` 통과
3. `/api/sector/us` 동작 · Explore US 목록에 섹터 표시·필터 · **기존 정보 삭제 0**
4. 출처 공통 안내 한 줄 노출(ko·en)
5. `npm test` · `npx tsc --noEmit` 통과 · 렌즈·역DCF 경로 diff 0

## 🔴 배포 후

**이 STEP은 라이브 화면을 바꾼다.** 배포되면 **장은태가 Preview에서 육안 확인**한다. 🔴 **Claude Code는 배포 후 "완료" 선언을 하지 말고, 「배포됨 · 육안 확인 대기」로 보고할 것.**

## 🔴 막히면

**추측해서 진행하지 말고 멈추고 보고할 것.** 특히 ① KR 라벨이 하나라도 바뀜 ② `messages.test.ts` 실패 ③ Explore 레이아웃이 깨져 기존 정보가 가려짐 — 이 셋은 **반드시 멈춘다.**
