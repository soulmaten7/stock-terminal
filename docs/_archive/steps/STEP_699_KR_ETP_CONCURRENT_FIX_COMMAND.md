<!-- 2026-07-11 -->
# STEP 699 — 🐞 ETF/ETN 크론 r1w·r3m·r6m Vercel서만 null (순차 HTTP) — 동시조회로 수정

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 코드 **Cowork·`tsc`=0.** 원인 확정 + **샌드박스(클라우드 리눅스)에서 코드 정확성 실측 증명**(전 기간 풀채움). 이 STEP = 커밋/푸시 + 크론 재트리거 + 라이브확인. **안 되면 폴백(§7) 즉시 보고.**

**배경:** STEP 698(거래일 판정 수정) 후에도 **Vercel 크론**이 r1w·r3m·r6m을 여전히 0으로 채움. 반면 라우트 `?debug=1`(동일 수정)은 거래일을 정확히 찾음.
**원인(확정):** `krEtpSnapshot.buildKind`가 과거 5기간을 **순차 조회**했는데, **Vercel 서버리스↔KRX 평문 HTTP는 keep-alive 커넥션을 재사용하다 두 번째(재조회 i=1) 호출이 죽음**. 주말→거래일로 한 칸 물러나는 offset(r1w·r3m·r6m)만 재조회가 필요해 걸림. 종목보드 크론(krSnapshot)·라우트는 **`Promise.all` 동시조회**라 신선한 커넥션 → 정상.
**증거:** Cowork 샌드박스(클라우드 리눅스)에서 동일 로직 실행 → `r1w 1139·r1m 1130·r3m 1076·r6m 1041·r1y 946`(base 1141) **풀채움**. 코드는 정답, 순차조회만 문제.

**바뀐 것(Cowork·tsc=0):** `lib/krEtpSnapshot.ts` `buildKind` — base+5기간을 **`Promise.all` 동시조회**로(종목보드 크론과 동일 패턴).

---

## 1. 임시파일 정리 + 로컬
```bash
rm -f _probe_tmp.mjs _probe_lens.ts
npm install && npm test && npx tsc --noEmit && npm run build 2>&1 | tail -6
```

## 2. CHANGELOG
```
- **699**: 🐞 ETF/ETN 크론 r1w·r3m·r6m Vercel서만 null 재발 수정 — 순차 조회가 Vercel↔KRX 평문 HTTP keep-alive 재사용으로 재조회 실패. buildKind를 Promise.all 동시조회로(종목보드 크론과 동일). 샌드박스 실측 풀채움 확인.
```

## 3. 커밋 → 푸시
```bash
git add lib/krEtpSnapshot.ts docs/CHANGELOG.md docs/STEP_699_KR_ETP_CONCURRENT_FIX_COMMAND.md
git commit -m "fix(kr): ETF/ETN 크론 동시조회(Promise.all) — Vercel 순차 HTTP keep-alive 재조회 실패 해소"
git push
```

## 4. CI 초록불.

## 5. 배포 후 크론 재트리거
```bash
SECRET=$(grep -E '^CRON_SECRET=' .env.local | cut -d= -f2- | tr -d '"')
curl -s -H "Authorization: Bearer $SECRET" "https://onetrillion.app/api/cron/kr-etp"; echo
```

## 6. 라이브 확인 ★
```bash
for k in etf etn; do echo "== $k =="; curl -s "https://onetrillion.app/api/krx/$k-performance" | python3 -c "import sys,json;d=json.load(sys.stdin);it=d.get('items',[]);f=lambda p:sum(1 for x in it if x.get(p) is not None);print('source',d.get('source'),'items',len(it),'| r1w',f('r1w'),'r1m',f('r1m'),'r3m',f('r3m'),'r6m',f('r6m'),'r1y',f('r1y'))"; done
```
- **r1w·r3m·r6m 채움 수가 대부분**(예 90+/100)이면 성공.

## 7. ⚠️ 폴백 (동시조회로도 여전히 0이면 — 코드 아닌 Vercel↔KRX 환경 문제 확정)
- **더 고치지 말고 Cowork에 "동시조회로도 Vercel 크론 여전히 0" 보고.** → Cowork이 크론을 **off-Vercel(GitHub Actions)**로 이전(VN STEP 672C 선례·Cowork 샌드박스로 클라우드 리눅스=정상 확인됨). 라우트는 이미 스냅샷 우선이라 표시에는 영향 없음.

## Cowork에게 보고
- 크론 `ok:true` + 두 라우트 r1w·r3m·r6m 채움 수(0 → 대부분). **안 되면 즉시 보고(§7 폴백).**
