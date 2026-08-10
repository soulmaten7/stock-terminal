# STEP 983 — 3번 규칙 기록 (①-A 3회 · ①-B 3회)

> 설계·조사 전용. 코드 0줄·DB 쓰기 0·마이그레이션 0·크론 미호출.

## A-0 (우리 자산) — 먼저 연 것

- `lib/lensPrecompute.ts:53-67·98-204·344-465·516-553` — capGate·topByMarketCap·recordHeartbeat 전부 코드로 직접 확인.
- `app/api/cron/health/route.ts` — 🔴 **이미 존재하는 관측 인프라를 처음으로 전체 열람**. `lens_cuts` 나이를 49시간 임계로 이미 감시하고 있었다(STEP828 §2-5) — 07-30부터 정지된 US 컷이라면 이 체크가 **11일 내내 stale로 잡혔어야 한다**. 이 사실 자체가 983의 가장 큰 발견 중 하나(아래 "새로 드러난 것").
- `docs/probe_949_mcap_gap.json` — `open_question.candidate_causes_unverified`(4개 미검증 가설) · `classification`(A=0·C=0, 이미 폐기된 두 가설의 근거) 재확인.
- `docs/probe_982_lens_cuts_freeze.json`·`docs/LENS_CUTS_FREEZE_982.md` — 982의 cutGateOk 발견 그대로 이월.
- `vercel.json` — 크론 9개 스케줄 전수.

## ①-A — 운영 관측 실무 문헌 (금융 원전 아님)

🔴 **이 영역엔 "원전" 개념이 없다** — 배치 잡 관측은 학술 논문이 아니라 업계 실무서·사내 표준으로 축적된 지식이다. 가장 가까운 "정본"은 구글 SRE북(Site Reliability Engineering, O'Reilly/Google 공개)이다 — 업계에서 가장 널리 인용되는 관측 실무 텍스트.

**A-1. Google SRE Book — "Monitoring Distributed Systems"**(`sre.google/sre-book/monitoring-distributed-systems/`, WebFetch로 직접 확인)

- **4대 신호(Four Golden Signals)**: 지연시간(Latency)·트래픽(Traffic)·에러(Errors)·포화도(Saturation).
- **화이트박스 vs 블랙박스 모니터링**: 블랙박스 = 사용자가 겪는 대로 외부에서 관찰(우리 `health` 크론이 이 방식 — 결과 테이블의 나이만 봄). 화이트박스 = 로그·계측으로 내부를 들여다봄(임박한 문제·가려진 실패를 미리 잡음).
- 🔑 **우리 현재 상태를 이 틀로 정확히 진단할 수 있다**: `health` 크론 = 블랙박스(있음, 작동 중이나 07-30 이후 왜 대응이 없었는지는 별도 문제). STEP982가 필요로 했던 것(freshCoverage·noCapField·HTTP상태) = 화이트박스(부분적으로만 있음 — `cron_heartbeats.note`가 그 역할이나 job당 최신 1건뿐).

**A-2. Dead Man's Switch 패턴**(WebSearch, 복수 실무 블로그 일치)

*"instead of you pinging the job to check it's up, the job pings you every time it runs. If the expected ping doesn't arrive in time, the monitor fires."* — 우리 `cron_heartbeats` + `health`의 나이 감시가 이미 이 패턴이다(named pattern이라는 것을 이번에 처음 확인). 새로 발명할 필요 없음 — **이미 표준 패턴을 쓰고 있었다.**

**A-3. 입도(granularity) 가이드** — SRE북 본문(A-1과 같은 페이지): *"probing... more than once or twice a minute is probably unnecessarily frequent"*(가용성 목표에 맞는 빈도면 충분, 배치 잡처럼 하루 1회 도는 것에 초 단위 계측은 과함). 🔑 **일 단위 실행 하나당 요약 통계(카운트·비율·샘플) 수준이면 충분하다는 뜻 — 요청 하나하나를 전부 남길 필요는 원전 기준으로도 없다.**

## ①-B — Vercel Hobby 사후확인 실무 3가지(비용 확인 필수)

| 방법 | 무료/유료 | 상세 |
|---|---|---|
| **1. Sentry(이미 배선됨)** | 🟢 **무료·코드 0줄 추가** | Sentry 무료 티어 = **이벤트 보존 30일**(2026 기준, 공식 헬프센터). 우리는 `Sentry.captureMessage`로 `[lens-cut-gate]`·`[us-cut-gate]`·`[topByMarketCap] 청크 실패` 등을 **이미 매 실행 남기고 있다.** 🔑 **07-31~08-08의 개별 게이트 상태가 Sentry 대시보드엔 이미 있을 가능성이 높다** — 새 인프라 없이 사람이 로그인해서 확인하면 끝나는 문제일 수 있다(이번 STEP은 그 확인 자체는 안 함 — Sentry 조회 도구 없음, 아래 "못 한 것"). |
| **2. DB 자체 적재(cron_heartbeats 확장 또는 신설)** | 🟢 **무료**(기존 Supabase 프로젝트, 별도 과금 없음) | 우리가 3단계에서 설계하는 대상. 이미 절반 구현돼 있다(1-3 참조). |
| **3. Axiom `next-axiom` 라이브러리** | 🟢 **무료 티어**(Personal 500GB/월 수집) | Vercel Log Drains와 별개 — Vercel 유료 전환 없이 붙일 수 있는 SDK. 단 **새 의존성 추가 + 코드 계측 필요**(3단계 범위). |
| (참고) Vercel Log Drains | 🔴 **유료 전환 필요** — 2024-05-23부터 신규 Log Drain은 Pro 이상($20/월)만 가능·전송량 $10/5GB | 확인만 하고 후보에서 사실상 제외(최소비용 원칙과 충돌) |

🔑 **①-B 결론**: Vercel 로그 자체를 우회할 필요가 없을 수도 있다 — **이미 무료로 배선된 채널(Sentry)이 있고, 우리가 필요로 하는 메시지를 이미 보내고 있다.** 못 만든 게 아니라 "본 적이 없다"가 진짜 상태일 가능성이 크다.
