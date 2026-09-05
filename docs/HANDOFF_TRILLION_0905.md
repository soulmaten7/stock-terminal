<!-- 2026-09-05 신설 — 미국판 채널(WeTheTicker) 작업 세션 인수인계용. 대상 저장소: stock-shorts. -->
# 🤝 Trillion 인수인계 — 미국판 채널(WeTheTicker) 세션용

> **이 파일 하나만 읽어도 이해되게 썼다.** 당신(이 문서를 읽는 세션)은 `stock-shorts` 저장소(채널 제작)만 보고 있고, Trillion(`stock-terminal` 저장소, `onetrillion.app`)은 안 보고 있을 것이다 — 그래서 "Trillion이 뭘 하는 곳이고, 미국판이 뭘 맞춰야 하는지"를 여기 담는다.
> 갱신 규칙: 같은 성격의 파일이 이미 있으면(향후 세션) 새로 만들지 말고 **이 파일을 덮어쓴다**. 파일명의 `_0905`는 신설일 표시일 뿐, 다음에 내용이 바뀌면 그대로 이 파일을 고친다(날짜를 바꾸지 않는다).

---

## 1. Trillion이 지금 뭘 하는 곳인가

**Trillion은 2026-09-05부로 "모델 계산 플랫폼"에서 "채널 리포트 적재 플랫폼"으로 전환을 완료했다.** 이전에는 렌즈(7팩터 스코어)·역DCF 같은 자체 계산 모델이 종목 페이지의 핵심이었지만, 그 트랙은 전면 폐지됐다(화면·크론·DB grant 전 층위에서 오늘 실행 완료). 지금 Trillion 종목 페이지의 알맹이는 **채널이 만든 증권사 리포트·기업 실적 전망을 국가별로 시간순으로 모아 보여주는 것**이다.

즉 Trillion은 **채널들의 본사·허브**다 — 스톡스카우터(KR)·WeTheTicker(US) 같은 채널이 만든 콘텐츠를 한곳에 모아 시청자에게 보여주고, 채널 간 크로스 프로모션·관심종목 같은 부가 기능을 얹는 역할. Trillion 자체는 투자 자문·매매 중개를 하지 않으며("거래 X" 원칙), 채널이 만든 자료를 가공 없이 그대로 적재·표시한다.

당신(WeTheTicker 담당)이 만드는 8-K 가이던스 판정 데이터는 Trillion의 **US 콘텐츠 원료**다 — 아래 §2가 그 데이터 계약이다.

---

## 2. 데이터 계약 — `channel_reports` 테이블

Supabase 프로젝트 `ccbwxcszdoyjxvckedfp`("Trillion", ap-northeast-2)의 `public.channel_reports` 테이블. 이미 `us/trillion_push.py`가 이 계약대로 쓰고 있다 — 아래는 **그 계약을 문서로 확정**한 것이다(코드가 이미 맞고 있으니, 코드를 바꿀 근거 없이는 여기서 벗어나지 말 것).

### 2-1. 컬럼 (실제 스키마, 2026-09-05 기준)

| 컬럼 | 타입 | NULL 허용 | 의미 / US판 규칙 |
|---|---|---|---|
| `id` | bigint | NO(자동) | PK, 자동증가 |
| `symbol` | text | **YES** | 티커. 매칭 실패 시 NULL 허용(§2-2 CHECK 제약 참조) — 매칭 안 되면 지어내지 않고 NULL로 둔다 |
| `stock_name` | text | NO | 회사명(`_normalize_company_name()`로 정규화한 것 사용) |
| `country` | text | NO(기본 `'KR'`) | **US판은 반드시 `'US'`를 명시** (기본값이 KR이라 빠뜨리면 잘못 들어간다) |
| `report_date` | date | NO | 리포트 기준일. US는 8-K 접수일(`8-K접수시각` 컬럼의 날짜부) |
| `assembled_date` | date | YES | 현재 US 파이프라인은 안 씀(NULL) |
| `broker` | text | NO | US는 실제 증권사가 아니라 **`"Self-reported (8-K)"`** 고정값(회사 자체 공시라는 뜻 — 지어내지 않는다) |
| `verdict` | text | YES | §2-4 참조 |
| `target_price` | text | YES | **US는 항상 NULL** — 8-K 자체 실적발표엔 목표주가 개념이 없다(증권사 리포트가 아니므로). 지어내지 않는다 |
| `current_price` | text | YES | §2-5 참조 |
| `upside` | text | YES | **US는 항상 NULL**(target_price가 없으니 상승여력도 계산 불가) |
| `reasons` | jsonb | NO(기본 `[]`) | `[{"title": "<가이던스 판정 근거 문장 그대로>"}]` 1건. **LLM이 새로 쓰지 않는다** — `guidance_judge`의 판정 근거(`judge_evidence`) 원문 그대로 |
| `earnings_summary` | text | YES | prior→new 숫자쌍이 잡힌 행에만 고정 템플릿으로 한 줄. 숫자가 없으면 지어내지 않고 NULL |
| `broker_average` | text | YES | **US는 항상 NULL**(증권가 평균 목표주가 개념 없음) |
| `source_lang` | text | NO(기본 `'ko'`) | **US판은 반드시 `'en'`** |
| `episode_folder` | text | NO | **upsert 키**(아래 unique index) — §2-6 참조 |
| `title` | text | YES | §2-3 참조 |
| `created_at`/`updated_at` | timestamptz | NO(자동) | 손대지 않는다 |

