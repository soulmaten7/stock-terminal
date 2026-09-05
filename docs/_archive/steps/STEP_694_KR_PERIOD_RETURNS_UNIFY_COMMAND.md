<!-- 2026-07-10 -->
# STEP 694 — 🐞 미리보기 기간수익률 '—' 버그: 단일 소스화 — 빌드·커밋·배포실측

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 코드는 **Cowork(Opus)가 직접 작성·`tsc`=0.** 이 STEP은 **빌드 + 배포 실측 + 커밋/푸시**만.

**증상(사용자 발견):** 미리보기에서 **1일전만 값이 뜨고 1주일전·1개월전·3개월전·6개월전·1년전이 통째로 '—'**. (예: 한성기업 003680, 상한가 +29.94%인데 나머지 전부 '—')

**원인 규명(코드 + Supabase 실측):**
- **저장(크론)은 정상.** `app/api/cron/kr-perf` → `lib/krSnapshot.ts`가 매일 1회 1일전(change_percent) + r1w/r1m/r3m/r6m/r1y를 **한 줄에 함께** upsert. DB 실측: 003680 = `r1w +53.9·r1m +46.8·r3m +27.4·r6m +22.6·r1y +28.2` **전부 존재**. 즉 "매일 같이 안 넣는" 문제가 아님.
- **진짜 원인 = 프론트가 두 API를 브라우저에서 병합.** `MarketBoard`가 1일전은 `/api/krx/ranking`, 1주~1년은 **별도** `/api/krx/kr-performance`로 받아 종목코드로 합침. 뒤 호출이 순간 비거나 실패하면 → **1일전만 남고 나머지 전부 '—'**. (둘 다 같은 `kr_stock_snapshot` 테이블을 읽는데도 굳이 나눠서 취약했음.)

**바뀐 것(Cowork이 이미 작성):**
- `app/api/krx/ranking/route.ts` — 스냅샷 `select`에 `r1w,r1m,r3m,r6m,r1y` 추가 + 응답 `stocks`에 포함. **1일전과 같은 응답에 함께 실어 보냄.**
- `components/toolbox/MarketBoard.tsx` — **별도 kr-performance fetch+병합 삭제.** `ranking` 응답에서 r1w~r1y 바로 사용(null→undefined→'—'). → "1일전만 뜨고 나머지 '—'"가 **구조적으로 불가능**.
- `kr-performance` route는 그대로 두되 stock 탭에선 미사용(다른 참조 없음). ETF/ETN/REIT 탭은 각자 perf API가 이미 한 응답에 전 기간을 실어 보내므로 영향 없음.

**참고(버그 아님):** 갓 상장한 종목(예 레몬헬스케어 365660)은 1주/1개월/1년 전 가격이 아예 없어 정상적으로 '—'(비교 대상 없음). 백필 불가.

---

## 1. 빌드
```bash
npx tsc --noEmit
npm run build 2>&1 | tail -6
```

## 2. 커밋 → 푸시 (+ CHANGELOG 오늘 블록)
```
- **694**: 🐞 미리보기 기간수익률 '—' 버그 — 1일전(ranking)·1주~1년(kr-performance)을 브라우저에서 병합하던 걸 **ranking 한 응답으로 통합**(둘 다 같은 kr_stock_snapshot). 병합 실패로 나머지 기간이 통째 '—' 되던 현상 제거. 저장(크론)은 원래 정상, 신규상장주 '—'는 정상.
```
```bash
git add app/api/krx/ranking/route.ts components/toolbox/MarketBoard.tsx docs/CHANGELOG.md docs/STEP_694_KR_PERIOD_RETURNS_UNIFY_COMMAND.md
git commit -m "fix(kr): 미리보기 기간수익률 단일 소스화(ranking에 r1w..r1y 포함, 병합 제거)"
git push
```

## 3. 배포 후 실측 (Vercel 배포 완료 대기 후)
```bash
curl -s "https://onetrillion.app/api/krx/ranking?market=all&sort=amount&limit=3" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(s['symbol'], s.get('r1w'), s.get('r1m'), s.get('r1y')) for s in d.get('stocks',[])]"
```
- 각 종목에 **r1w/r1m/r1y 값이 실려오면 OK**(예전엔 이 API 응답에 아예 없었음 → None만 나왔을 것).

## 4. 눈 확인
- 종목 탭 → 대형주(삼성전자 등) 클릭 → 미리보기에 1주일전·1개월전·1년전 값 표시. **새로고침 반복해도** 1일전만 뜨고 나머지 '—' 되는 일 없음. 모바일 동일.
- 신규상장주만 '—'(정상).

## Cowork에게 보고
- ranking 응답에 r1w~r1y 실려오는지 + 미리보기 전 기간 표시 + 반복 새로고침에도 안정적인지.
