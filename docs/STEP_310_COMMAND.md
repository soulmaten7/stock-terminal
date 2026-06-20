<!-- 2026-06-20 -->
# STEP 310 — [UI] select → 커스텀 드롭다운(박스 바로 아래로 펼침)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_310_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 309. 빌드 ✓.

---

## 🎯 목표

네이티브 `<select>`는 맥OS에서 드롭다운이 **박스 위로 겹쳐** 뜸(선택 항목을 박스에 정렬) → 박스 **아래로** 안 떨어짐(OS 동작, CSS 불가).
→ **박스 바로 아래로 펼쳐지는 커스텀 드롭다운**(`SelectDropdown`)으로 교체 + 스타일 통일.
- 적용: **신고 사유**(AdvisorDirectory), **플랫폼**(RoomSubmitModal).

> 신규 컴포넌트 1 + 2파일 select 교체.

---

## 📄 파일 1 (신규) — `components/toolbox/SelectDropdown.tsx`

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function SelectDropdown({
  value,
  onChange,
  options,
  placeholder = '선택하세요',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm outline-none focus:border-unjong-accent"
      >
        <span className={selected ? 'text-unjong-primary' : 'text-unjong-muted'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-unjong-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-unjong-border bg-unjong-surface py-1 shadow-lg">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-unjong-background ${
                o.value === value ? 'font-semibold text-unjong-primary' : 'text-unjong-primary'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

---

## 📄 파일 2 — `components/toolbox/AdvisorDirectory.tsx` (신고 사유)

### (2-A) import 추가
**찾기:**
```tsx
import RoomSubmitModal from './RoomSubmitModal';
```
**바꾸기:**
```tsx
import RoomSubmitModal from './RoomSubmitModal';
import SelectDropdown from './SelectDropdown';
```

### (2-B) 신고 사유 select → SelectDropdown
**찾기:**
```tsx
                <label className="mb-1 block text-xs font-medium text-unjong-muted">신고 사유</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
                >
                  <option value="">선택하세요</option>
                  {REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
```
**바꾸기:**
```tsx
                <label className="mb-1 block text-xs font-medium text-unjong-muted">신고 사유</label>
                <div className="mb-3">
                  <SelectDropdown
                    value={reportReason}
                    onChange={setReportReason}
                    options={REASONS.map((r) => ({ value: r, label: r }))}
                    placeholder="선택하세요"
                  />
                </div>
```

---

## 📄 파일 3 — `components/toolbox/RoomSubmitModal.tsx` (플랫폼)

### (3-A) import 추가
**찾기:**
```tsx
import { useState } from 'react';
import { X } from 'lucide-react';
```
**바꾸기:**
```tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import SelectDropdown from './SelectDropdown';
```

### (3-B) 플랫폼 select → SelectDropdown
**찾기:**
```tsx
              <span className="mb-1 block text-xs font-medium text-unjong-muted">플랫폼</span>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={inputCls}>
                {PLATFORMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
```
**바꾸기:**
```tsx
              <span className="mb-1 block text-xs font-medium text-unjong-muted">플랫폼</span>
              <SelectDropdown value={platform} onChange={setPlatform} options={PLATFORMS.map(([v, l]) => ({ value: v, label: l }))} />
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 (`inputCls`가 플랫폼에서 안 쓰여도 다른 입력에서 계속 쓰이므로 OK).

개발 서버(`npm run dev`, 포트 3333):
1. 신고 모달 → **신고 사유** 클릭 → **박스 바로 아래로** 흰 드롭다운이 펼쳐짐(겹침 X), 항목 선택되면 박스에 표시.
2. + 리딩방 등록 → **플랫폼**도 동일하게 박스 아래로.
3. 드롭다운 바깥 클릭 시 닫힘. ▼ 아이콘 열리면 180° 회전.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "fix(ui): 네이티브 select → 커스텀 드롭다운(박스 바로 아래로 펼침) — 신고사유·플랫폼 (STEP 310)" && git push
```

---

> **한 줄 요약**: 맥OS에서 박스 위로 겹쳐 뜨던 네이티브 select를, 박스 바로 아래로 펼쳐지는 커스텀 SelectDropdown으로 교체(신고사유·플랫폼).
