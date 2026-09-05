<!-- 2026-06-28 -->
# STEP 450 (B) — 사업자번호·연락처 하이픈 표시 통일

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_450_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
사업자번호·연락처가 화면마다 들쭉날쭉(하이픈 유무) → **포맷 헬퍼로 모든 화면 통일.**
- 사업자번호 → `XXX-XX-XXXXX` (예: `107-86-35691`)
- 연락처 → `010-1234-5678` 형태
- **표시만 포맷** — API로 보내는 `biz_no`는 raw(숫자) 유지. (검색 입력은 이미 `digits` 정규화됨.)

## 전제
- 최신 main(STEP 449 + dfcfe41). **전부 lib + 클라이언트 컴포넌트 → HMR(재시작 불필요).** 파일 5개.

---

## (1) `lib/utils/format.ts` — 헬퍼 추가
**찾기:**
```ts
export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}
```
**바꾸기:**
```ts
export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

// 사업자등록번호 XXX-XX-XXXXX (입력 하이픈 무관 → 표시 통일)
export function formatBizNo(s: string | null | undefined): string {
  if (!s) return '—';
  const d = String(s).replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
  return String(s);
}

// 연락처 하이픈 통일 (휴대폰·지역번호 일반 패턴)
export function formatPhone(s: string | null | undefined): string {
  if (!s) return '—';
  const d = String(s).replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10 && d.startsWith('02')) return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 9 && d.startsWith('02')) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
  return String(s);
}
```

---

## (2) `components/business/MyBusinessClient.tsx` — biz_no 표시
### (2-a) import
**찾기:**
```tsx
import { useEffect, useState } from 'react';
```
**바꾸기:**
```tsx
import { useEffect, useState } from 'react';
import { formatBizNo } from '@/lib/utils/format';
```
### (2-b) 헤더 사업자번호
**찾기:**
```tsx
        <span className="text-xs text-unjong-muted">{biz.biz_no}</span>
```
**바꾸기:**
```tsx
        <span className="text-xs text-unjong-muted">{formatBizNo(biz.biz_no)}</span>
```

---

## (3) `components/business/BusinessClaimClient.tsx` — biz_no 표시
### (3-a) import
**찾기:**
```tsx
import { Search, ShieldCheck } from 'lucide-react';
```
**바꾸기:**
```tsx
import { Search, ShieldCheck } from 'lucide-react';
import { formatBizNo } from '@/lib/utils/format';
```
### (3-b) 검색결과 사업자번호
**찾기:**
```tsx
                    <span className="text-xs text-unjong-muted">{b.biz_no}</span>
```
**바꾸기:**
```tsx
                    <span className="text-xs text-unjong-muted">{formatBizNo(b.biz_no)}</span>
```

---

## (4) `components/admin/AdminBusinessClaims.tsx` — biz_no + 연락처
### (4-a) import
**찾기:**
```tsx
import { useState } from 'react';
```
**바꾸기:**
```tsx
import { useState } from 'react';
import { formatBizNo, formatPhone } from '@/lib/utils/format';
```
### (4-b) 사업자번호 셀
**찾기:**
```tsx
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{c.biz_no}</td>
```
**바꾸기:**
```tsx
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{formatBizNo(c.biz_no)}</td>
```
### (4-c) 연락처 셀
**찾기:**
```tsx
              <td className="px-3 py-2 text-xs text-unjong-primary">{c.contact || '—'}</td>
```
**바꾸기:**
```tsx
              <td className="px-3 py-2 text-xs text-unjong-primary">{formatPhone(c.contact)}</td>
```

---

## (5) `components/admin/AdminFssLookup.tsx` — biz_no + 연락처
### (5-a) import
**찾기:**
```tsx
import { Search } from 'lucide-react';
```
**바꾸기:**
```tsx
import { Search } from 'lucide-react';
import { formatBizNo, formatPhone } from '@/lib/utils/format';
```
### (5-b) 사업자번호 셀
**찾기:**
```tsx
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{f.biz_no}</td>
```
**바꾸기:**
```tsx
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{formatBizNo(f.biz_no)}</td>
```
### (5-c) 연락처 셀
**찾기:**
```tsx
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{f.phone || '—'}</td>
```
**바꾸기:**
```tsx
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{formatPhone(f.phone)}</td>
```

---

## 확인 (localhost, HMR — 새로고침만)
- **마이페이지 '내 업체'**: 사업자번호 `107-86-35691` 형태로.
- **/business 검색결과**: 사업자번호 `XXX-XX-XXXXX`.
- **/admin 클레임 심사**: 사업자번호 하이픈 + 연락처 `010-1234-5678`.
- **/admin 금감원 조회**: 사업자번호 하이픈 + 연락처 통일.
- 검색은 그대로(하이픈 넣든 빼든 매칭). API 전송 biz_no는 raw라 클레임/관리 동작 영향 없음.
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 확인 후 STEP 449+450 묶어 커밋(또는 단독).