### 2-2. `symbol` CHECK 제약 (국가별 정규식 — 실제 DB 제약 그대로)

```sql
CHECK (
  (symbol IS NULL)
  OR (country = 'KR' AND symbol ~ '^[0-9]{5}[0-9A-Z]$')
  OR (country = 'US' AND symbol ~ '^[A-Z]{1,5}(\.[A-Z])?$')
  OR (country NOT IN ('KR','US') AND symbol ~ '^[A-Za-z0-9.-]{1,10}$')
)
```
**US 티커는 대문자 1~5글자, 선택적으로 `.` + 대문자 1글자**(예: `BRK.A`)까지만 허용한다. 소문자·숫자 포함 티커는 이 정규식을 통과 못 해 INSERT 자체가 거부된다 — 이상한 티커면 대문자 변환을 먼저 확인할 것.

### 2-3. `title` 규칙 (LLM 생성 절대 금지 — 1군 원칙)

- **영상 제작분** (그날 `output/<TICKER>_001.mp4`가 존재 = `_is_produced()`가 True): `youtube.md`의 `## Title` 한 줄을 그대로 쓴다.
- **미제작분**: 가이던스 판정 근거 문장(`judge_evidence`, 8-K 원문 문장 그대로)을 쓴다.
- **어느 쪽도 새로 짓지 않는다.** 두 경우 다 원문에서 가져온 값이 없으면 `title`은 NULL — 빈 문자열이나 지어낸 문구로 채우지 않는다.
- (참고) `reasons[0].title`도 같은 원칙(판정 근거 문장 그대로)이라 미제작분은 `title`과 `reasons[0].title`이 사실상 같은 문장이 된다.

### 2-4. `verdict` 어휘 (한국어로 저장, 화면에서 이중언어 라벨)

DB에는 **한국어 라벨을 그대로 저장**한다(`us/guidance_judge.py`의 `KOREAN_LABEL`) — 6분류 중 4개만 채택(아래 §3 스킵 규칙 참조):

| 저장값(ko) | 원래 영문 판정 코드 | 화면 en 라벨(홈·`/reports` 카드) |
|---|---|---|
| `상향` | `up` | Raised |
| `하향` | `down` | Lowered |
| `유지` | `hold` | Maintained |
| `신규제시` | `new` | New guidance |
| (저장 안 함) | `none`(미제시) | — |
| (저장 안 함) | `unclear`(판별불가) | — |

🔴 **알려진 갭(§5에도 기록)**: 이 en 라벨 매핑은 홈/`/reports` 목록 카드(`components/reports/ReportRow.tsx`)에만 있다. **종목 상세 페이지(`/stock/{symbol}`)의 리포트 레이어는 `verdict`를 한국어 원문 그대로 렌더링한다** — `/en/stock/BRC` 같은 영문 화면에서도 "신규제시"가 한글로 뜬다. US 채널 시청자가 자주 보는 화면이니 알아둘 것(수정은 Trillion 쪽 작업 — §7 참조).

### 2-5. `current_price` — 외부 API 없이 Trillion 내부에서 조회

