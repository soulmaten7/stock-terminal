<!-- 2026-07-03 -->
# STEP 547 — 개념(알아보기) 언어별 맵 이전 (카드 사용자 텍스트 전부 다국어)

> STEP 546은 겉면(이름·요약). 이번엔 **"알아보기(개념·유래)"까지 ko/en 맵으로** → 카드 반쯤 다국어 상태 해소. 사용자에게 보이는 텍스트 전부 언어 맵에(제일 깊은 "자세히·검증"만 KO 유지, 후순위).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_547_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
- **Cowork이 이미 수정**: `lib/lensCopy.ts`(각 렌즈+F-Score에 `about` ko/en 추가), `lib/lenses.ts`(4개 렌즈 `about: c.about`), `app/stock/[symbol]/page.tsx`(F-Score 알아보기 문구 → 맵), `docs/LENS_COPY.md`(개념 메모).
- ⚠️ lib 변경 → 클린 재시작.

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "about:" lib/lensCopy.ts && grep -c 'about: c.about' lib/lenses.ts
```
- [ ] lensCopy about ≥ 10(5기법×2언어), lenses `about: c.about` = 4.

## 1) 빌드 + 클린 재시작
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
```
- [ ] "Compiled successfully".

## 2) 검증 — 개념 ko/en
```bash
sleep 12
echo "== ko about ==" && curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['lenses'][0]['about'][:45])"
echo "== en about ==" && curl -s "http://localhost:3333/api/lens?symbol=NVDA&lang=en" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['lenses'][0]['about'][:55])"
```
- [ ] ko: `오른 주식은 한동안 더 오르는 '관성'…`
- [ ] en: `The idea that stocks which have been rising…`
- [ ] 브라우저 `/stock/BRK-A`: "모멘텀 알아보기" 펼치면 개념 정상.

## 3) 커밋
```bash
git add lib/lensCopy.ts lib/lenses.ts "app/stock/[symbol]/page.tsx" docs/LENS_COPY.md docs/STEP_547_COMMAND.md && git commit -m "feat(lens): 개념(알아보기) ko/en 언어별 맵 이전 — 카드 사용자 텍스트 전부 다국어(자세히만 KO) (STEP 547)" && git push
```

## ✅ 여기까지 = 카드 사용자 텍스트 다국어 완료 (이름·요약·개념)
## ▶ 다음 후보
- "자세히(검증)" 텍스트도 맵으로(후순위) · 일본어·중국어 열 추가 · 배포+모바일 눈검수 · ③ 퀄리티(QMJ) 착수.
