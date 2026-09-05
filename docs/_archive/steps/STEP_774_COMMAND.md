# STEP 774 — 명칭·기준의 실체 정합 2건 (섹션명 동적화 + 거래대금 가시화)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: 코드 HEAD `2fd496b`(STEP 773) · 트리 클린

**배경(07-21)**: ① 773이 "한국 시장 변화"를 고정 문구로 지정 — en 화면은 미국 데이터를 보여주므로 제목·실체 불일치(Claude Code 라이브 검증에서 발견) ② "거래대금 순" 정렬 라벨의 대상 값이 제품 어디에도 안 보임(사용자 지적) — 리스트 밀도를 지키며 **종목 상세에서 실체를 보여준다.**

---

## 수정

### 1) 시장 변화 섹션명 동적화 (en 버그 수정)

- `Today.marketChangesTitle`을 시장 파라미터 기반으로: 표시 중인 홈마켓에 따라 **"한국 시장 변화" / "미국 시장 변화"** (en "Korea market changes" / "US market changes"). i18n은 `{market}` 삽입 또는 시장별 키 — 기존 패턴에 맞게.
- 탐색의 대응 섹션·풀리스트 제목도 동일 점검(시장 토글과 제목 일치).

### 2) 종목 상세 헤더에 거래대금 표시

- 상세 헤더 메타줄 확장: `006400 · 434,500원 -4.30% · 거래대금 1.2조` 형태.
- 값 소스: KR=`kr_stock_snapshot.trade_amount` · US=`us_stock_perf.amount` — **상세 헤더가 이미 쓰는 데이터 조회에 포함**(새 API 금지·기존 조회 확장).
- 축약 포맷 공용 함수: KR `1.23조`/`450억` · US `$1.2B`/`$340M` (ko/en 로케일 분기). JP/CN 등 amount 있는 시장 자연 표시·없으면 항목 생략(정직 결측).
- ETF 뷰도 동일 규칙.

### 3) 리스트의 "거래대금 순" 라벨 유지 — 이제 상세가 실체 담당(구조 설명: 리스트=기준 고지·상세=값).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(패리티) · `npm run build`
2. 라이브: `/` ko 섹션명 "한국 시장 변화" · `/en` "US market changes"(미국 데이터와 일치) · 삼성SDI 상세 헤더 "거래대금 N.N조" · US 종목 상세 "$N.NB" · JP 종목 상세 확인.
3. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/STEP_774_COMMAND.md
   git commit -m "STEP 774: dynamic market-changes title (en fix), trade value on stock detail header"
   git push
   ```

## 완료 보고 → Cowork에게
- tsc/vitest/build · 라이브 확인 3종 · 커밋 해시. (직후 775 이어서.)
