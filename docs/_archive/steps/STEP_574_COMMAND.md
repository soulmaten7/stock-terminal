<!-- 2026-07-04 -->
# STEP 574 — F-Score 카드 실물 반영 (표시 헌장 1호 적용) + 헌장 문서

> **목표**: 목업으로 확정한 **F-Score 카드 v6**을 실제 앱에 심는다 — 이름 크게 · [건전성] 등급 배지 · "부실 위험 체크" · "이게 뭐예요?" 박스 · 9칸 트래커 · 9항목 3그룹(수익성·재무·효율, 전문용어+쉬운 풀이) · 자세히(점수 기준·유래·왜 건전성). 상단 공지는 '신뢰도 등급 범례'로. + **표시 헌장** 문서 추가(나머지 6개 기준).
> **전제 HEAD**: `78bee8e`(STEP 573). Cowork이 소스 수정 완료 → Claude Code는 **tsc + 빌드 + 클린 재시작 + API 검증 + 커밋**. 눈검수(브라우저)는 Cowork이 배포 후.
> ⚠️ 페이지 라우트 + lib 변경 → 반드시 클린 재시작(`rm -rf .next`).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_574_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 Cowork이 이미 수정
- `lib/fscore.ts` — `FCriterion`에 `group`(수익성/재무 안정성/효율성) + `plain`(쉬운 풀이) 추가, 9항목에 배선. 라벨에서 ①~⑨ 제거.
- `lib/lensCopy.ts` — `fscore.what` = "재무가 튼튼한지 9가지로 점수 매겨요 — 돈 잘 버는지, 빚 감당되는지, 작년보다 나아졌는지."
- `app/stock/[symbol]/page.tsx` — `FScoreCard` v6 재구성 · 상단 공지 → 등급 범례 · 미사용 import(LENS_READINGS·SPECTRUM_LABELS·LENS_OUTLOOK) 제거.
- `docs/LENS_DISPLAY_CHARTER.md` (신규) — 표시 헌장(모든 카드 규칙 + F-Score 기준 템플릿).

## 0) 배선 확인
```bash
cd ~/stock-terminal
grep -cE "group:|plain:" lib/fscore.ts          # 10 (9항목 + 타입)
grep -cE "이게 뭐예요|c\.group|GROUPS|이 화면 읽는 법" "app/stock/[symbol]/page.tsx"   # 4+
for s in LENS_READINGS SPECTRUM_LABELS LENS_OUTLOOK; do echo -n "$s(0 기대): "; grep -c "$s" "app/stock/[symbol]/page.tsx"; done
```
- [ ] group/plain 10 · 새 요소 4+ · 제거 3심볼 모두 0.

## 1) 타입 검사 + 빌드
```bash
npx tsc --noEmit; echo "tsc EXIT=$?"
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed" | head -8
```
- [ ] `tsc EXIT=0` · "Compiled successfully". (미사용 변수 에러 없어야 — 있으면 로그 Cowork에.)

## 2) 클린 재시작 (라우트+lib 변경)
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
sleep 12
```

## 3) API 검증 — F-Score criteria에 group·plain 실림
```bash
curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); f=d.get('fscore') or {}; print('score:', f.get('score'), '/', f.get('max')); [print(' ', c['group'], '|', c['label'], '|', c['plain'], '|', ('통과' if c['pass'] else '미달')) for c in f.get('criteria',[])]"
```
- [ ] score 출력 + 9항목 각각 **group·label·plain·통과여부** 나옴(수익성/재무 안정성/효율성으로 묶임). = 카드가 3그룹으로 그릴 데이터 준비됨.

## 4) 커밋 + push
```bash
git add lib/fscore.ts lib/lensCopy.ts "app/stock/[symbol]/page.tsx" docs/LENS_DISPLAY_CHARTER.md docs/STEP_574_COMMAND.md && git commit -m "feat(lens): F-Score 카드 v6 실물 반영(이름 크게·이게 뭐예요·9칸 트래커·9항목 3그룹·전문용어+쉬운풀이·등급 범례) + 표시 헌장 문서 (STEP 574)" && git push
```

## ✅ 여기까지 = F-Score 카드 실물화(표시 헌장 1호). 배포되면 Cowork이 브라우저 눈검수(3그룹·트래커·범례).
## ▶ 다음 = Cowork 눈검수 → 미세 조정 → 나머지 6개 카드도 헌장 + 유료 레퍼런스 대조로 하나씩.
