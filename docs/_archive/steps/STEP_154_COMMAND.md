<!-- 2026-06-04 -->
# STEP 154 — 마켓 시가총액 필터 (KIS 신규 랭킹 엔드포인트)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음 Claude Code 에서: `@docs/STEP_154_COMMAND.md 파일 내용대로 실행해줘`

## 목표
마켓 국내 랭킹에 **시가총액 상위 필터** 추가. KIS 시가총액 랭킹 엔드포인트(`FHPST01740000`)를 신규 라우트로 만들고(기존 `volume-rank` 구조 그대로), `MarketClient` 에 "시가총액" 필터 한 개 추가.
> 52주·인기 필터는 시총이 검증되면 STEP 155 로. 업종 히트맵은 STEP 156.

## 전제 상태
- HEAD: `33e72f7` (STEP 153) — docs `34ee44e`
- 빌드 ✓ / git clean / 변경: 신규 1 + 수정 1.

## 설계 (안전성)
- 새 라우트는 **검증된 `volume-rank` 라우트 구조를 그대로 미러링** — `fetchKisApi({ endpoint, trId, params })`.
- **표준 KIS 필드만 사용**: `mksc_shrn_iscd`·`hts_kor_isnm`·`stck_prpr`·`prdy_ctrt`·`acml_vol` (volume-rank·movers 와 동일 검증 필드). 랭킹 순서는 KIS 가 서버에서 시총순 정렬 → 시총 전용 필드명 불확실성 회피.
- 반환 shape `{ stocks: [...] }` — MarketClient 의 기존 `j.stocks ?? j.items` 파싱에 그대로 맞음.
- ⚠️ 만약 시총 필터가 빈 데이터면: KIS 엔드포인트/tr_id 응답 확인 필요(아래 주의 참조). 빌드/런타임은 안전(빈 결과만).

---

## 작업 1/2 — 신규 라우트: `app/api/kis/market-cap/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 국내주식 시가총액 상위 (KIS tr_id: FHPST01740000)
// ?market=all|kospi|kosdaq (default: all) · ?limit (default 30, max 30)
export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market') || 'all';
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '30', 10) || 30,
    30
  );
  const iscd = market === 'kospi' ? '0001' : market === 'kosdaq' ? '1001' : '0000';

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/ranking/market-cap',
      trId: 'FHPST01740000',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '20174',
        FID_INPUT_ISCD: iscd,
        FID_DIV_CLS_CODE: '0',
        FID_TRGT_CLS_CODE: '0',
        FID_TRGT_EXLS_CLS_CODE: '0',
        FID_INPUT_PRICE_1: '0',
        FID_INPUT_PRICE_2: '0',
        FID_VOL_CNT: '0',
      },
    });

    const items = (data.output || []).slice(0, limit).map((item: Record<string, string>, idx: number) => {
      const price = parseInt(item.stck_prpr || '0', 10);
      const volume = parseInt(item.acml_vol || '0', 10);
      return {
        rank: idx + 1,
        symbol: item.mksc_shrn_iscd || '',
        name: item.hts_kor_isnm || '',
        price,
        changePercent: parseFloat(item.prdy_ctrt || '0'),
        volume,
        tradeAmount: price * volume,
      };
    });

    return NextResponse.json({ stocks: items });
  } catch (err) {
    console.error('[api/kis/market-cap]', err);
    return NextResponse.json({ stocks: [], error: String(err) }, { status: 502 });
  }
}
```

> `volume-rank/route.ts` 와 동일한 패턴(엔드포인트·tr_id·정렬만 다름). `console.error` 는 기존 KIS 라우트들과 동일한 에러 로깅(허용).

---

## 작업 2/2 — 필터 추가: `components/market/MarketClient.tsx` (부분 교체 3곳)

### ① FilterKey 에 "cap" 추가
**찾기:**
```tsx
type FilterKey = "amount" | "volume" | "up" | "down";
```
**바꾸기:**
```tsx
type FilterKey = "amount" | "volume" | "cap" | "up" | "down";
```

### ② KR_FILTERS 에 시가총액 추가
**찾기:**
```tsx
const KR_FILTERS: FilterDef[] = [
  { key: "amount", label: "거래대금" },
  { key: "volume", label: "거래량" },
  { key: "up", label: "상승" },
  { key: "down", label: "하락" },
];
```
**바꾸기:**
```tsx
const KR_FILTERS: FilterDef[] = [
  { key: "amount", label: "거래대금" },
  { key: "volume", label: "거래량" },
  { key: "cap", label: "시가총액" },
  { key: "up", label: "상승" },
  { key: "down", label: "하락" },
];
```

### ③ 국내 fetch 에 시총 분기 추가
**찾기:**
```tsx
          const url =
            filter === "amount" || filter === "volume"
              ? `/api/kis/volume-rank?market=${market}&sort=${filter}&limit=30`
              : `/api/kis/movers?dir=${filter}&market=${market}&limit=30`;
```
**바꾸기:**
```tsx
          const url =
            filter === "amount" || filter === "volume"
              ? `/api/kis/volume-rank?market=${market}&sort=${filter}&limit=30`
              : filter === "cap"
              ? `/api/kis/market-cap?market=${market}&limit=30`
              : `/api/kis/movers?dir=${filter}&market=${market}&limit=30`;
```

> (선택) 헤더 문구 `(시총·52주 필터·히트맵은 순차 확장)` → `(52주 필터·히트맵은 순차 확장)` 로 바꿔도 됨. 안 바꿔도 무방.

---

## 작업 3/3 — 빌드 검증 + 커밋·푸시

```bash
cd ~/stock-terminal && npm run build
```

빌드 ✓ (exit 0) 확인 후:

```bash
cd ~/stock-terminal && git add app/api/kis/market-cap/route.ts components/market/MarketClient.tsx && git commit -m "feat(v7): 마켓 시가총액 필터 — KIS market-cap 랭킹(FHPST01740000) 신규 라우트 + MarketClient 필터 (STEP 154)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 여부
- [ ] 커밋 해시 + `git push` 성공 여부
- [ ] (확인) `npm run dev` → `/market` 국내 탭에 **"시가총액"** 필터 → 삼성전자 등 시총 큰 종목 순으로 뜨는지

## 주의·예상 이슈
- 시총 필터가 **빈 데이터("데이터 없음")** 면 KIS 엔드포인트 응답 확인:
  - `curl` 대신 dev 서버에서 `http://localhost:3333/api/kis/market-cap` 직접 열어 `error` 메시지 확인
  - tr_id 가 다르면 후보: `FHPST01740000`(현재) — 응답 에러 시 Cowork 에게 에러 메시지 전달 → 보정
  - 빌드/런타임은 안전(빈 결과만 반환, 크래시 X)
- 새 라우트는 표준 필드(`mksc_shrn_iscd` 등)만 사용 → volume-rank 와 동일하게 동작 예상.
- 시총 랭킹도 거래대금 칸은 `price*volume` 로 계산(volume-rank 와 동일).

---
> STEP 154 = V7 마켓 시총 필터. 전제 `33e72f7` → 커밋 후 다음(155) = 52주·인기 필터(같은 패턴) / (156) 업종 히트맵. 문서는 묶어서 갱신.
