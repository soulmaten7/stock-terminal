<!-- 2026-06-28 -->
# STEP 461 — 운영자 채널 게재 UI 정비 (링크→채널 / 무료 1 + 추가 ₩5만 Phase 2)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_461_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
운영자(`/business` > 내 업체 관리)의 링크 관리를 **"채널 게재" 모델**로 정비:
- 용어 **링크 → 채널**, 입력 시 **채널명 우선**(디렉토리 채널명으로 노출됨).
- 무료 1채널은 그대로. 추가 채널 안내 = **"채널당 월 5만원 · 결제하면 자동 게재 / 미결제 시 자동 비공개"**(Phase 2).
- 운영자 목록의 유료 채널 뱃지 **'광고' → '유료'** (추가 채널은 게재지 광고/스폰서 아님 — §3 구분).

> 기능(무료 1채널 추가 → 디렉토리 인증 리딩방 노출)은 이미 작동. 이번 STEP은 **용어·안내 정비**.

## 전제
- 최신 main. 파일 1개(`MyBusinessClient.tsx`), 클라이언트 → **HMR**.

---

## `components/business/MyBusinessClient.tsx` — 7곳 수정

**(1) 섹션 라벨: 업체 제공 링크 → 게재 채널 + 노출 위치** — 찾기:
```tsx
        업체 제공 링크 <span className="rounded bg-unjong-background px-1 py-0.5 text-[10px] font-normal">업체가 직접 등록</span>
```
바꾸기:
```tsx
        게재 채널 <span className="rounded bg-unjong-background px-1 py-0.5 text-[10px] font-normal">리딩방·검증 &gt; 인증 리딩방에 노출</span>
```

**(2) 빈 상태 문구** — 찾기:
```tsx
        {biz.links.length === 0 ? <li className="text-xs text-unjong-muted">아직 등록한 링크가 없어요. 무료 링크 1개를 등록할 수 있어요.</li> : null}
```
바꾸기:
```tsx
        {biz.links.length === 0 ? <li className="text-xs text-unjong-muted">아직 등록한 채널이 없어요. 무료 채널 1개를 등록하면 인증 리딩방에 노출돼요.</li> : null}
```

**(3) 유료/무료 뱃지: '광고' → '유료'** — 찾기:
```tsx
            {l.is_paid
              ? <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">광고</span>
              : <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">무료</span>}
```
바꾸기:
```tsx
            {l.is_paid
              ? <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">유료</span>
              : <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">무료</span>}
```

**(4) 추가 폼: 채널명 우선 + 채널 용어** — 찾기:
```tsx
          <div className="mb-4 space-y-1.5 rounded-lg border border-unjong-border p-3">
            <div className="flex gap-2">
              <select value={lType} onChange={(e) => setLType(e.target.value)} className="shrink-0 rounded-lg border border-unjong-border bg-unjong-surface px-2 py-2 text-sm text-unjong-primary outline-none" style={{ colorScheme: 'light' }}>
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input value={lUrl} onChange={(e) => { setLUrl(e.target.value); setLErr(''); }} placeholder="https://… 링크 주소" className="min-w-0 flex-1 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
            </div>
            <input value={lLabel} onChange={(e) => setLLabel(e.target.value)} maxLength={60} placeholder="표시 이름 (선택)" className="w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
            {lErr ? <p className="text-xs text-red-500">{lErr}</p> : null}
            <div className="flex gap-2">
              <button type="button" onClick={addFreeLink} disabled={lBusy} className="flex-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white disabled:opacity-50">{lBusy ? '등록…' : '무료 링크 등록'}</button>
              <button type="button" onClick={() => { setAddOpen(false); setLErr(''); }} className="shrink-0 rounded-lg border border-unjong-border px-3 py-2 text-sm text-unjong-muted">취소</button>
            </div>
          </div>
```
바꾸기:
```tsx
          <div className="mb-4 space-y-1.5 rounded-lg border border-unjong-border p-3">
            <input value={lLabel} onChange={(e) => setLLabel(e.target.value)} maxLength={60} placeholder="채널명 (예: ○○ 무료방)" className="w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
            <div className="flex gap-2">
              <select value={lType} onChange={(e) => setLType(e.target.value)} className="shrink-0 rounded-lg border border-unjong-border bg-unjong-surface px-2 py-2 text-sm text-unjong-primary outline-none" style={{ colorScheme: 'light' }}>
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input value={lUrl} onChange={(e) => { setLUrl(e.target.value); setLErr(''); }} placeholder="https://… 채널 링크" className="min-w-0 flex-1 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
            </div>
            {lErr ? <p className="text-xs text-red-500">{lErr}</p> : null}
            <div className="flex gap-2">
              <button type="button" onClick={addFreeLink} disabled={lBusy} className="flex-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white disabled:opacity-50">{lBusy ? '등록…' : '무료 채널 등록'}</button>
              <button type="button" onClick={() => { setAddOpen(false); setLErr(''); }} className="shrink-0 rounded-lg border border-unjong-border px-3 py-2 text-sm text-unjong-muted">취소</button>
            </div>
          </div>
```

**(5) 무료 추가 버튼: 링크 → 채널** — 찾기:
```tsx
            <Plus size={14} /> 링크 추가 <span className="text-[11px]">(무료 · 1개)</span>
```
바꾸기:
```tsx
            <Plus size={14} /> 채널 추가 <span className="text-[11px]">(무료 · 1개)</span>
```

**(6) payNote: ₩5만/월 + 자동 게재/비공개** — 찾기:
```tsx
        <p className="mb-4 rounded-lg border border-dashed border-unjong-accent/40 bg-unjong-accent/5 px-3 py-2.5 text-center text-xs leading-relaxed text-unjong-muted">추가 링크 결제 기능 <b className="text-unjong-accent">준비 중</b>이에요 — 곧 링크당 광고(유료)로 게재할 수 있어요.</p>
```
바꾸기:
```tsx
        <p className="mb-4 rounded-lg border border-dashed border-unjong-accent/40 bg-unjong-accent/5 px-3 py-2.5 text-center text-xs leading-relaxed text-unjong-muted">추가 채널은 <b className="text-unjong-accent">채널당 월 5만원</b>이에요. 결제 기능 <b className="text-unjong-accent">준비 중</b> — 결제하면 자동 게재, 미결제 시 자동 비공개됩니다.</p>
```

**(7) 유료 추가 버튼: 링크 → 채널·₩5만/월** — 찾기:
```tsx
          <Plus size={14} /> 링크 추가 <span className="text-[11px]">(광고 · 유료 · 링크당)</span>
```
바꾸기:
```tsx
          <Plus size={14} /> 채널 추가 <span className="text-[11px]">(₩5만/월 · 채널당)</span>
```

---

## 확인 (HMR — 새로고침)
- `/business` > 내 업체 관리(인증된 업체 있을 때): "게재 채널" 섹션.
- 채널 없을 때 → **채널 추가 (무료 · 1개)** 버튼 → 폼: **채널명**(첫 칸) + 타입 + 링크 → "무료 채널 등록".
- 1개 등록 후 → **채널 추가 (₩5만/월 · 채널당)** → 클릭 시 "추가 채널은 채널당 월 5만원… 결제하면 자동 게재, 미결제 시 자동 비공개" 안내.
- 목록의 유료 채널 뱃지 = **유료**(광고 아님), 무료 = 무료.
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 확인 후 커밋.
