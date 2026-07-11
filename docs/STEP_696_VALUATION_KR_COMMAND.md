<!-- 2026-07-11 -->
# STEP 696 — 🔭 밸류(가치) 렌즈 한국 활성화 — 맥 test·build·커밋 + 배포 후 라이브확인

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 코드는 **Cowork(Opus)가 작성·`tsc --noEmit`=0.** vitest는 Cowork 샌드박스 node_modules 아키텍처 불일치로 못 돌림 → **맥 `npm test` + CI + 배포 라이브확인이 진짜 게이트.** 이 STEP = 임시파일 정리 + 맥 test·build + 커밋/푸시 + 배포 후 라이브확인.

**배경(한국탭 완성 STEP①):** 밸류(가치) 렌즈가 **한국 종목 전부 "산출 불가"**였음. 야후가 .KS/.KQ에 `trailingPE`·`priceToBook`을 **null**로 줘서(US는 줌) 6개 렌즈 중 1개가 홈마켓서 빔. 프로브로 확인하니 `fundamentalsTimeSeries`엔 `netIncome`·`ordinarySharesNumber`·`stockholdersEquity`가 다 옴(삼성 44.3조·66.3억·424조) → **재무로 PER·PBR 직접 산출**.

**바뀐 것(Cowork이 이미 작성·tsc=0):**
- `lib/returns.ts` — 순수함수 `marketCap`·`perFrom`(=시총/순이익, 적자면 null)·`pbrFrom`(=시총/자기자본) 추가.
- `lib/returns.test.ts` — 밸류 파생 테스트 4개 추가(총 **7개**: pct 3 + 밸류 4). 삼성 실측값 포함.
- `lib/fscore.ts` — `FRow`에 `stockholdersEquity?` 추가.
- `lib/lensCompute.ts` — 재무 fetch를 렌즈 배열 **앞으로** 이동(공용), `pe`/`pb`가 null일 때만 재무로 폴백, `stockholdersEquity` 매핑(`stockholdersEquity ?? commonStockEquity`). **US 경로 무영향**(야후가 주면 그대로).
- `docs/LENS_DEV_PLAYBOOK.md` — 문제해결 로그 #29.

---

## 1. 임시 프로브 파일 정리 + 로컬(맥) 검증
```bash
rm -f _probe_tmp.mjs _probe_lens.ts   # Cowork 샌드박스가 남긴 임시 프로브(삭제 안 되던 것) 제거
npm install                            # 맥용 바이너리 동기화
npm test                               # ✅ 7 passed 기대 (pct 3 + 밸류 4)
npx tsc --noEmit                       # 0
npm run build 2>&1 | tail -6           # 빌드 성공
```
- 실패 시 커밋 금지·Cowork 보고.

## 2. CHANGELOG (오늘 블록에 추가)
```
- **696**: 🔭 밸류(가치) 렌즈 **한국 활성화** — 야후가 .KS에 PER/PBR을 안 줘 전 종목 "산출 불가"였음 → 재무(순이익·자기자본·주식수)로 PER=시총/순이익·PBR=시총/자기자본 직접 산출(pe/pb null일 때만 폴백, US 무영향). 순수함수 perFrom·pbrFrom + 유닛테스트. (LENS_DEV #29)
```

## 3. 커밋 → 푸시 (파일 명시)
```bash
git add lib/returns.ts lib/returns.test.ts lib/fscore.ts lib/lensCompute.ts docs/LENS_DEV_PLAYBOOK.md docs/CHANGELOG.md docs/STEP_696_VALUATION_KR_COMMAND.md
git commit -m "feat(lens): 밸류(가치) 렌즈 한국 활성화 — 재무로 PER/PBR 직접 산출(야후 .KS null 폴백)"
git push
```

## 4. CI 초록불 (Actions 탭) — Typecheck·Unit tests 통과 확인.

## 5. 배포 후 라이브확인 ★ 진짜 게이트
```bash
for s in 005930 000660 035420; do echo "== $s =="; curl -s "https://onetrillion.app/api/lens?symbol=$s" | python3 -c "import sys,json;d=json.load(sys.stdin);v=[l for l in d['lenses'] if l['key']=='valuation'][0];print('detail',v['detail'],'| state',v['state'],'| headline',v['headline'])"; done
```
- 삼성전자·SK하이닉스·NAVER 밸류 렌즈에 **PER·PBR 숫자**가 뜨고 `state`가 `na`가 아니면 성공. (적자 종목은 PER null이 정상.)

## Cowork에게 보고
- `npm test` 7 passed · build 성공 · CI 초록불 + 라이브 3종목 밸류 PER/PBR 채워졌는지(state≠na).
