<!-- 2026-07-02 -->
# STEP 498 — 렌즈 페이지 /stock/[symbol] (엔진 → 눈에 보이는 UI)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_498_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
STEP 497 엔진(/api/lens)을 **페이지로 시각화**. 종목별 `/stock/{symbol}` 접속 시 렌즈 3개(모멘텀·기술·밸류)를 단기/장기 라벨 + 근거 수치 카드로 표시. 상단에 "예측 아님·방향성 해석" 안내.
- **Cowork이 `app/stock/[symbol]/page.tsx` 이미 작성함**(클라이언트 컴포넌트, /api/lens fetch). 이 STEP = **빌드 + URL 검증 + 커밋**.
- 종목 클릭 → "AI보기" 진입 버튼 연결은 **STEP 499**(다음). 이번엔 URL 직접 접속으로 검증.
- 새 라우트지만 클라이언트 컴포넌트 + 기존 /api/lens 사용 → 클린 재시작 권장.

## 0) 파일 확인
```bash
cd ~/stock-terminal
ls -la "app/stock/[symbol]/page.tsx" lib/lenses.ts app/api/lens/route.ts
```

## 1) 빌드 + 클린 재시작
```bash
npm run build
```
> 타입/빌드 에러 시 중단·보고.
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 2) 검증 (localhost:3333) — URL 직접 접속
브라우저(또는 curl로 HTML 200 확인) 로 아래 접속:
- http://localhost:3333/stock/NVDA
- http://localhost:3333/stock/005930.KS  (삼성전자)
- http://localhost:3333/stock/7203.T  (도요타)
- http://localhost:3333/stock/0700.HK  (텐센트)
```bash
for s in NVDA 005930.KS 7203.T 0700.HK; do echo -n "$s → "; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3333/stock/$s"; done
```
- [ ] 각 페이지에 종목명·현재가 + 렌즈 3개 카드(모멘텀·기술·밸류) — 단기/장기 라벨 색상 + 근거 수치.
- [ ] 상단 "🧭 예측 아니라 방향성 해석" 안내 노출.
- [ ] 라벨 색: 강세·상승추세·저평가=상승색, 약세·하락추세·고평가·침체=하락색, 과열=주황, 중립·적정=회색.
- [ ] 로딩 스켈레톤 → 데이터 표시 정상.

## 3) 커밋
```bash
git add "app/stock/[symbol]/page.tsx" && git commit -m "feat(lens): 종목 렌즈 페이지 /stock/[symbol] — 렌즈 3개 카드 UI (STEP 498)" && git push
```

## ⚠️ 다음 (STEP 499 예정)
- 각 보드(KR·US·JP·CN) 종목 클릭 상세(바텀시트/펼침)에 **"AI보기" 버튼 → /stock/{symbol}** 링크 추가(진입점).
- 이후: 재무 렌즈(F-Score·Z — 재무제표 필요) → 유료 "AI보기"(LLM 종합).
