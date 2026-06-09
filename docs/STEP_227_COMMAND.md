<!-- 2026-06-07 -->
# STEP 227 — 링크모음 국가 필터: '전체' 제거 + 한국 먼저(기본값 한국)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_227_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시)
국가 필터(전체/미국/한국)에서 **'전체' 제거**, **한국이 먼저** 오게(헷갈림 방지). 전체가 없으니 **기본 선택 = 한국**.

## 전제 상태
- HEAD: STEP 226 상태
- 변경 1파일: `components/toolbox/ToolboxClient.tsx`(상태 기본값 + 필터 블록)
- DB 변경 0

---

## 작업 1/2 — 국가 정렬 + 기본값 한국

**찾기:**
```tsx
  const [categories, setCategories] = useState(initialCategories);
  const [active, setActive] = useState(initialCategories[0]?.slug ?? '');
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState<string>('all');
```
**바꾸기:**
```tsx
  const COUNTRY_ORDER = ['KR', 'US', 'GLOBAL'];
  const orderedCountries = [...availableCountries].sort((a, b) => COUNTRY_ORDER.indexOf(a) - COUNTRY_ORDER.indexOf(b));

  const [categories, setCategories] = useState(initialCategories);
  const [active, setActive] = useState(initialCategories[0]?.slug ?? '');
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState<string>(orderedCountries[0] ?? 'KR');
```

> 한국(KR) → 미국(US) 순. 기본값 = 첫 번째(한국).

## 작업 2/2 — 필터 박스에서 '전체' 제거

**찾기:**
```tsx
      {availableCountries.length > 1 && (
        <div className="mb-3 inline-flex items-center gap-0.5 rounded-lg border border-unjong-border p-0.5">
          <button
            type="button"
            onClick={() => setCountry('all')}
            className={`rounded px-3 py-1.5 text-sm font-bold transition-colors ${country === 'all' ? 'bg-unjong-accent text-white' : 'text-unjong-muted hover:text-unjong-primary'}`}
          >전체</button>
          {availableCountries.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCountry(c)}
              className={`rounded px-3 py-1.5 text-sm font-bold transition-colors ${country === c ? 'bg-unjong-accent text-white' : 'text-unjong-muted hover:text-unjong-primary'}`}
            >{countryLabel[c] ?? c}</button>
          ))}
        </div>
      )}
```
**바꾸기:**
```tsx
      {orderedCountries.length > 0 && (
        <div className="mb-3 inline-flex items-center gap-0.5 rounded-lg border border-unjong-border p-0.5">
          {orderedCountries.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCountry(c)}
              className={`rounded px-3 py-1.5 text-sm font-bold transition-colors ${country === c ? 'bg-unjong-accent text-white' : 'text-unjong-muted hover:text-unjong-primary'}`}
            >{countryLabel[c] ?? c}</button>
          ))}
        </div>
      )}
```

> '전체' 버튼 삭제, `orderedCountries`(한국 먼저)만 렌더. `inCountry`의 `country === 'all'` 분기는 무해(이제 안 탐).

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/toolbox/ToolboxClient.tsx && git commit -m "feat(v7): 링크모음 국가 필터 '전체' 제거+한국 우선(기본 한국) (STEP 227)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 국가 필터가 **[한국] [미국]** (전체 사라짐, 한국이 왼쪽 먼저)
- [ ] 처음 들어가면 **한국이 선택**돼 있고 리스트도 한국 기준, 탭 개수도 한국 기준
- [ ] 미국 누르면 미국 링크로 전환
- ⚠️ 클라이언트 컴포넌트 → 하드 새로고침이면 바로 반영.

## 주의·예상 이슈
- 모든 카테고리에 한국·미국 링크가 다 있어 빈 탭 없음(기본 한국이라도 정상).
- 탭 개수가 이제 **선택 국가 기준**으로 표시됨(전체 합계 아님) — 의도된 동작.
- **문서 TODO**(다음 갱신): STEP 162·215~227.

---
> STEP 227 = 국가 필터 전체 제거+한국 우선. 전제 STEP 226. 문서 묶어 갱신.
