<!-- 2026-06-18 -->
# STEP 274 — 주식 필터 통합 + 미리보기 봉 너비 통일 + 종목 토론 쓰기창

## 🔧 실행 (Sonnet — 정확한 find/replace 명세 제공)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_274_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: `fab5e69` (STEP 273). 빌드 ✓.
- **결과 커밋 예정**: STEP 274.

---

## 🎯 목표 (4가지)

1. **주식 필터 통합** — 주식 탭의 `국내/미국/코스피/코스닥` 필터를 기간칩과 **같은 헤더 바**로 합친다(좌측=국가·시장 필터, 우측=기간칩). 다른 탭과 위치 통일.
2. **미리보기 봉 너비 통일** — 미리보기 캔들차트가 `봉 너비 = 차트폭 ÷ 봉 개수`라서, 신규상장 종목(봉 16개)은 봉이 뚱뚱하고 오래된 종목(봉 60개)은 얇다. **봉 너비를 60봉 기준으로 고정**해 모든 종목이 같은 두께로 보이게(봉이 적으면 최근봉부터 우측 정렬, 좌측 여백).
3. **"커뮤니티" → "종목 토론"** 이름 변경.
4. **종목 토론 쓰기창 추가** — 미리보기에서 로그인 후 토론 글 작성 가능(비로그인은 로그인 유도). 상세페이지 `DiscussionBoard.tsx`의 검증된 패턴(`discussions` insert) 재활용.

> 차트는 **일봉 유지**(장중 실시간/분봉은 이번 범위 아님).

---

## 📄 파일 1 — `components/market/MarketClient.tsx` (주식 필터 통합)

### (1-A) 그리드 위 별도 필터 줄 삭제
**찾기:**
```tsx
      {/* 필터: 국가 ｜ 시장 ｜ 기간칩 */}
      <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        {COUNTRIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => { setCountry(c.key); setPeriod("1d"); setMarket("all"); }}
            className={chip(country === c.key)}
          >
            {c.label}
          </button>
        ))}

        {country === "kr" && <span className="mx-1.5 h-5 w-px bg-unjong-border" />}
        {country === "kr" &&
          MARKETS.map((m) => (
            <button key={m.key} type="button" onClick={() => setMarket(m.key)} className={chip(market === m.key)}>
              {m.label}
            </button>
          ))}
      </div>

```
**→ 통째로 삭제(아래 빈 줄 포함).**

### (1-B) 헤더 바 = 좌측 국가·시장 필터 + 우측 기간칩
**찾기:**
```tsx
            {/* 기간칩 헤더 바 — 표 바로 위, 우측 정렬 */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-unjong-border px-3 py-2">
              <div className="ml-auto flex flex-wrap items-center justify-end gap-x-1 gap-y-2">
                {PERIODS.map((p) => (
                  <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
```
**바꾸기:**
```tsx
            {/* 필터 헤더 바 — 좌: 국가·시장 / 우: 기간칩 */}
            <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-unjong-border px-3 py-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => { setCountry(c.key); setPeriod("1d"); setMarket("all"); }}
                  className={chip(country === c.key)}
                >
                  {c.label}
                </button>
              ))}
              {country === "kr" && <span className="mx-1.5 h-5 w-px bg-unjong-border" />}
              {country === "kr" &&
                MARKETS.map((m) => (
                  <button key={m.key} type="button" onClick={() => setMarket(m.key)} className={chip(market === m.key)}>
                    {m.label}
                  </button>
                ))}
              <div className="ml-auto flex flex-wrap items-center justify-end gap-x-1 gap-y-2">
                {PERIODS.map((p) => (
                  <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
```

---

## 📄 파일 2 — `components/home-v6/HomeStockDetail.tsx` (봉 너비 + 종목 토론 + 쓰기창)

### (2-A) import 추가
**찾기:**
```tsx
import { createAnonClient } from "@/lib/supabase/anon-client";
import type { HoverStock } from "@/components/market/MarketClient";
```
**바꾸기:**
```tsx
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useAuthStore } from "@/stores/authStore";
import type { HoverStock } from "@/components/market/MarketClient";
```

### (2-B) 봉 너비 60봉 기준 고정 + 우측 정렬
**찾기:**
```tsx
  const cw = w / data.length;
  const py = (v: number) => pad + (priceH - 2 * pad) * (1 - (v - min) / range);
  const volBase = priceH + gap + volH;
  const bw = Math.max(1.2, cw * 0.6);
```
**바꾸기:**
```tsx
  // 봉 너비를 60봉 기준으로 고정 — 종목마다(신규상장 등) 봉 개수가 달라도 두께 동일.
  // 봉이 60개보다 적으면 오른쪽(최근)부터 정렬하고 왼쪽은 여백으로 둔다.
  const cw = w / 60;
  const offset = w - data.length * cw;
  const py = (v: number) => pad + (priceH - 2 * pad) * (1 - (v - min) / range);
  const volBase = priceH + gap + volH;
  const bw = Math.max(1.2, cw * 0.6);
```

그리고 **`const x = i * cw + cw / 2;` 3곳 전부**를 아래로 교체(라벨·캔들·거래량 — find&replace 전체치환):
- **찾기:** `const x = i * cw + cw / 2;`
- **바꾸기:** `const x = offset + i * cw + cw / 2;`