- US 채널은 자체 시세 API가 없다(Yahoo/Stooq가 채널 쪽 IP를 차단해 2026-09-03에 포기 — `docs/ORDER_미국판_결정반영_0903.md` 참조). **대신 같은 Supabase 프로젝트의 `us_stock_perf` 테이블을 직접 조회한다** — 새 API·새 키·추가 비용 0.
- `us_stock_perf`는 Trillion의 `us-perf` 크론(매일 22:00 UTC, Vercel 인프라에서 `yahoo-finance2` 호출)이 채우는 **전일 종가**다. 실시간이 아니라는 점을 인지할 것 — 채널의 판정 시점과 며칠 차이 날 수 있다(단 한국판도 스냅샷 기반이라 같은 원칙).
- `trillion_push.py`의 `_fetch_us_prices(tickers)`가 여러 티커를 한 번에(200개씩 청크) 조회해 `price_map`을 만들고, `_fmt_usd(price)`가 `"$12.34"` 형식(소수점 2자리, 천단위 콤마)으로 포맷한다.
- 매칭 안 되는 티커(예: 아직 `us_stock_perf`에 없는 신규 상장)는 **NULL로 남긴다** — 절대 추정하지 않는다.

### 2-6. `episode_folder` — upsert 키

- Postgres 쪽: `uq_channel_reports_episode_folder`라는 **UNIQUE 인덱스**가 걸려 있고, 적재는 `POST .../channel_reports?on_conflict=episode_folder`(`Prefer: resolution=merge-duplicates`)로 **upsert**한다 — 같은 `episode_folder`로 다시 실행해도 안전(덮어쓰기), 새로 생기지 않는다.
- US 규칙: 영상 제작분 = `us/data/<날짜>/video/<티커>`(실제 폴더 경로), 미제작분 = `us_report_<accession번호>`(SEC 접수번호 기반 합성 키, 전 세계 유일).
- 🔵 **NFC 정규화에 대한 참고**: 한국판(KR)은 macOS APFS가 한글 폴더명을 NFD로 저장해 문자열 비교가 깨지는 문제가 실제로 있었다(`find_episode_folder()`가 NFC 정규화로 해결). **US는 티커·접수번호가 전부 ASCII라 지금은 이 문제가 없다** — 다만 이 필드는 "같은 실행을 반복해도 항상 같은 문자열이 나와야 하는 안정적 유일 키"라는 원칙 자체는 어느 나라든 동일하니, 향후 비ASCII 값을 쓰게 되면 이 함정을 기억할 것.

---

## 3. 지금 US 적재 상태 (2026-09-05 실측)

- **53건** 적재 완료, `country='US'`, 전부 `current_price`·`title` 채워짐(0건 결측). 최신 리포트 = 2026-09-03.
- 매일 자동 연동됨 — US 채널의 8-K 수집·판정 파이프라인(`us/collect_8k.py`)이 그날 `pool.csv`를 처리한 뒤 `_push_to_trillion(date_str)`을 호출해 당일 신규분을 자동 적재한다(사람이 수동으로 안 돌려도 됨).
- verdict 분포(2026-09-05 실측): 상향 35 · 신규제시 16 · 하향 1 · 유지 1.
- **스킵 규칙**: `judgment`이 `none`(미제시) 또는 `unclear`(판별불가)인 행은 **애초에 적재 시도조차 안 한다**(`record_from_pool_row()`가 `None`을 반환, 호출부가 건너뜀). **`up`·`down`·`hold`·`new` 4종은 전부 적재된다** — 이건 영상 제작 후보 판정(`is_candidate_judgment()` — `up`/`down`은 항상, `new`는 설정값에 따라, `hold`는 영상 후보에서 아예 제외)과는 **다른(더 넓은) 기준**이다. Trillion은 아카이브 플랫폼이라 영상화 여부와 무관하게 "방향이 있는 판정"은 전부 보여준다.

---

## 4. 화면에서 어떻게 보이는가

1. **홈(`onetrillion.app/`, 로그인 여부 무관)** — 국가별 섹션을 순회하며 표시. US 섹션 헤딩 = 🇺🇸 **"US Stocks · Latest Earnings Guidance"**(en) / **"미국 주식 · 최신 기업 실적 전망"**(ko). **최근 5건만** 카드로 보여주고("최근" = `report_date DESC` 정렬, 날짜 필터 없음 — 주말·휴일엔 오래된 게 그대로 5건 뜰 수 있음), 카드는 종목명+제목 한 줄·현재 주가 한 줄로 압축. "리포트 N건 더 보기 →"로 `/reports?country=US`로 연결.
2. **종목 페이지(`onetrillion.app/stock/{티커}`, en은 `/en/stock/{티커}`)** — 그 종목의 `channel_reports` 전체를 시간순(최신 먼저)으로 카드 리스트업. **최신 1건은 항상 펼쳐져서** 판정·가격까지 보이고, **과거분은 접혀서** 헤더(날짜·`broker`·verdict)만 보이다가 클릭하면 펼쳐진다(`ReportLayer` 컴포넌트, `app/[locale]/stock/[symbol]/StockLensClient.tsx`). 리포트가 하나도 없으면 "리포트 준비 중" 플레이스홀더.
3. **`/reports?country=US` 목록 페이지** — 홈과 같은 카드 컴포넌트(`ReportRow.tsx`) 재사용, 단 증권사·판정 줄까지 포함한 3줄 카드로 전체 목록(개수 제한 없음)을 보여줌.

