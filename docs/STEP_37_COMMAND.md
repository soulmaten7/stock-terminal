# STEP 37 — KIS 기반 재무 스냅샷 시딩 (PER/PBR/EPS/BPS)

## 실행 명령어
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

## 목표
`scripts/seed-financials-snapshot.py` 를 실행해서 `financials` 테이블에 KIS inquire-price 기반 PER/PBR/EPS/BPS 스냅샷을 채운다.
- 대상: `stocks` 테이블 KR 시총 TOP 200 + `watchlist` 등록 종목 + 삼성전자(005930)
- 이 과정으로 `/stocks/[symbol]` OverviewTab 의 KPI 그리드가 `—` → 실제 숫자로 전환된다.
- 테마 50종목(`data/themes.json`) 중 대부분이 시총 TOP 200 에 포함되므로 테마 페이지 드릴스루 경험이 즉시 개선됨.

## 전제 상태
- 이전 커밋: `9ba4557` (STEP 35) + STEP 36 데이터 시딩 (`stocks` 2,780건, `link_hub` 56건)
- `scripts/seed-financials-snapshot.py` 기존 파일 존재 (197줄, 수정 없이 그대로 실행)
- 이번 STEP 은 **코드 변경 없음** — 데이터 시딩만
- commit/push 불필요. 문서 4개만 로컬 갱신

## 왜 KIS 스냅샷 먼저인가
- DART 재무제표(매출·영업이익·순이익) 는 STEP 38 에서 별도 진행
- 이유: `dart_corp_codes` 선행 시딩 + DART API 레이트 리밋 + 연도×분기 조합으로 작업량이 큼
- KIS 스냅샷은 기존 스크립트 실행만으로 끝나고 UI 체감 효과가 즉각적 (OverviewTab KPI 활성화)

---

## Part 1 — 실행 환경 점검

### 1-1. 필수 환경변수 확인
```bash
grep -E "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|KIS_APP_KEY|KIS_APP_SECRET)=" .env.local | sed 's/=.*/=<hidden>/'
```
**기대 출력** (순서 무관, 4개 모두 존재해야 함):
```
NEXT_PUBLIC_SUPABASE_URL=<hidden>
SUPABASE_SERVICE_ROLE_KEY=<hidden>
KIS_APP_KEY=<hidden>
KIS_APP_SECRET=<hidden>
```

### 1-2. 누락 대응
- `SUPABASE_SERVICE_ROLE_KEY` 없음 → Supabase 대시보드 Project Settings → API → service_role 키 복사 후 `.env.local` 에 추가
- `KIS_APP_KEY` / `KIS_APP_SECRET` 없음 → 한국투자증권 KIS Developers 대시보드에서 앱키 재확인

### 1-3. 파이썬 의존성 확인 (STEP 36 에서 이미 설치됐을 가능성 높음)
```bash
pip3 show supabase python-dotenv requests 2>/dev/null | grep -E "^Name|^Version" || echo "일부 누락"
```
누락 시:
```bash
pip3 install --break-system-packages supabase python-dotenv requests
```

---

## Part 2 — 스크립트 실행

### 2-1. 실행
```bash
python3 scripts/seed-financials-snapshot.py
```

**예상 소요 시간**: 약 1분 (TOP 200 × 120ms RATE_LIMIT = 24초 + 워치리스트 + 오버헤드)

**예상 로그 흐름**:
```
[1/4] KIS 액세스 토큰 발급 중...
  토큰 발급 완료
[2/4] 대상 종목 선정 (시총 TOP 200 + watchlist + 005930)
  대상 2XX종목
[3/4] KIS API 에서 PER/PBR/EPS/BPS 수집 중...
  진행: 20 / 2XX
  진행: 40 / 2XX
  ...
  수집 완료: 1XX건, 실패: X건
[4/4] financials 총 1XX건 upsert 시작
  financials upserted: 1XX건

[완료] financials 테이블 총 1XX건
```

### 2-2. 에러 케이스
- **`토큰 발급 실패`** 연속 → KIS 앱키/시크릿 재확인. 하루 토큰 발급 한도(10회) 초과 시 24시간 대기
- **`ModuleNotFoundError`** → Part 1-3 재실행
- **네트워크 타임아웃** → 재실행 (멱등, `on_conflict='stock_id,period_type,period_date'` 로 중복 방지)
- **대량 실패 (50건 이상)** → KIS 레이트 리밋 의심. `scripts/seed-financials-snapshot.py` 37번째 줄 `RATE_LIMIT_SEC = 0.12` 을 `0.3` 으로 올리고 재실행

---

## Part 3 — 시딩 검증

### 3-1. Supabase 테이블 카운트 확인
```bash
python3 -c "
import os
from dotenv import load_dotenv
from supabase import create_client
load_dotenv('.env.local')
sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
cnt = sb.table('financials').select('id', count='exact').execute().count
print(f'financials total: {cnt}')
samsung = sb.table('financials').select('period_date, per, pbr, eps, bps').eq('stock_id', sb.table('stocks').select('id').eq('symbol', '005930').eq('market', 'KOSPI').single().execute().data['id']).order('period_date', desc=True).limit(1).execute().data
print('samsung 005930 latest:', samsung)
"
```
**기대 결과**:
- `financials total: 150~230` (KIS 응답 실패한 종목 제외)
- `samsung 005930 latest` 에 PER/PBR/EPS/BPS 네 개 모두 숫자 값 존재 (중 하나라도 `None` 가능하나 네 개 모두 `None` 이면 실패)

