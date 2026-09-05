<!-- 2026-06-27 -->
# STEP 431 — /business 폴리시: 페이지 너비 표준화 + 클레임 CTA 인라인

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_431_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
1. `/business` 페이지 너비를 **플랫폼 표준(max-w-7xl)**으로 (지금 max-w-3xl로 좁음).
2. 업체 선택 시 **'인증 신청' 버튼을 클릭한 카드 안(인라인)**에 표시 — 지금은 결과 목록 맨 아래에 떠서 안 보임(클릭해도 변화 없어 보임). 토글 선택(다시 누르면 해제).

## 전제
- 최신 main + STEP 430(미커밋). **컴포넌트 2개**(page=서버 Fast Refresh / client=HMR). 새 라우트 없음 → 재시작 불필요. **커밋 보류**(테스트 계속).

---

## (1) `app/business/page.tsx` — 너비 표준화
**찾기:**
```tsx
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
```
**바꾸기:**
```tsx
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
```

## (2) `components/business/BusinessClaimClient.tsx` — 클레임 CTA 인라인

**찾기:**
```tsx
      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((b) => {
            const isSel = selected?.biz_no === b.biz_no;
            return (
              <li key={b.biz_no}>
                <button type="button" onClick={() => setSelected(b)} className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${isSel ? 'border-unjong-accent bg-unjong-accent/5' : 'border-unjong-border hover:bg-unjong-background'}`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
                    <span className="font-semibold text-unjong-primary">{b.company_name}</span>
                    <span className="text-xs text-unjong-muted">{b.biz_no}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-unjong-muted">대표 {b.representative ?? '—'} · 신고기간 {b.valid_from ?? '—'} ~ {b.valid_to ?? '—'}</p>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {selected ? (
        <div className="rounded-xl border border-unjong-accent bg-unjong-accent/5 p-4">
          <p className="text-sm text-unjong-primary"><b>{selected.company_name}</b>의 대표/담당자이신가요?</p>
          <p className="mt-1 text-xs leading-relaxed text-unjong-muted">인증 신청 후 관리자가 등록·본인 확인을 거쳐 게재됩니다. 허위 신청은 제재될 수 있어요.</p>
          <button type="button" onClick={claim} disabled={claiming} className="mt-3 w-full rounded-lg bg-unjong-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {claiming ? '신청 중…' : '이 업체로 인증 신청'}
          </button>
        </div>
      ) : null}
```
**바꾸기:**
```tsx
      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((b) => {
            const isSel = selected?.biz_no === b.biz_no;
            return (
              <li key={b.biz_no} className={`overflow-hidden rounded-lg border transition-colors ${isSel ? 'border-unjong-accent bg-unjong-accent/5' : 'border-unjong-border hover:bg-unjong-background'}`}>
                <button type="button" onClick={() => setSelected(isSel ? null : b)} className="w-full px-4 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
                    <span className="font-semibold text-unjong-primary">{b.company_name}</span>
                    <span className="text-xs text-unjong-muted">{b.biz_no}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-unjong-muted">대표 {b.representative ?? '—'} · 신고기간 {b.valid_from ?? '—'} ~ {b.valid_to ?? '—'}</p>
                </button>
                {isSel ? (
                  <div className="border-t border-unjong-accent/30 px-4 py-3">
                    <p className="text-sm text-unjong-primary"><b>{b.company_name}</b>의 대표/담당자이신가요?</p>
                    <p className="mt-1 text-xs leading-relaxed text-unjong-muted">인증 신청 후 관리자가 금감원 등록·대표 본인 여부를 확인해 게재됩니다. 허위 신청은 제재될 수 있어요.</p>
                    <button type="button" onClick={claim} disabled={claiming} className="mt-2 rounded-lg bg-unjong-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                      {claiming ? '신청 중…' : '이 업체로 인증 신청'}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
```

---

## 빌드·커밋
- **하지 않음(보류).** 컴포넌트라 HMR/Fast Refresh로 즉시 반영.

## 확인 (localhost)
- `/business` 폭이 다른 페이지(홈)와 동일(max-w-7xl).
- 결과에서 업체 클릭 → **그 카드 안에 '인증 신청' 버튼**이 바로 뜸 → 신청 시 "접수" 메시지.
- 같은 카드 다시 클릭 → 선택 해제(접힘).
