<!-- 2026-07-11 -->
# STEP 698 — 🐞 ETF/ETN 크론 r1w·r3m·r6m 전부 null 수정 (거래일 판정) — 커밋 + 크론 재트리거 + 라이브확인

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 코드는 **Cowork(Opus)가 작성·`tsc`=0.** 원인은 **KRX 실측 프로브로 확정**, 수정안도 **라이브 검증 완료**. 이 STEP = 임시파일 정리 + 맥 test·build + 커밋/푸시 + **크론 재트리거(테이블 재계산)** + 라이브확인.

**배경:** STEP 697 크론이 `r1w·r3m·r6m`을 **전 종목 null**로 채웠음(DB: r1w_f=0·r3m_f=0·r6m_f=0, r1m·r1y만 채워짐).
**원인(실측 확정):** KRX ETP 엔드포인트는 **주말·휴장일에도 '종목 목록'은 주지만 종가(`TDD_CLSPRC`)가 빈 문자열**. `snapshot()`이 거래일을 `rows.length > 0`으로만 판정 → 주말 날짜(목록만 있고 종가 빈칸)에서 멈춰 **빈 스냅샷 채택** → `closeMap`(종가>0 필터)이 비어 그 기간 전부 null.
- 프로브: `20260704`(토)·`20260412`(일) = rows 1143·1088개인데 069500 종가 `""`. 거래일(`20260703`·`20260410`)은 정상.
- 수정안 라이브 검증: "유효 종가 있는 날만 채택" → off7 `20260704(0)`→`20260703(1143)`, off91 `20260411(0)`→`20260410(1088)`, off182 `20260110(0)`→`20260109(1059)`. 정확히 거래일 안착.

**바뀐 것(Cowork이 이미 작성·tsc=0):** `lib/krEtpSnapshot.ts` + `app/api/krx/etf-performance·etn-performance/route.ts`의 `snapshot()` 채택 조건을 `rows.length > 0` → **`rows.some((r) => num(r.TDD_CLSPRC) > 0)`**(유효 종가=거래일만 채택).

---

## 1. 임시파일 정리 + 로컬(맥)
```bash
rm -f _probe_tmp.mjs _probe_lens.ts
npm install
npm test               # 7 passed
npx tsc --noEmit       # 0
npm run build 2>&1 | tail -6
```

## 2. CHANGELOG (오늘 블록)
```
- **698**: 🐞 ETF/ETN 크론 r1w·r3m·r6m 전부 null 수정 — KRX ETP가 주말·휴장일에 목록만 주고 종가 빈칸인데 snapshot()이 rows.length로만 거래일 판정→빈 스냅샷 채택. "유효 종가 있는 날만 채택"으로 수정(크론+라우트 폴백). KRX 실측 프로브로 원인·수정 검증.
```

## 3. 커밋 → 푸시
```bash
git add lib/krEtpSnapshot.ts "app/api/krx/etf-performance/route.ts" "app/api/krx/etn-performance/route.ts" docs/CHANGELOG.md docs/STEP_698_KR_ETP_TRADINGDAY_FIX_COMMAND.md
git commit -m "fix(kr): ETF/ETN 스냅샷 거래일 판정 — 주말 빈 종가 스킵(r1w/r3m/r6m null 해소)"
git push
```

## 4. CI 초록불 (Actions 탭).

## 5. 배포 후 크론 재트리거 (수정 반영 테이블 재계산)
```bash
SECRET=$(grep -E '^CRON_SECRET=' .env.local | cut -d= -f2- | tr -d '"')
curl -s -H "Authorization: Bearer $SECRET" "https://onetrillion.app/api/cron/kr-etp"; echo
```
- `{"ok":true,"etf":N,"etn":M}` (수십 초 소요 정상).

## 6. 라이브 확인 ★ 진짜 게이트
```bash
for k in etf etn; do echo "== $k =="; curl -s "https://onetrillion.app/api/krx/$k-performance" | python3 -c "import sys,json;d=json.load(sys.stdin);it=d.get('items',[]);f=lambda p:sum(1 for x in it if x.get(p) is not None);print('source',d.get('source'),'items',len(it),'| r1w',f('r1w'),'r1m',f('r1m'),'r3m',f('r3m'),'r6m',f('r6m'),'r1y',f('r1y'))"; done
```
- **r1w·r3m·r6m 채움 수가 대부분**(예 90+/100)이면 성공(예전 0). `source=kr_etp_snapshot`.

## Cowork에게 보고
- 크론 `ok:true` + 두 라우트 r1w·r3m·r6m 채움 수(예전 0 → 대부분).