### 3-2. 개발 서버 브라우저 검증
```bash
npm run dev
```
다른 터미널에서:
```bash
curl -s "http://localhost:3000/api/stocks/overview?symbol=005930" | head -c 400
```
**기대**: 응답 `kpis` 객체 안 `per`, `pbr`, `eps`, `bps` 필드가 `"—"` 가 아닌 실제 숫자 문자열 (e.g., `"14.2"`, `"1.23"`).

**브라우저**: `http://localhost:3000/stocks/005930` → OverviewTab 의 KPI 그리드 상단 8개 박스 중 PER/PBR/EPS/BPS 가 숫자로 채워졌는지 확인. 52주 범위·시가총액은 이미 있어야 함 (STEP 35 때 채워짐).

### 3-3. 테마 종목 샘플 체크 (선택)
테마 50 중 임의로 3개:
```bash
curl -s "http://localhost:3000/api/stocks/overview?symbol=373220" | head -c 400  # LG에너지솔루션
curl -s "http://localhost:3000/api/stocks/overview?symbol=042660" | head -c 400  # 한화오션
curl -s "http://localhost:3000/api/stocks/overview?symbol=000660" | head -c 400  # SK하이닉스
```
시총 TOP 200 안에 있는 종목이면 per/pbr 에 숫자, 바깥이면 `—` (정상 동작).

---

## Part 4 — 문서 갱신 (커밋 불필요)

### 4-1. `docs/CHANGELOG.md` 상단에 추가
```markdown
## 2026-04-22 — STEP 37: KIS 재무 스냅샷 시딩

**데이터 작업 (코드 변경 없음)**
- `scripts/seed-financials-snapshot.py` 실행
- `financials` 테이블에 KIS inquire-price 기반 PER/PBR/EPS/BPS 약 1XX건 upsert
- 대상: 시총 TOP 200 + watchlist + 005930

**효과**
- `/stocks/[symbol]` OverviewTab KPI 그리드 활성화 (PER/PBR/EPS/BPS 가 `—` → 숫자)
- `data/themes.json` 테마 50종목 중 시총 TOP 200 안의 종목들이 모두 혜택 받음
- ROE 는 `eps / bps * 100` 자동 계산 (OverviewTab API 에 이미 fallback 로직 존재)
```

### 4-2. `session-context.md` 완료 블록 + 파일 상단 날짜 갱신
```markdown
## 2026-04-22 세션 — STEP 37 완료

- [x] KIS 재무 스냅샷 시딩 (`financials` 약 1XX건)
- [x] OverviewTab KPI 그리드 PER/PBR/EPS/BPS 활성화 확인
```

### 4-3. `docs/NEXT_SESSION_START.md` 갱신
최신 상태 블록:
- stocks 2,780건 + financials 1XX건 + link_hub 56건 시딩 완료
- OverviewTab KPI 활성 / DART 재무제표 미수집
- 다음: STEP 38 DART corp_codes → DART 재무제표 파이프라인

### 4-4. `CLAUDE.md` 첫 줄 날짜 오늘로 갱신

**⚠️ commit/push 하지 말 것**. STEP 36 과 마찬가지로 데이터 작업 — 코드 diff 없음. 문서 4개 날짜만 로컬에 저장하고 다음 실제 코드 변경 STEP 에서 같이 커밋.

---

## STEP 38 예고 (다음 세션)

**DART 재무제표 파이프라인 — 본 게임**
1. `python3 scripts/seed-dart-corpcodes.py` 실행 → `dart_corp_codes` 테이블 적재 (상장 종목 corp_code 매핑)
2. 새 스크립트 `scripts/seed-dart-financials.py` 작성:
   - 대상: 시총 TOP 100 (첫 배치) — DART API 하루 20,000건 한도 고려
   - 연간 보고서 (reprt_code=11011) 최근 2년치 + 최근 분기(Q1~Q3) 1회
   - `lib/dart-financial.ts` 의 `fetchDartFinancial` 패턴을 Python 으로 재구현
   - upsert 대상: revenue, operating_income, net_income, operating_margin, net_margin
3. 검증: `/stocks/005930` 가치투자 탭에서 매출·영업이익·순이익 시계열이 보이는지
4. 향후 확장: 부채비율·ROA·BPS 장기 시계열 수집 (STEP 39+)

---

## 롤백
문제 발생 시:
```sql
-- Supabase SQL Editor 에서
DELETE FROM financials WHERE source = 'KIS:inquire-price(snapshot)' AND period_date = '2026-04-22';
```
KIS 스냅샷 레코드만 정확히 삭제. 추후 DART 실재무 레코드와 섞이지 않도록 `source` 필드로 구분됨.