### (2-C) 상태 추가 (auth · 쓰기 · 리로드)
**찾기:**
```tsx
  const [candles, setCandles] = useState<Candle[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
```
**바꾸기:**
```tsx
  const [candles, setCandles] = useState<Candle[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const user = useAuthStore((s) => s.user);
  const [reloadN, setReloadN] = useState(0);
  const [showWrite, setShowWrite] = useState(false);
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
```

### (2-D) 토론 목록 새로고침 트리거 + 글 등록 함수
**찾기:**
```tsx
        if (!cancelled) setPosts([]);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [stock?.symbol]);

  return (
```
**바꾸기:**
```tsx
        if (!cancelled) setPosts([]);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [stock?.symbol, reloadN]);

  const handleSubmit = async () => {
    if (!user || !stock) return;
    const trimmed = writeContent.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    const supabase = createAnonClient();
    const { error } = await supabase.from("discussions").insert({
      symbol: stock.symbol,
      user_id: user.id,
      nickname: user.nickname,
      tier: user.tier ?? 1,
      content: trimmed,
    });
    if (!error) {
      setWriteContent("");
      setShowWrite(false);
      setReloadN((n) => n + 1);
    }
    setSubmitting(false);
  };

  return (
```

### (2-E) "커뮤니티" → "종목 토론" + 쓰기창 UI
**찾기:**
```tsx
            {/* 커뮤니티 */}
            <div className="border-b border-unjong-border p-4">
              <p className="mb-2 text-xs font-semibold text-unjong-muted">커뮤니티</p>
              {posts.length === 0 ? (
                <p className="text-xs text-unjong-muted">아직 토론이 없어요. 첫 의견을 남겨보세요.</p>
              ) : (
```
**바꾸기:**
```tsx
            {/* 종목 토론 */}
            <div className="border-b border-unjong-border p-4">
              <p className="mb-2 text-xs font-semibold text-unjong-muted">종목 토론</p>

              {/* 글쓰기 — 로그인 후 작성 가능 */}
              {!user ? (
                <Link href="/auth/login" className="mb-2.5 block rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-center text-xs text-unjong-muted hover:text-unjong-primary">
                  토론 글쓰기는 로그인 후 가능 · 카카오 로그인 →
                </Link>
              ) : !showWrite ? (
                <button
                  type="button"
                  onClick={() => setShowWrite(true)}
                  className="mb-2.5 w-full rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-left text-xs text-unjong-muted hover:text-unjong-primary"
                >
                  ✏️ 이 종목, 어떻게 생각하세요?
                </button>
              ) : (
                <div className="mb-2.5 rounded-lg border border-unjong-primary p-2">
                  <textarea
                    value={writeContent}
                    onChange={(e) => setWriteContent(e.target.value)}
                    placeholder="의견을 남겨보세요. 욕설·홍보는 제한됩니다."
                    maxLength={5000}
                    rows={3}
                    autoFocus
                    className="w-full resize-none text-xs text-unjong-primary placeholder:text-unjong-muted focus:outline-none"
                  />
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <button type="button" onClick={() => { setShowWrite(false); setWriteContent(""); }} className="text-xs text-unjong-muted">
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting || !writeContent.trim()}
                      className="rounded bg-unjong-primary px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {submitting ? "..." : "등록"}
                    </button>
                  </div>
                </div>
              )}

              {/* 목록 */}
              {posts.length === 0 ? (
                <p className="text-xs text-unjong-muted">아직 토론이 없어요. 첫 의견을 남겨보세요.</p>
              ) : (
```
> 위 `찾기`는 `커뮤니티` 섹션 **시작부터 삼항연산자 첫 분기까지**만 교체한다. 그 아래 `<ul>...목록...</ul>`과 닫는 `)}`/`</div>`는 **그대로 둔다**(목록 렌더링 재사용).

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 + 미사용 변수 경고 없을 것.

개발 서버(`npm run dev`, 포트 3333) 눈 확인:
1. **주식 탭** → `국내/미국/코스피/코스닥`과 `1일~1년`이 **표 카드 한 헤더 바**에 (좌=필터, 우=기간칩) 같이 있는지. 위쪽 별도 필터 줄은 사라짐.
2. **미리보기 봉 두께** → 주식(삼성전자)·ETF(KODEX SK하이닉스레버리지 0193T0) 클릭 시 **봉 두께가 동일**(신규종목은 봉이 우측에 몰리고 좌측 여백).
3. 미리보기 섹션 제목이 **"종목 토론"**.
4. **비로그인** → "토론 글쓰기는 로그인 후 가능 · 카카오 로그인 →" 표시. **로그인** → "✏️ 이 종목, 어떻게 생각하세요?" → 입력창 → 등록 시 목록 갱신.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat: 주식 필터 헤더바 통합 + 미리보기 봉너비 통일 + 종목토론 쓰기창(로그인 게이팅) (STEP 274)" && git push
```

---

> **한 줄 요약**: 주식 필터를 기간칩과 한 바로 합치고, 미리보기 봉 너비를 60봉 기준 고정으로 통일, '커뮤니티'→'종목 토론' + 로그인 후 글쓰기창 추가(기존 discussions 인프라 재활용).
