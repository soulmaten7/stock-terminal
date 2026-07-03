<!-- 2026-07-03 -->
# STEP 542 — 기법 로스터·제품정의 문서화 + ① 밸류 라벨 정직화

> 3단계 계획(① 결과값 정직화 → ② UI/디자인 틀 → ③ 기법 추가)·제품 정의·기법 로스터를 문서에 박고, ①의 첫 항목(밸류 절대 verdict 제거) 반영.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_542_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
- **Cowork이 이미 작성/수정**:
  - `docs/LENS_ROADMAP.md`(신규) — 3단계 순서 + 현재 5 기법(등급) + 추가 후보(퀄리티·마법공식·주주환원 등).
  - `docs/BUSINESS_STRATEGY.md` — 결정 로그에 "제품 정의(포지셔닝)" 추가.
  - `lib/lenses.ts` — 밸류 라벨 `저평가/적정/고평가`(verdict) → **`낮음/보통/높음`(PER 수준 사실)**. 절대 임계값 verdict는 검증 밖이라 제거.
  - `app/stock/[symbol]/page.tsx` — `labelColor`에서 저평가(up)/고평가(down) 색 매핑 제거(밸류 라벨 중립 표시).
- ⚠️ lib/lenses는 API 라우트가 쓰니 클린 재시작.

## 0) 확인
```bash
cd ~/stock-terminal && ls docs/LENS_ROADMAP.md && grep -c "낮음" lib/lenses.ts && grep -c "저평가" lib/lenses.ts "app/stock/[symbol]/page.tsx"
```
- [ ] ROADMAP 존재, `낮음` 있음, `저평가` = **0**(양쪽 다 제거됨).

## 1) 빌드 + 클린 재시작
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
```

## 2) 검증
```bash
sleep 12 && curl -s "http://localhost:3333/api/lens?symbol=BRK-A" | python3 -c "import sys,json; d=json.load(sys.stdin); v=[x for x in d['lenses'] if x['key']=='valuation'][0]; print('long:',v['long'],'| PER:',v['detail'].get('PER'))"
```
- [ ] `long: 보통`(또는 낮음/높음) — "적정/저평가/고평가" 안 나옴.
- [ ] 브라우저 `/stock/BRK-A` 밸류 카드: "장기 보통"(초록·빨강 verdict 색 아님·중립).

## 3) 커밋
```bash
git add docs/LENS_ROADMAP.md docs/BUSINESS_STRATEGY.md lib/lenses.ts "app/stock/[symbol]/page.tsx" docs/STEP_542_COMMAND.md && git commit -m "feat(lens): 밸류 라벨 정직화(저평가/고평가 verdict→낮음/보통/높음) + 기법 로스터·제품정의 문서화 (STEP 542)" && git push
```

## ✅ 여기까지 = 3단계 계획·로스터 기록 + ①(밸류 라벨) 착수
## ▶ 다음 (①의 남은 것 / ②)
- ① 후속: 모멘텀 라벨 임계값(±20%) 근거화 or 서술화(선택).
- ② UI 틀: 신뢰도 등급 겉면 노출 · 엇갈림 표시 · "이 기법이란?"→"{기법} 알아보기" 문구.
