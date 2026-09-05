<!-- 2026-06-25 -->
# STEP 399 — 거시경제 지표에 기준일자 표시 (신뢰성)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_399_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
거시경제 탭의 각 지표(기준금리·CPI·국채 등)는 **분기/월 단위**라 "언제 기준값인지"가 중요한데, API(`/api/macro/summary`)는 `date`를 내려주지만 **MacroFeed가 화면에 표시하지 않음** → 사용자가 몇 달 전 값인지 알 수 없어 신뢰 저하. 각 지표 라벨 아래 **`YYYY.MM 기준`** 을 표시.
(참고: KR `change(▲▼)`는 ECOS KeyStatisticList가 직전값을 안 줘서 null 유지 — 기준일자가 표시되면 비대칭은 사소해지므로 이번 범위 밖. KR 키워드 매칭 취약성도 별도.)

## 전제
- 최신 main. 배포 X (배치). 컴포넌트만 변경 → HMR/새로고침 반영(클린재시작 불필요).

---

## 1단계 — `components/toolbox/MacroFeed.tsx` 의 `Row` 교체 + 날짜 포맷 헬퍼 추가

찾기:
```tsx
function Row({ it }: { it: Indicator }) {
  const up = it.change != null && it.change > 0;
  const down = it.change != null && it.change < 0;
  return (
    <div className="flex items-center justify-between border-b border-unjong-border py-2.5 last:border-0">
      <span className="min-w-0 flex-1 truncate pr-2 text-[13px] text-unjong-primary">{it.label}</span>
      <span className="shrink-0 text-right">
        <span className="text-sm font-semibold text-unjong-primary">{it.value}</span>
        {it.unit ? <span className="ml-0.5 text-[10px] text-unjong-muted">{it.unit}</span> : null}
        {it.change != null ? (
          <span className={`ml-1 text-[11px] ${up ? 'text-red-500' : down ? 'text-blue-500' : 'text-unjong-muted'}`}>
            {up ? '▲' : down ? '▼' : ''}{Math.abs(it.change)}
          </span>
        ) : null}
      </span>
    </div>
  );
}
```

바꾸기:
```tsx
// 기준일자 표시용 — YYYY-MM-DD / YYYYMM / YYYYMMDD / YYYY 등 관용 포맷
function fmtDate(d: string): string {
  const s = d.trim();
  const m = s.match(/^(\d{4})[-/.]?(\d{1,2})?[-/.]?(\d{1,2})?/);
  if (m) {
    const [, y, mo, da] = m;
    if (da) return `${y}.${mo!.padStart(2, '0')}.${da.padStart(2, '0')}`;
    if (mo) return `${y}.${mo.padStart(2, '0')}`;
    return y;
  }
  return s;
}

function Row({ it }: { it: Indicator }) {
  const up = it.change != null && it.change > 0;
  const down = it.change != null && it.change < 0;
  return (
    <div className="flex items-center justify-between border-b border-unjong-border py-2.5 last:border-0">
      <span className="min-w-0 flex-1 pr-2">
        <span className="block truncate text-[13px] text-unjong-primary">{it.label}</span>
        {it.date ? <span className="mt-0.5 block text-[10px] text-unjong-muted">{fmtDate(it.date)} 기준</span> : null}
      </span>
      <span className="shrink-0 text-right">
        <span className="text-sm font-semibold text-unjong-primary">{it.value}</span>
        {it.unit ? <span className="ml-0.5 text-[10px] text-unjong-muted">{it.unit}</span> : null}
        {it.change != null ? (
          <span className={`ml-1 text-[11px] ${up ? 'text-red-500' : down ? 'text-blue-500' : 'text-unjong-muted'}`}>
            {up ? '▲' : down ? '▼' : ''}{Math.abs(it.change)}
          </span>
        ) : null}
      </span>
    </div>
  );
}
```

## 2단계 — 로컬 확인
```bash
[ -z "$(pgrep -f 'next dev')" ] && (npm run dev >/tmp/trill_dev.log 2>&1 &) && sleep 10
echo "→ localhost:3333 → 거시경제 탭 → 한국/미국 각 지표 라벨 아래 'YYYY.MM 기준' 표시되는지 확인"
```

## 3단계 — 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add components/toolbox/MacroFeed.tsx
git commit -m "polish(STEP 399): 거시경제 지표에 기준일자 표시 — 신선도 신뢰"
```

## 확인
- 거시경제 탭 한국/미국 모두 각 지표 아래 작은 회색 "2025.04 기준" 류 표기.
- 날짜 없는 지표는 표기 없음(깨지지 않음).
