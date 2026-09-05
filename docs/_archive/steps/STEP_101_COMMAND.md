<!-- 2026-05-28 -->
# STEP 101 — Movers 카드 KIS 실데이터 연결 (Layer 1-A 시작)

> **목표**: 단타창 Movers 카드 더미 → `/api/kis/movers` 실시간 데이터. Layer 1-A 첫 패턴 확립.
> **세션**: #26
> **전제**: STEP 100 완료 (`e4675e9`), 15개 종목 카드 → 우측 패널 연결됨
> **참조**: `docs/SESSION_KICKOFF.md` 섹션 8 (한투 API 7개 엔드포인트)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_101_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **Movers 카드 1개만 실데이터** — 패턴 확립 우선, 나머지는 STEP 102~104
2. **기존 KIS API 재활용** — `/api/kis/movers` 이미 검증됨 (`/ranking/fluctuation` TR ID)
3. **useEffect + fetch + setInterval(10000)** — 가장 단순한 패턴
4. **로딩·에러 상태 명확히** — 빈 화면 X, 사용자가 상태 인지 가능
5. **장외 시 마지막 데이터 유지** — KIS 응답이 비어도 캐시 표시
6. **CardContainer wrapper 그대로** — 기존 UI 패턴 유지
7. **빌드 깨지면 즉시 보고**

---

## 작업 1 — KIS Movers API 엔드포인트 진단

```bash
cd ~/stock-terminal
# Movers API 라우트 파일 확인
ls -la app/api/kis/movers 2>/dev/null
cat app/api/kis/movers/route.ts 2>/dev/null | head -80
# 또는
find app/api -name "*.ts" | xargs grep -l "movers\|fluctuation" 2>/dev/null
```

확인:
- 엔드포인트 경로 (`/api/kis/movers` 인지 다른지)
- 응답 형식 (data 필드 구조)
- 쿼리 파라미터 (KOSPI/KOSDAQ 분리? up/down 분리?)

### 예상 응답 (KIS API 표준)
```json
{
  "data": [
    {
      "code": "247540",
      "name": "에코프로비엠",
      "price": "412000",  // 또는 "412,000"
      "changePct": 12.5,   // 또는 "12.5" 또는 stck_prdy_ctrt
      // 기타 필드들...
    }
  ]
}
```

실제 응답 형식에 맞춰 타입 정의·매핑 조정.

---

## 작업 2 — `components/cards/ScalperCards.tsx` 의 MoversCard 수정

기존 `MoversCard` 함수를 다음으로 교체:

```tsx
// 파일 상단 import 추가
import { useEffect, useState } from "react";

// 기존 MOVERS const 는 fallback 으로 유지 (API 실패 시 표시용)
const MOVERS_FALLBACK = [
  { code: "247540", name: "에코프로비엠", price: "412,000", changePct: 12.5 },
  // ... 기존 5개
];

type Mover = {
  code: string;
  name: string;
  price: string;
  changePct: number;
};

export function MoversCard() {
  const setSelectedSymbol = useSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<Mover[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch("/api/kis/movers", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        // API 응답 구조에 맞게 매핑
        // 예상 1: { data: [...] }
        // 예상 2: { up: [...], down: [...] }
        // 예상 3: [...]
        const rawList = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.up)
          ? json.up
          : [];

        const mapped: Mover[] = rawList.slice(0, 5).map((item: Record<string, unknown>) => ({
          code: String(item.code ?? item.mksc_shrn_iscd ?? ""),
          name: String(item.name ?? item.hts_kor_isnm ?? "").trim(),
          price: typeof item.price === "string"
            ? item.price
            : Number(item.price ?? item.stck_prpr ?? 0).toLocaleString("ko-KR"),
          changePct: typeof item.changePct === "number"
            ? item.changePct
            : Number(item.changePct ?? item.prdy_ctrt ?? 0),
        }));

        if (mounted) {
          setData(mapped.length > 0 ? mapped : null);
          setError(null);
          setLastUpdate(new Date());
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 10_000); // 10초마다 갱신
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // 표시 데이터: 실데이터 우선, 없으면 fallback
  const displayData = data ?? (error ? MOVERS_FALLBACK : []);
  const isUsingFallback = !data && error !== null;

  return (
    <CardContainer
      id="card-movers"
      detailHref="/scalper/movers"
      title="Movers · 등락률 TOP"
      emoji="🚀"
      subtitle={
        lastUpdate
          ? `실시간 · ${lastUpdate.toLocaleTimeString("ko-KR")}`
          : "실시간 KOSPI/KOSDAQ"
      }
      hint={
        isUsingFallback
          ? `⚠️ API 에러 (${error}) · fallback 표시`
          : data
          ? "Layer 1 — KIS ranking API 연결됨 ✅"
          : "Layer 1 — KIS ranking API 로딩 중..."
      }
    >
      {loading && data === null && !error ? (
        <div className="text-xs text-unjong-muted text-center py-4">
          ⏳ 로딩 중...
        </div>
      ) : displayData.length === 0 ? (
        <div className="text-xs text-unjong-muted text-center py-4">
          데이터 없음
        </div>
      ) : (
        <ul className="space-y-2">
          {displayData.map((m, i) => (
            <li
              key={m.code}
              onClick={() =>
                setSelectedSymbol({
                  code: m.code,
                  name: m.name,
                  price: m.price,
                  changePct: m.changePct,
                  market: m.code.startsWith("0") ? "KOSPI" : "KOSDAQ",
                })
              }
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-unjong-muted font-mono w-4 text-right">
                  {i + 1}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary truncate">
                    {m.name}
                  </span>
                  <span className="text-[10px] text-unjong-muted">{m.code}</span>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="font-semibold text-unjong-primary">
                  {m.price}
                </span>
                <span className="flex items-center gap-0.5 text-[10px] text-unjong-success font-semibold">
                  <TrendingUp size={10} />+{m.changePct.toFixed(1)}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardContainer>
  );
}
```