---

## 5. 알려진 개선 대상 (US 쪽에서 인지하고 있어야 할 것)

- **제목이 길고 화면에서 잘린다.** US `title`이 8-K 원문 헤드라인 그대로라(예: `"Brady Corporation Reports 2026 Fourth Quarter and Record Full Year Results   Achieved Record Annual Revenue and Adjusted Diluted Earnings Per Share Completed Transformational Acquisition of Honeywell "`) 홈·목록 카드에서 `truncate`로 잘린다. 원문을 훼손하지 않는 선에서 더 짧은 대표 문구를 뽑을 방법이 있으면 개선 여지(단 **LLM 생성 금지 원칙은 유지** — §2-3).
- **`target_price`/`upside`는 US에서 개념 자체가 없어 항상 NULL이다.** 그래서 홈·목록 카드는 이제 `target_price`가 아니라 **`current_price`("현재 주가")로 통일 표시**한다 — US도 KR과 같은 화면에서 자연스럽게 값이 채워진다.
- **신규 상장 티커는 `us_stock_perf`에 아직 없을 수 있다.** Trillion의 US 유니버스(`data/us_symbols.json`)는 매일 자동 재생성(Nasdaq Trader 심볼 디렉토리 기반)되지만 하루 지연이 있을 수 있어, 상장 직후 며칠은 `current_price`가 NULL로 나올 수 있다(정상 동작 — 지어내지 않는 게 맞다).
- **verdict의 en 라벨이 종목 상세 페이지에는 적용 안 됨**(§2-4의 🔴 참조) — 영문 화면에서 한글 판정 단어가 그대로 보인다. US 채널 시청자에게 직접 영향이 있으니 알아두되, **수정은 Trillion 쪽(이 저장소) 작업**이다 — 필요하면 §7대로 요청할 것.

---

## 6. 국가 확장 구조 (향후 일본 등 추가 시 참고)

Trillion은 **새 리포트 국가를 추가할 때 코드 수정이 0이 되도록** 설계돼 있다(2026-09-05 확립, JP를 임시로 넣었다 빼는 실측으로 ".tsx/.ts diff 0"을 확인했다). 새 국가(예: JP) 채널을 Trillion에 연결하려면 이 저장소에서 딱 두 곳만 고치면 된다:

1. `lib/constants/reportCountries.ts`에 `{ code: "JP", flag: "🇯🇵", displayOrder: 3 }` 한 줄 추가.
2. `messages/ko.json`·`messages/en.json`의 `Today.countries.JP.{name,reportsTitle,channelDescription}` 블록 추가(텍스트만).

`channel_reports.country`에 `'JP'`로 데이터를 넣기 시작하면(§2-2의 symbol CHECK 제약도 KR/US 외 국가는 `^[A-Za-z0-9.-]{1,10}$`로 이미 열려 있음) 위 두 곳만으로 홈·`/reports`·채널 카드에 자동으로 뜬다 — 컴포넌트(`TodayClient.tsx`·`ReportRow.tsx`)는 이미 국가 배열을 순회하도록 짜여 있어 건드릴 필요가 없다.

---

## 7. 저장소 경계

- **당신(채널 세션)은 이 저장소(`stock-terminal`)를 수정하지 않는다.** 채널 쪽(`stock-shorts`)만 작업 범위다.
- Trillion 쪽 변경이 필요하면(예: §5의 en 라벨 갭 수정, `channel_reports` 스키마 변경 요청, 새 국가 등록) **직접 고치지 말고 채팅(한국 채널 세션)을 통해 요청한다** — Trillion 쪽 코드·DB 마이그레이션은 그쪽 세션이 실행한다.
- `channel_reports`/`our_channels` 테이블은 Trillion이 소유한 테이블이다 — 스키마를 바꿀 땐(컬럼 추가 등) 반드시 Trillion 쪽과 먼저 합의한다(RLS: anon은 SELECT만 가능, INSERT/UPDATE는 `SUPABASE_SERVICE_ROLE_KEY`로만 — 이 키는 이미 `stock-shorts`의 `config/.env`에 있다).
