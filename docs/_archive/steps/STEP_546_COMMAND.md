<!-- 2026-07-03 -->
# STEP 546 — 렌즈 겉면 카피 쉬운말화 + 언어별 맵(ko/en) 배선

> "이 기법이 뭔지"를 처음 듣는 사람도 이해하게 쉬운 말로 + **언어별 맵**(이름=영문 앵커·설명만 언어별). TRAI가 본체 될 것이므로 언어 표현 품질 = 핵심. 기본 ko, `?lang=en` 지원.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_546_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
- **Cowork이 이미 작성/수정**:
  - `docs/LENS_COPY.md`(신규) — 겉면 카피 언어별 원본(캐논).
  - `lib/lensCopy.ts`(신규) — `LENS_COPY`(ko/en 맵) + `pickLocale`.
  - `lib/lenses.ts` — 4개 렌즈 `locale='ko'` 파라미터 + name·summary를 맵에서 읽음.
  - `app/api/lens/route.ts` — `?lang`로 locale 결정(기본 ko), 렌즈에 전달, 캐시 키 `symbol:locale`.
  - `lib/fscore.ts` — F-Score 미적용 문구를 쉬운 말로("은행·보험이라 점수를 낼 수 없어요…").
  - `app/stock/[symbol]/page.tsx` — F-Score "what" 문구를 맵에서.
- ⚠️ API 라우트 변경 → 클린 재시작.

## 0) 확인
```bash
cd ~/stock-terminal && ls docs/LENS_COPY.md lib/lensCopy.ts && grep -c "LENS_COPY" lib/lenses.ts && grep -c "lang" app/api/lens/route.ts
```
- [ ] 두 파일 존재, lenses에서 LENS_COPY 사용, route에 lang.

## 1) 빌드 + 클린 재시작
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
```
- [ ] "Compiled successfully".

## 2) 검증 — 한국어(기본) + 영어(?lang=en)
```bash
sleep 12
echo "== ko ==" && curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); m=d['lenses'][0]; print(m['name'],'|',m['summary'][:40])"
echo "== en ==" && curl -s "http://localhost:3333/api/lens?symbol=NVDA&lang=en" | python3 -c "import sys,json; d=json.load(sys.stdin); m=d['lenses'][0]; print(m['name'],'|',m['summary'][:50])"
```
- [ ] ko: `모멘텀 | 요즘 강하게 오른 종목이 계속 갈지…`
- [ ] en: `Momentum | Whether a stock that's been climbing…`
- [ ] 브라우저 `/stock/BRK-A`: F-Score "이 종목은 은행·보험이라 점수를 낼 수 없어요…"(쉬운 말). 각 카드 요약도 쉬운 말.

## 3) 커밋
```bash
git add docs/LENS_COPY.md lib/lensCopy.ts lib/lenses.ts app/api/lens/route.ts lib/fscore.ts "app/stock/[symbol]/page.tsx" docs/STEP_546_COMMAND.md && git commit -m "feat(lens): 겉면 카피 쉬운말+언어별 맵(ko/en)·API ?lang·F-Score 미적용 문구 정직화 (STEP 546)" && git push
```

## ✅ 여기까지 = 겉면 카피 쉬운말·다국어 구조 확립
- 이름=영문 앵커, 설명=언어별(네이티브). ko 라이브·en 준비(맵). 언어 선택기 배선은 en 출시 때.
## ▶ 다음 후보
- 접힌 텍스트(알아보기·자세히)도 언어별 맵으로 · 일본어·중국어 열 추가 · 배포+모바일 눈검수 · ③ 퀄리티(QMJ).
