# STEP 738 — 광고문의 언어권 차등 (en = 리딩방 제거)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제:** 직전 커밋 = 헤더 로고 반응형(STEP ②).
**대상:** `app/[locale]/advertise/page.tsx` · `components/advertise/AdInquiryForm.tsx` · `messages/en.json` (3파일).

## 목표
리딩방(유사투자자문)은 **한국 특유 개념** — en(US·국제)엔 없음. 언어권 기준으로 en에서 리딩방 관련 전부 제거, **ko는 100% 유지**.
- en 제거 대상: `room` 슬롯 카드 · `rule2`(유사투자자문 규칙) · 폼 "관심 광고 위치"의 `room` 옵션 · `note`의 advisory 문장 · `phCompany`의 "advisory room".
- en 유지: broker·feed 슬롯, rule1/3/4, 폼 broker/feed/other 옵션.

> ⚠️ ko.json·ko 렌더는 **일절 건드리지 않음**. en.json의 room/rule2/optRoom 키는 파서 parity 위해 **남겨두되**(안 쓰임) note·phCompany 값만 수정.

---

## 수정 1 — `app/[locale]/advertise/page.tsx`

### 1-a. import에 `getLocale` 추가
기존:
```ts
import { getTranslations } from "next-intl/server";
```
교체:
```ts
import { getTranslations, getLocale } from "next-intl/server";
```

### 1-b. 함수 상단 — locale 분기 로직 추가 + slot 검증 변경
기존:
```ts
  const t = await getTranslations('Advertise');
  const sp = await searchParams;
  const slot = ["broker", "room", "feed", "other"].includes(sp.slot ?? "") ? (sp.slot as string) : "other";
```
교체:
```ts
  const t = await getTranslations('Advertise');
  const locale = await getLocale();
  const hasRoom = locale !== "en"; // 리딩방(유사투자자문)은 한국어권만 — en엔 없음
  const slots = hasRoom ? SLOTS : SLOTS.filter((s) => s.key !== "room");
  const rules = hasRoom ? RULES : RULES.filter((r) => r !== "rule2"); // rule2 = 유사투자자문 규칙
  const validSlots = hasRoom ? ["broker", "room", "feed", "other"] : ["broker", "feed", "other"];
  const sp = await searchParams;
  const slot = validSlots.includes(sp.slot ?? "") ? (sp.slot as string) : "other";
```

### 1-c. 렌더에서 `SLOTS` → `slots`, `RULES` → `rules`
기존:
```tsx
            {SLOTS.map((s) => (
```
교체:
```tsx
            {slots.map((s) => (
```
기존:
```tsx
            {RULES.map((r, i) => (
```
교체:
```tsx
            {rules.map((r, i) => (
```

---

## 수정 2 — `components/advertise/AdInquiryForm.tsx`

### 2-a. import에 `useLocale` 추가
기존:
```ts
import { useTranslations } from 'next-intl';
```
교체:
```ts
import { useTranslations, useLocale } from 'next-intl';
```

### 2-b. locale 분기로 room 옵션 제외
기존:
```ts
  const t = useTranslations('Advertise');
  const [slot, setSlot] = useState(defaultSlot);
```
교체:
```ts
  const t = useTranslations('Advertise');
  const locale = useLocale();
  const slotOptions = locale === 'en' ? SLOT_OPTIONS.filter((o) => o.value !== 'room') : SLOT_OPTIONS;
  const [slot, setSlot] = useState(defaultSlot);
```

### 2-c. SelectDropdown이 `slotOptions` 쓰도록
기존:
```tsx
        <SelectDropdown value={slot} onChange={setSlot} options={SLOT_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) }))} />
```
교체:
```tsx
        <SelectDropdown value={slot} onChange={setSlot} options={slotOptions.map((o) => ({ value: o.value, label: t(o.label) }))} />
```

---

## 수정 3 — `messages/en.json` (en 문구만, ko.json 손대지 말 것)

### 3-a. `phCompany` — advisory room 제거
기존:
```json
    "phCompany": "e.g. ○○ Securities / ○○ advisory room",
```
교체:
```json
    "phCompany": "e.g. ○○ Securities",
```

### 3-b. `note` — advisory 문장(마지막 문장) 제거
기존:
```json
    "note": "※ Advertising is placement (ranking) only, not a guarantee of facts or returns, and every advertisement carries an “Ad” label. Only firms that have filed as an investment advisory business and completed operator verification may be listed.",
```
교체:
```json
    "note": "※ Advertising is placement (ranking) only, not a guarantee of facts or returns, and every advertisement carries an “Ad” label.",
```

> “Ad” 는 곡선따옴표(curly quotes) 그대로 유지 — JSON 이스케이프 불필요.

---

## 마무리
```
npm run build   # tsc·빌드 + messages.test.ts(키 parity) 통과 확인
git add -A && git commit -m "feat(advertise): 광고문의 언어권 차등 — en에서 리딩방/유사투자자문 제거(슬롯·규칙·폼옵션·문구), ko 유지" && git push
```

## 검증 (배포 후 Cowork 실측)
- `/en/advertise`: 슬롯 2개(Brokerage·Content feed), 규칙 3개(advisory 규칙 없음), 폼 드롭다운에 "Advisory room" 없음, note에 advisory 문장 없음.
- `/advertise`(ko): 슬롯 3개(증권사·리딩방·콘텐츠), 규칙 4개, 폼에 리딩방 옵션 유지 — **변화 없음**.
