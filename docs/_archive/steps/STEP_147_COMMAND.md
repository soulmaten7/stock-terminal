<!-- 2026-06-04 -->
# STEP 147 — 종목 메타 보강 (외국인 소진율 + 상장주식수)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음 Claude Code 에서: `@docs/STEP_147_COMMAND.md 파일 내용대로 실행해줘`

## 목표
종목 페이지 좌측 `StockInfoPanel` 재무 섹션에 **외국인 소진율**·**상장주식수** 두 행을 추가한다. (PLAYBOOK §11 P1 — 정보 깊이)
한국(KIS) 전용. 둘 다 KIS `inquire-price` 응답에 이미 들어오는 표준 필드(매핑만 안 돼 있음).

## 전제 상태 (이 커밋 위에서 작업)
- HEAD: `98b68e2` (STEP 144·145 docs)
- 빌드: ✓ / 브랜치: `main`
- 변경 파일은 아래 2개뿐.

## 설계 (왜 이렇게 하나)
- **명칭 정확성** — KIS `hts_frgn_ehrt` 는 엄밀히 "외국인 **소진율**"(외국인 보유 ÷ 외국인 한도). 한도 100% 종목은 보유율과 동일하지만, 한도 제한 종목(통신·전력 등)은 다르다. 운종은 신뢰 플랫폼이므로 **정확한 명칭 "외국인 소진율"** 로 표기. (네이버 증권도 "외국인소진율" 사용)
- **상장주식수** = `lstn_stcn`. 억/만 단위로 축약 표기.
- 한국 전용 — 미국(Yahoo)엔 0 으로 두고 행 자체를 안 그림(`isKr && 값>0` 가드).
- 값 없으면 행 미표시(graceful). 새 의존성·DB 변경 0.

---

## 작업 1/2 — API: `app/api/kis/price/route.ts` (파일 전체 교체)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/inquire-price',
      trId: 'FHKST01010100',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: symbol,
      },
    });

    const o = data.output;
    if (!o) {
      return NextResponse.json({ error: 'No data', raw: data });
    }

    return NextResponse.json({
      symbol,
      name: o.hts_kor_isnm,
      price: parseInt(o.stck_prpr, 10),
      change: parseInt(o.prdy_vrss, 10),
      changePercent: parseFloat(o.prdy_ctrt),
      changeSign: o.prdy_vrss_sign,
      open: parseInt(o.stck_oprc, 10),
      high: parseInt(o.stck_hgpr, 10),
      low: parseInt(o.stck_lwpr, 10),
      volume: parseInt(o.acml_vol, 10),
      tradeAmount: parseInt(o.acml_tr_pbmn, 10),
      high52w: parseInt(o.w52_hgpr || o.stck_dryc_hgpr || '0', 10),
      low52w: parseInt(o.w52_lwpr || o.stck_dryc_lwpr || '0', 10),
      per: parseFloat(o.per || '0'),
      pbr: parseFloat(o.pbr || '0'),
      marketCap: parseInt(o.hts_avls || '0', 10),
      dividendYield: parseFloat(o.divi_yield_ratio || o.stck_dryy_divi_rate || '0') || null,
      listedShares: parseInt(o.lstn_stcn || '0', 10),
      foreignRatio: parseFloat(o.hts_frgn_ehrt || '0') || 0,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```
> 추가된 2줄: `listedShares`(상장주식수 `lstn_stcn`) · `foreignRatio`(외국인 소진율 `hts_frgn_ehrt`).

---

## 작업 2/2 — 컴포넌트: `components/stock/StockInfoPanel.tsx` (아래 5곳 **정확히 찾아 교체**)

> 긴 차트 로직은 건드리지 않기 위해 전체 교체 대신 **부분 교체 5건**. 각 블록을 그대로 찾아 바꿀 것.

### ① StockData 타입에 2필드 추가
**찾기:**
```tsx
  tradeAmount: number;
  dividendYield: number;
};
```
**바꾸기:**
```tsx
  tradeAmount: number;
  dividendYield: number;
  listedShares: number;
  foreignRatio: number;
};
```

### ② 한국(KIS) 매핑에 2필드 추가
**찾기:**
```tsx
            tradeAmount: json.tradeAmount ?? 0,
            dividendYield: json.dividendYield ?? 0,
          });
        } else if (/^[A-Z.\-]+$/.test(symbol)) {
```
**바꾸기:**
```tsx
            tradeAmount: json.tradeAmount ?? 0,
            dividendYield: json.dividendYield ?? 0,
            listedShares: json.listedShares ?? 0,
            foreignRatio: json.foreignRatio ?? 0,
          });
        } else if (/^[A-Z.\-]+$/.test(symbol)) {
```

### ③ 미국(Yahoo) 매핑에 2필드 추가 (0 으로)
**찾기:**
```tsx
            tradeAmount: 0,
            dividendYield: json.dividendYield ?? 0,
          });
        }
