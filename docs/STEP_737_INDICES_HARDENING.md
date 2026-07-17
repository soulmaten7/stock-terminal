# STEP 737 — 지수 티커 API 서버 하드닝 (빈 응답 근절)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** 직전 커밋 = 티커 클라이언트 견고화(HomeIndexStrip: 빈 응답 미덮어쓰기 + 5초 재시도).
**대상 파일:** `app/api/yahoo/indices/route.ts` (단일 파일).

## 목표
`/api/yahoo/indices`가 간헐적으로 `{items:[]}`(200)를 반환하는 근본 원인 제거.
- **원인:** 21개 심볼을 `Promise.all`로 병렬 조회하는데, `INDEX_SYMBOLS.map`의 `yf.quote`가 심볼 하나라도 throw하면 `Promise.all` 전체가 reject → 바깥 catch → 빈 배열. 야후가 특정 심볼에서 순간 실패(레이트리밋)하면 티커 전체가 빔.
- **해결 (A) 심볼별 격리:** 각 심볼 조회를 try/catch로 감싸 실패 시 `null` 반환 → 그 심볼만 제외하고 나머지는 정상 표시. 한 심볼 실패가 전체를 죽이지 않음.
- **해결 (B) 직전 정상값 fallback:** 모듈 변수 `_lastGood`에 마지막 정상(비어있지 않은) 결과를 저장. 결과가 비거나 전체 실패 시 `_lastGood` 반환 → 사용자에게 빈 응답 노출 안 됨.
- **부수효과:** 빈 결과는 `_cache`에 저장하지 않음(기존엔 빈 payload도 30초 캐시될 수 있었음).

> ⚠️ 로직만 바꾸고 응답 스키마(`{items:[...]}`)·정렬·필터는 그대로 유지. KR byte 영향 없음(같은 데이터, 견고성만 추가).

---

## 수정 1 — `_lastGood` 모듈 변수 추가

`_cache` / `_TTL` 선언 **바로 아래**에 추가:

```ts
let _cache: { data: unknown; at: number } | null = null;
const _TTL = 30_000;
let _lastGood: { items: IndexItem[] } | null = null; // 직전 정상값 — 빈/실패 응답 시 fallback
```

## 수정 2 — 심볼별 격리 (`INDEX_SYMBOLS.map` 콜백을 try/catch로)

기존 (콜백 시그니처가 `Promise<IndexItem>`이고 `yf.quote`가 바로 throw 가능):

```ts
      Promise.all(
        INDEX_SYMBOLS.map(async (meta): Promise<IndexItem> => {
          const q = await yf.quote(meta.symbol);
          const price = Number(q.regularMarketPrice ?? 0);
          const changePct = Number(q.regularMarketChangePercent ?? 0);
          const change = Number(q.regularMarketChange ?? 0);

          // 스파크라인: 최근 약 30일 일봉 종가 배열 (실패해도 카드는 그대로 표시)
          let spark: number[] = [];
          try {
            const ch = await yf.chart(meta.symbol, {
              period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              interval: "1d",
            });
            spark = ch.quotes
              .map((c) => c.close)
              .filter((n): n is number => typeof n === "number");
          } catch {
            spark = [];
          }

          return {
            name: meta.name,
            value: price.toLocaleString("en-US", { maximumFractionDigits: 2 }),
            changeText: change.toLocaleString("en-US", { maximumFractionDigits: 2, signDisplay: "always" }),
            changePct,
            isUp: changePct >= 0,
            spark,
            group: meta.group,
          };
        })
      ),
```

교체 (콜백을 `Promise<IndexItem | null>`로, 전체를 try/catch로 감쌈):

```ts
      Promise.all(
        INDEX_SYMBOLS.map(async (meta): Promise<IndexItem | null> => {
          try {
            const q = await yf.quote(meta.symbol);
            const price = Number(q.regularMarketPrice ?? 0);
            if (!price) return null; // 값 없으면 이 심볼만 건너뜀(전체 죽이지 않음)
            const changePct = Number(q.regularMarketChangePercent ?? 0);
            const change = Number(q.regularMarketChange ?? 0);

            // 스파크라인: 최근 약 30일 일봉 종가 배열 (실패해도 카드는 그대로 표시)
            let spark: number[] = [];
            try {
              const ch = await yf.chart(meta.symbol, {
                period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                interval: "1d",
              });
              spark = ch.quotes
                .map((c) => c.close)
                .filter((n): n is number => typeof n === "number");
            } catch {
              spark = [];
            }

            return {
              name: meta.name,
              value: price.toLocaleString("en-US", { maximumFractionDigits: 2 }),
              changeText: change.toLocaleString("en-US", { maximumFractionDigits: 2, signDisplay: "always" }),
              changePct,
              isUp: changePct >= 0,
              spark,
              group: meta.group,
            };
          } catch {
            return null; // 이 심볼만 야후 실패 → 제외, 나머지는 정상
          }
        })
      ),
```

## 수정 3 — 병렬 결과에서 null 필터

기존:

```ts
    const [yahooItems, topix, vnRaw] = await Promise.all([
```

교체 (변수명을 `yahooItemsRaw`로 받고 바로 아래에서 null 제거):

```ts
    const [yahooItemsRaw, topix, vnRaw] = await Promise.all([
```

그리고 위 `Promise.all([...])` 블록이 **끝난 직후**(닫는 `]);` 다음 줄)에 추가:

```ts
    const yahooItems = yahooItemsRaw.filter((x): x is IndexItem => x !== null);
```

> 이후 `withTopix`·`merged` 등에서 쓰는 `yahooItems`는 그대로 동작(이제 null 제거된 배열).

## 수정 4 — 정상 결과만 캐시/반환, 비면 last-good

기존:

```ts
    const payload = { items: merged.filter((x) => x.value !== "0") };
    _cache = { data: payload, at: Date.now() };
    return NextResponse.json(payload);
```

교체:

```ts
    const items = merged.filter((x) => x.value !== "0");
    if (items.length > 0) {
      const payload = { items };
      _cache = { data: payload, at: Date.now() };
      _lastGood = payload; // 정상값 저장
      return NextResponse.json(payload);
    }
    // 결과가 비면 직전 정상값으로 (빈 응답 노출 방지)
    return NextResponse.json(_lastGood ?? { items: [] });
```

## 수정 5 — catch에서도 last-good

기존:

```ts
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
```

교체:

```ts
  } catch (e) {
    // 전체 실패 시에도 직전 정상값 유지 (있으면)
    if (_lastGood) return NextResponse.json(_lastGood);
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
```

---

## 마무리
```
npm run build   # tsc·빌드 확인 (특히 IndexItem | null 타입 정합)
git add -A && git commit -m "fix(indices): 지수 API 빈 응답 근절 — 심볼별 격리(Promise.all 전체 reject 방지) + 직전 정상값 fallback" && git push
```

## 검증 (배포 후 Cowork이 실측)
- `/api/yahoo/indices`를 10~20회 연속 호출 → `items` 개수가 항상 >0 (기존 ~20% 빈 응답이 0으로).
- 티커 라이브 유지.
