# STEP 36 — Supabase `stocks` 테이블 전체 시딩 (KOSPI + KOSDAQ)

## 실행 명령어
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

## 목표
`scripts/seed-stocks.py`를 실행해서 Supabase `stocks` 테이블을 KOSPI + KOSDAQ 전체 종목(약 2,600+)으로 채운다. 이 과정으로 STEP 35에서 🔒 잠긴 4개 탭(재무·어닝·뉴스·수급)이 37개 테마 종목(`data/themes.json`)에서 자동 해제된다. 부수 효과로 `link_hub` 테이블도 국내/해외 카테고리별 고정 링크로 시딩된다.

## 전제 상태
- 이전 커밋: `9ba4557` (STEP 35 — /stocks/[symbol] KIS fallback)
- `scripts/seed-stocks.py` 기존 파일 존재 (156줄, 수정 없이 그대로 실행)
- 이번 STEP은 **코드 변경 없음** — 데이터 시딩만 수행
- commit/push 불필요. `docs/CHANGELOG.md`에 데이터 작업 로그만 추가

---

## Part 1 — 실행 환경 점검

### 1-1. Python 3 + pip 확인
```bash
python3 --version
pip3 --version
```
- Python 3.9+ 이어야 함. 없으면 먼저 설치 요청 후 중단.

### 1-2. 기존 의존성 확인
```bash
pip3 show finance-datareader supabase python-dotenv 2>/dev/null | grep -E "^Name|^Version" || echo "일부 누락"
```

### 1-3. 의존성 설치 (누락된 경우만)
```bash
pip3 install --break-system-packages finance-datareader supabase python-dotenv
```
- 이미 설치되어 있으면 "Requirement already satisfied" 나옴 — 정상.

---

## Part 2 — `.env.local` 점검

### 2-1. 필수 키 존재 여부 확인
```bash
grep -E "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=" .env.local | sed 's/=.*/=<hidden>/'
```
**기대 출력:**
```
NEXT_PUBLIC_SUPABASE_URL=<hidden>
SUPABASE_SERVICE_ROLE_KEY=<hidden>
```

### 2-2. 만약 `SUPABASE_SERVICE_ROLE_KEY` 누락 시
사용자에게 아래 안내 후 중단:
> Supabase 대시보드 → Project Settings → API → `service_role` 키 복사 → `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY=...` 추가 후 다시 실행

**중요**: `service_role` 키는 RLS 우회 권한이 있어 시딩 스크립트에 필수. 절대 클라이언트 번들(NEXT_PUBLIC_*)에 넣지 말 것.

---

## Part 3 — 시딩 스크립트 실행

### 3-1. 스크립트 실행
```bash
python3 scripts/seed-stocks.py
```

**예상 소요 시간**: 2~4분 (KOSPI 900+ · KOSDAQ 1700+ · upsert 500개씩 배치)

**예상 로그 흐름:**
```
[KOSPI] 종목 리스트 가져오는 중...
[KOSPI] 9XX건
[KOSDAQ] 종목 리스트 가져오는 중...
[KOSDAQ] 17XX건
[stocks] 총 26XX건 upsert 시작
  upsert 500/26XX
  upsert 1000/26XX
  ...
[stocks 완료] 테이블 총 26XX건
[link_hub] 총 52건 upsert 시작
[link_hub 완료] 테이블 총 52건
✅ 전체 시딩 완료
```

### 3-2. 에러 케이스 대응
- `ModuleNotFoundError: No module named 'FinanceDataReader'` → Part 1-3 재실행
- `ERROR: .env.local에 SUPABASE URL/KEY 누락` → Part 2-2 참조
- `ConnectionError` / 네트워크 에러 → 재실행 (멱등, `on_conflict='symbol,market'` 로 중복 방지)
- KRX 쪽 일시 장애(`fdr.StockListing` 실패) → 10분 후 재시도

---

## Part 4 — 시딩 검증

### 4-1. Supabase 테이블 카운트 직접 확인
```bash
python3 -c "
import os
from dotenv import load_dotenv
from supabase import create_client
load_dotenv('.env.local')
sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
print('stocks:', sb.table('stocks').select('id', count='exact').execute().count)
print('link_hub:', sb.table('link_hub').select('id', count='exact').execute().count)
"
```
**기대 결과**: `stocks: 2000+`, `link_hub: 52`

### 4-2. 테마 종목 표본 점검 (API 레벨)
개발 서버 띄운 상태에서 (없으면 스킵):
```bash
npm run dev
```
다른 터미널에서:
```bash
curl -s "http://localhost:3000/api/stocks/resolve?symbol=051910" | head -c 300
curl -s "http://localhost:3000/api/stocks/resolve?symbol=373220" | head -c 300
curl -s "http://localhost:3000/api/stocks/resolve?symbol=042660" | head -c 300
```
**기대 결과**: 각 응답에 `"source":"supabase"` 포함 (이전엔 `"source":"kis"` 였다면 이제 DB 히트). `stock.id`가 `null`이 아닌 정수.