⚠️ **응답 매핑 주의**:
- 실제 KIS API 응답 형식은 작업 1 진단 결과에 맞춰 조정
- 예상 필드명 후보: `code` / `mksc_shrn_iscd`, `name` / `hts_kor_isnm`, `price` / `stck_prpr`, `changePct` / `prdy_ctrt`
- 빌드는 통과해도 응답 매핑 잘못되면 화면 안 뜸 → 1차 빌드 후 dev 서버 확인 권장

---

## 작업 3 — 다른 카드는 건드리지 말 것

이 STEP 은 MoversCard 1개만 수정. 나머지 카드 (Volume·VI·NetBuy·공시·테마·공매도) 는 그대로 더미 유지.

ScalperCards.tsx 의 import 영역에 `useEffect, useState` 추가만 하고 다른 함수는 절대 수정 X.

---

## 작업 4 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build 2>&1 | grep -E "(error TS|Error:|✓|Failed)" | head -10
```

확인:
- 빌드 성공, TypeScript 오류 0
- ScalperCards.tsx 정상 컴파일

만약 KIS API 응답 매핑 타입 오류가 나면 → Claude Code 가 응답 구조 진단 결과에 따라 타입 조정.

---

## 작업 5 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add components/cards/ScalperCards.tsx docs/STEP_101_COMMAND.md
git status
git commit -m "feat: STEP 101 - Movers 카드 KIS 실데이터 연결 (Layer 1-A 시작)

ScalperCards.MoversCard:
- 더미 MOVERS const → useEffect + fetch '/api/kis/movers'
- 10초마다 자동 갱신 (setInterval)
- 로딩 / 에러 / 데이터 3상태 처리
- 마지막 업데이트 시간 헤더 subtitle 에 표시
- API 에러 시 MOVERS_FALLBACK 로 폴백 + 에러 메시지 hint
- TOP 5 표시 (slice 5)

응답 매핑 — KIS 표준 필드:
- code: mksc_shrn_iscd
- name: hts_kor_isnm
- price: stck_prpr (toLocaleString)
- changePct: prdy_ctrt

Layer 1-A 첫 카드. 패턴 확립:
- useEffect + fetch + setInterval(10000)
- TYPE Mover { code, name, price, changePct }
- _FALLBACK const 보존 (에러 시)
- subtitle 실시간 시간 + hint 상태 표시

다음 STEP: STEP 102 (Volume + NetBuy 카드 동일 패턴 확장)"
git push
```

---

## 검증 체크리스트

- [ ] `app/api/kis/movers/route.ts` 진단 완료
- [ ] MoversCard 가 useEffect + fetch 구조로 변경
- [ ] 10초 자동 갱신 작동
- [ ] 로딩/에러/데이터 3상태 표시
- [ ] MOVERS_FALLBACK 보존 (이름 변경)
- [ ] 다른 카드 (Volume·VI 등) 수정 X
- [ ] 빌드 클린
- [ ] git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 101 완료. Movers 카드 KIS 실데이터 연결 (Layer 1-A 시작) 끝.

변경:
- components/cards/ScalperCards.tsx
  · MoversCard 함수 — 더미 → KIS API 실시간
  · useEffect + fetch + setInterval(10초)
  · 로딩/에러/데이터 3상태
  · subtitle 에 실시간 시각, hint 에 API 상태

KIS API 응답 진단:
- 엔드포인트: /api/kis/movers
- 응답 필드: [실제 응답 구조 보고]

빌드 클린, git push 완료 (커밋 [해시])

브라우저에서 확인:
  http://localhost:3333/scalper → Movers 카드
  · 장중 (09:00~15:30) → 실시간 등락률 TOP 5 표시
  · 10초마다 자동 갱신
  · subtitle: '실시간 · HH:MM:SS' 시간 표시
  · 클릭 시 우측 종목상세 자동 변경 (STEP 100 패턴)

다음 STEP 후보:
- STEP 102: Volume + NetBuy 동일 패턴 확장 (1일)
- STEP 103: VI + 공시 동일 패턴 확장 (1일)
- STEP 104: 테마 + 공매도 마무리 (1~2일)
→ 4 STEP 에 단타창 7개 모두 실데이터 완성
```

---

## ⚠️ 주의 사항

1. **MoversCard 만 수정** — 다른 카드는 절대 건드리지 말 것
2. **응답 매핑은 실제 API 응답 보고 조정** — 작업 1 진단 결과 우선
3. **MOVERS const 이름 변경** — `MOVERS_FALLBACK` 으로 변경 (에러 시 폴백 표시용)
4. **10초 자동 갱신** — 더 짧으면 KIS rate limit 위험 (KIS_RATE_LIMIT_MS=60 이미 적용)
5. **장중/장외 구분** — 장외 시 빈 응답이면 fallback 또는 마지막 데이터 유지
6. **빌드 깨지면 즉시 보고** — TypeScript 타입 오류 가능성 (응답 매핑)
7. **console.log 남기지 말 것** — 디버그 시에도 push 전 제거