```
**바꾸기:**
```tsx
            tradeAmount: 0,
            dividendYield: json.dividendYield ?? 0,
            listedShares: 0,
            foreignRatio: 0,
          });
        }
```

### ④ 재무 섹션에 행 2개 추가 (한국 전용 가드)
**찾기:**
```tsx
            {data.dividendYield > 0 && <Row label="배당수익률" value={formatPct(data.dividendYield, 2)} />}
          </section>
```
**바꾸기:**
```tsx
            {data.dividendYield > 0 && <Row label="배당수익률" value={formatPct(data.dividendYield, 2)} />}
            {isKr && data.foreignRatio > 0 && <Row label="외국인 소진율" value={formatPct(data.foreignRatio, 2)} />}
            {isKr && data.listedShares > 0 && <Row label="상장주식수" value={formatShares(data.listedShares)} />}
          </section>
```

### ⑤ formatShares 헬퍼 추가
**찾기:**
```tsx
function Row({ label, value }: { label: string; value: string }) {
```
**바꾸기:**
```tsx
function formatShares(n: number): string {
  if (!n || n <= 0) return "—";
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억주`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(0)}만주`;
  return `${n.toLocaleString()}주`;
}

function Row({ label, value }: { label: string; value: string }) {
```

---

## 작업 3/3 — 빌드 검증 + 커밋·푸시

```bash
cd ~/stock-terminal && npm run build
```

빌드 ✓ (exit 0) 확인 후:

```bash
cd ~/stock-terminal && git add app/api/kis/price/route.ts components/stock/StockInfoPanel.tsx && git commit -m "feat(v6): 종목 메타 보강 — StockInfoPanel 외국인 소진율·상장주식수 행 추가 (KIS lstn_stcn·hts_frgn_ehrt, 한국 전용) (STEP 147)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 여부
- [ ] 커밋 해시 + `git push` 성공 여부
- [ ] (가능하면) `npm run dev` → 한국 종목 페이지(예: `/stock/005930`) 좌측 재무에 "외국인 소진율"·"상장주식수" 보이는지

## 주의·예상 이슈
- `hts_frgn_ehrt`·`lstn_stcn` 은 KIS FHKST01010100 표준 출력 필드. 기존 `hts_avls`·`w52_hgpr` 와 같은 응답(`o`)에서 옴.
- 만약 두 행이 안 보이면(값 0): KIS 응답 키 확인 필요(드물게 버전차). 현재는 값 0 이면 행을 안 그리도록 가드 → **빌드/런타임 안전**, 최악의 경우 "행 미표시"뿐.
- 미국 종목은 두 행 미표시(의도). `isKr` 가드.
- `formatPct`·`isKr` 는 이 파일에서 이미 쓰는 검증된 함수/변수.

---
> STEP 147 = PLAYBOOK §11 P1 "외국인보유율·상장주식수 메타". 전제 `98b68e2` → 이 STEP 코드 커밋 후 Cowork 이 문서 갱신.