### 4-3. 브라우저 확인 (선택)
- `http://localhost:3000/stocks/051910` (LG화학)
- `http://localhost:3000/stocks/373220` (LG에너지솔루션)
- `http://localhost:3000/stocks/042660` (한화오션)

STEP 35 잠김 배지(🔒 / "확장 데이터 연결 후 이용 가능")가 사라지고 모든 탭이 활성화되면 성공. 일부 탭은 재무/어닝 데이터가 아직 없어 "데이터 없음" 상태일 수 있으나, 이는 별개 이슈(다음 STEP).

---

## Part 5 — 문서 업데이트 (커밋 불필요)

### 5-1. `docs/CHANGELOG.md` 상단에 블록 추가
```markdown
## 2026-04-22 — STEP 36: Supabase stocks/link_hub 전체 시딩

**데이터 작업 (코드 변경 없음)**
- `scripts/seed-stocks.py` 실행 → `stocks` 테이블 KOSPI+KOSDAQ 전체 종목 upsert (약 2,600건)
- `link_hub` 테이블 52건 재시딩 (KR/US × news/disclosure/exchange/macro/chart/research/community)

**효과**
- STEP 35 에서 🔒 잠겼던 4개 탭(재무·어닝·뉴스·수급)이 `data/themes.json` 37개 테마 종목에서 해제됨
- `/api/stocks/resolve?symbol=xxx` 응답 `source` 필드가 `kis` → `supabase` 로 전환
- 링크 허브 페이지가 52개 큐레이션 링크로 충전됨
```

### 5-2. `session-context.md` 완료 블록 추가 (파일 상단 날짜도 오늘로)
```markdown
## 2026-04-22 세션 — STEP 36 완료

- [x] Supabase stocks 테이블 시딩 (KOSPI + KOSDAQ 전체)
- [x] link_hub 52건 재시딩
- [x] 테마 37개 종목 🔒 해제 확인
```

### 5-3. `docs/NEXT_SESSION_START.md` 상단 갱신
- 최신 상태: `stocks` 테이블 시딩 완료 (2,600+ 건)
- 다음 우선순위 후보: STEP 37 (아래 참조)

### 5-4. `CLAUDE.md` 첫 줄 날짜 오늘로 갱신

**⚠️ commit/push 하지 말 것**. 이번 STEP은 데이터 작업이라 코드 diff 없음. 문서 4개 날짜 갱신만 로컬에 저장하고 다음 STEP에서 함께 커밋.

---

## STEP 37 후보 (다음 세션 판단용)

1. **A. KRX 업종별 지수 스크래핑 → SectorHeatmap 복원**
   - 현재 `/analysis` 에 ComingSoonCard로 스텁 중
   - `data.krx.co.kr` 깨지기 쉬운 엔드포인트 의존 → 리스크 높음
   - 대안: 장 마감 후 1회 크롤 후 JSON 저장 패턴 (테마 페이지와 동일)

2. **B. 테마 API cron 사전 워밍**
   - 현재 cold miss 시 약 50초 소요 (KIS rate limit)
   - Vercel cron 으로 10분마다 `/api/themes` 셀프 fetch
   - 가치 낮음 (skeleton 로더로 커버 가능)

3. **C. 재무/어닝 데이터 파이프라인**
   - `stocks` 시딩 완료 후에도 `financials` 테이블은 비어있음
   - DART API 또는 Yahoo Finance 기반 분기·연간 재무 수집 배치 필요
   - 가장 높은 사용자 체감 가치 (가치투자·퀀트 탭 활성화)

4. **D. 장중 실시간 데이터 검증**
   - KIS API 20/sec 승격 여부 확인 (계좌 개설 후 3영업일)
   - 승격되면 `RATE_LIMIT_MS` 튜닝

Cowork 판단 권장: **C (재무 파이프라인)** — stocks 시딩이 끝난 시점에서 자연스러운 후속 작업. 가장 많은 탭을 한 번에 활성화함.

---

## 롤백
`stocks`/`link_hub` 테이블을 이전 상태로 되돌릴 필요 생기면:
```sql
-- Supabase SQL Editor에서
DELETE FROM stocks WHERE created_at >= '2026-04-22';
-- link_hub 는 delete-all + insert 패턴이라 개별 롤백 불가 → 수동 복원 필요
```
하지만 `upsert` 는 기존 데이터 덮어쓰기일 뿐 파괴적 변경이 아니므로, 실질적으로 롤백 필요성은 낮음.
