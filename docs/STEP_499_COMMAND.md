<!-- 2026-07-02 -->
# STEP 499 — 종목 클릭 → "AI보기" 진입 버튼 (4개 보드 → /stock/{symbol})

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_499_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
4개 보드(KR·US·JP·CN)에서 종목 클릭 상세에 **"AI보기" 버튼 → `/stock/{symbol}`** 링크 추가. 이걸로 "종목 → AI보기 → 렌즈 페이지" 동선 완성.
- **`/api/lens`는 Cowork이 이미 수정함**(KR 6자리 코드 → 야후 `.KS`/`.KQ` 자동 해석). 삼성전자(005930)도 렌즈가 뜸.
- 4개 보드 모두 **앵커가 동일** → 아래 2개 편집을 **파일 4개에 각각** 적용.
  - 모바일 바텀시트: `selectedStock.symbol` 사용
  - 데스크탑 펼침 패널: `r.symbol` 사용
- 클라이언트 컴포넌트라 HMR. 빌드·검증·커밋.

**대상 파일 4개:**
`components/toolbox/MarketBoard.tsx`(KR) · `UsMarketBoard.tsx` · `JpMarketBoard.tsx` · `CnMarketBoard.tsx`

---

## 1) 모바일 바텀시트에 AI보기 버튼 (파일 4개 각각)
**찾을 것** (4개 파일 모두 동일, 각 1회):
```tsx
              <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
```
**바꿀 것:**
```tsx
              <a
                href={`/stock/${selectedStock.symbol}`}
                className="mb-3 flex items-center justify-center gap-1.5 rounded-lg bg-unjong-primary py-2.5 text-sm font-semibold text-white active:opacity-90"
              >
                🧭 AI보기 — 기법별 전망
              </a>
              <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
```
> 주의: 상단 컨트롤 줄의 `증권사 바로가기`는 `className="text-sm font-bold ..."`(mb-1 없음)이라 매칭 안 됨 — **`mb-1` 있는 시트 쪽만** 바뀜(정상).

## 2) 데스크탑 펼침 패널에 AI보기 링크 (파일 4개 각각)
**찾을 것** (4개 파일 모두 동일, 각 1회):
```tsx
                          <span className="text-[11px] font-semibold text-unjong-muted">기간 수익률</span>
```
**바꿀 것:**
```tsx
                          <span className="text-[11px] font-semibold text-unjong-muted">기간 수익률</span>
                          <a href={`/stock/${r.symbol}`} className="text-[11px] font-semibold text-unjong-accent hover:underline">🧭 AI보기 →</a>
```

---

## 3) 빌드 + 클린 재시작
```bash
npm run build
```
> 빌드 에러 시 중단·보고.
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 4) 검증 (localhost:3333)
```bash
# KR 6자리 해석 확인(핵심) — 삼성전자 lens가 뜨는지
curl -s "http://localhost:3333/api/lens?symbol=005930" | python3 -c "import sys,json; d=json.load(sys.stdin); print('resolved:', d.get('resolved'), '| name:', d.get('name'), '| lenses:', len(d.get('lenses',[])))"
```
- [ ] 위 결과 `resolved: 005930.KS · name: Samsung Electronics · lenses: 3` (KR 해석 성공).
- [ ] 🇰🇷 종목 클릭 → 바텀시트(모바일)/펼침(데스크탑)에 **"🧭 AI보기"** 노출 → 누르면 `/stock/005930` 렌즈 페이지.
- [ ] 🇺🇸🇯🇵🇨🇳도 동일하게 AI보기 버튼 → 각 렌즈 페이지(NVDA·7203.T·0700.HK).
- [ ] 4개국 렌즈 페이지에 모멘텀·기술·밸류 카드 정상.

## 5) 커밋
```bash
git add app/api/lens/route.ts components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx components/toolbox/JpMarketBoard.tsx components/toolbox/CnMarketBoard.tsx && git commit -m "feat(lens): 종목 상세에 AI보기 진입 버튼(4개 보드) + KR 6자리→야후 심볼 해석 (STEP 499)" && git push
```

## ⚠️ 다음
- 이걸로 "종목 → AI보기 → 렌즈" 무료 동선 완성. 다음: (1) 재무 렌즈(F-Score·Z — 재무제표: KR=DART 키, US/JP/CN=야후 재무), (2) 유료 "AI보기"(LLM 종합: 뉴스·공시 맥락 해석) 온디맨드.
