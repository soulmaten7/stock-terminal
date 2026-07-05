<!-- 2026-07-05 -->
# STEP 579 — 렌즈 시간축(horizon) + 퍼센타일 API (백엔드 · 시간축 스트립 STEP A)

> **목표**: 각 렌즈에 `horizon`(단기/중기/장기) 부여 + `/api/lens`가 US 유니버스(lens_scores 1,000종목) 대비 **팩터별 방향 반영 퍼센타일**을 응답에 주입. UI(STEP B·시간축 스트립)의 데이터 토대. **소스는 Cowork이 이미 수정 + DB 함수도 이미 적용** → Claude Code는 **빌드 검증 + 커밋 + push**만.
> **전제 HEAD**: STEP 578 이후(세션 문서 매듭). ※ 이번은 소스(백엔드)만.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_579_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용 — 재수정 불필요)
- `lib/lenses.ts` — `LensRead`에 `horizon:"short"|"mid"|"long"`(필수) + `percentile?`(옵션) 추가. 6렌즈에 horizon 배선: 모멘텀=`mid`, 기술=`short`, 밸류·저변동·퀄리티·자산성장=`long`.
- `app/api/lens/route.ts` — `enrichPercentiles()`가 DB 함수 `lens_percentiles(symbol)` 호출해 모멘텀·퀄리티·저변동·밸류·자산성장 렌즈에 `percentile` 주입. 비US·유니버스 밖이면 null(방향만).
- `supabase/migrations/029_lens_percentiles.sql` — 방향별 퍼센타일 DB 함수(아카이브). **DB엔 Cowork이 MCP로 이미 적용 완료**(재적용 불필요).
- Cowork 사전 검증: `tsc --noEmit` EXIT=0 · DB 함수 NVDA(mom71·qual98·lowvol44·value40·ag3)·비US(005930=전부 null) 확인.

## 0) 빌드 검증
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|error:" | head -20
```
- [ ] "Compiled successfully"(또는 무에러). horizon 필수 필드는 6렌즈 모두 제공 → 통과.

## 1) (선택) 런타임 확인 — 퍼센타일 실제 주입되는지
```bash
cd ~/stock-terminal && (npm run dev >/tmp/lensdev.log 2>&1 &) ; sleep 14 ; \
echo "-- NVDA(US: horizon+percentile 떠야) --" ; curl -s "http://localhost:3000/api/lens?symbol=NVDA" | grep -oE '"(horizon|percentile)":("?[a-z0-9]+"?)' | sort -u ; \
echo "-- 005930(비US: percentile 없음/null·horizon만) --" ; curl -s "http://localhost:3000/api/lens?symbol=005930" | grep -oE '"horizon":"[a-z]+"' | sort -u ; \
pkill -f "next dev"
```
- [ ] NVDA 응답에 `"horizon"`(short/mid/long) + `"percentile"`(숫자) 존재. 005930은 horizon만.

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add lib/lenses.ts app/api/lens/route.ts supabase/migrations/029_lens_percentiles.sql docs/STEP_579_COMMAND.md && git commit -m "feat(lens): 시간축(horizon) 필드 + /api/lens 퍼센타일 주입(US 유니버스·방향별 lens_percentiles) — 시간축 스트립 백엔드 토대 (STEP 579)" && git push
```

## ✅ 여기까지 = STEP A(백엔드) 완료. 다음 = STEP B — 시간축 스트립 + 기법별 best-viz 카드(UI).
