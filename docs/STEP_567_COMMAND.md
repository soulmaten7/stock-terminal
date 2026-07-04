<!-- 2026-07-03 -->
# STEP 567 — 렌즈 카드 패밀리룩 템플릿 (3구간 스펙트럼 + "그래서 뭐" + 알아보기 위치)

> 세계최고 디자이너 방향(대화 확정): "박스"만 예쁜 걸 넘어, **모든 기법이 같은 뼈대**로 = 패밀리룩. 핵심 = "이 종목이 이 기법 눈엔 어디쯤인가"를 글자가 아니라 **3구간 스펙트럼(위치)**으로. + F-Score "4/9"에 척도·"그래서 뭐" 붙이고 알아보기를 근거 위로.
> Cowork이 소스 수정 완료(tsc EXIT=0). Claude Code는 **빌드 + 재시작 + 눈검수 + 커밋**. ⚠️ API에 spectrum·headline 필드 추가 → 클린 재시작.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_567_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (Cowork이 이미 수정)
- `lib/lensCopy.ts` — `SPECTRUM_LABELS`(7기법 3구간 라벨 ko/en) 추가 + F-Score "그래서 뭐" 카피 강화.
- `lib/lenses.ts` — `LensRead`에 `spectrum{labels,active}`·`headline` 추가, 6렌즈가 상태로 active 계산 + 핵심 숫자.
- `app/stock/[symbol]/page.tsx` — `<Spectrum>` 컴포넌트(3구간 세그먼트·켜진 칸만 색조) + 드로어 **재배치**: 판정+핵심숫자 → **스펙트럼** → "그래서 뭐" → 알아보기 → 근거 수치 → 단기/장기 → 자세히. F-Score도 동일(척도+점수+9항목).

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "SPECTRUM_LABELS\|spectrum\|Spectrum" app/stock/\[symbol\]/page.tsx lib/lenses.ts lib/lensCopy.ts
```
- [ ] 3파일 모두 1+.

## 1) 빌드 + 클린 재시작
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
```
- [ ] "Compiled successfully".

## 2) 검증(API) + 눈검수(스크린샷)
```bash
sleep 12
curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); m=[x for x in d['lenses'] if x['key']=='momentum'][0]; print(m.get('spectrum'), m.get('headline'))"
```
- [ ] `{'labels': ['약세','중립','강세'], 'active': 2} 12-1 36.57%` 형태.
- 브라우저 `/stock/NVDA` **각 기법 펼침**:
  - [ ] 판정 밑에 **3구간 스펙트럼** — 이 종목 해당 칸만 색(강세/비쌈/보통 등). 모든 기법 동일 모양(패밀리룩).
  - [ ] F-Score: "보통 수준의 재무 · 점수 4/9" → **[약함·보통·튼튼] 보통 켜짐** → "재무 건전성은 중간… 예측 아님" → 알아보기 → 9항목.
  - [ ] 모바일에서도 스펙트럼 3칸 안 깨짐.
- 스크린샷(펼침 2~3개 + 모바일) Cowork 공유.

## 3) 커밋
```bash
git add lib/lensCopy.ts lib/lenses.ts app/stock/\[symbol\]/page.tsx docs/STEP_567_COMMAND.md && git commit -m "feat(ui): 렌즈 카드 패밀리룩 — 3구간 스펙트럼(이 종목 위치)+핵심숫자+F-Score 척도/그래서뭐+알아보기 위치 (STEP 567)" && git push
```

## ✅ 여기까지 = 모든 기법이 같은 뼈대(스펙트럼) · F-Score "4/9" 이해됨
## ▶ 다음
- 스크린샷 보고 스펙트럼 색·간격 미세 조정 → 확정되면 세션 문서 갱신(564~567).
