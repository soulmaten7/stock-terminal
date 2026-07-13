<!-- 2026-07-13 -->
# STEP 706 — 다크 테마 3/3단계: 폴리시 (시맨틱색·특수케이스 대비)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(앰버/에메랄드 사용처가 배지·배너·게이지로 문맥이 달라 판단 필요)
**목표:** 플립(705) 후 다크에서 "덜 다듬어진" 시맨틱색·밝은 배지·특수 케이스를 다크 대비로 마감. **구조는 이미 다크 정상** — 여기선 색 대비만.
**전제:** STEP 705 완료 (`07fc4bf`). 앱 전체 다크 상태. 라이브(onetrillion.app) 다크 확인됨.

---

## 작업

### A. 밝은 앰버 → 다크 친화 (가장 눈에 띔)
`bg-amber-50/100/200`(밝은 warn 배경)은 다크에서 밝은 블록으로 튄다. **문맥별로:**
- **배지·안내배너**(예: 밸류(가치) 배지, 로그인 안내, ETN 위험 배너, AdvisorDirectory 안내): `bg-amber-50 … text-amber-800/700` → **`bg-amber-400/10 text-amber-300 border-amber-400/20`** 패턴.
  - 위치: `LensPreview.tsx:19`, `EtfLensClient.tsx:79`, `AdvisorDirectory.tsx:400`, `StockLensClient.tsx`의 배지류(212,247 등)
- **게이지 fill**(StockLensClient 단기 기술 게이지의 앰버 구간, solid): 밝은 앰버 → **`bg-amber-400/45`** (다크서 톤 낮춤, 그래도 보임). 위치: `StockLensClient.tsx` 50,57,78,103,140,155,169,201
- **앰버 텍스트만**: `text-amber-800/700` → `text-amber-300`, `text-amber-600` → `text-amber-400` (전 파일). 안전 치환:
```bash
cd ~/stock-terminal
grep -rl 'text-amber-800\|text-amber-700' app components | xargs sed -i '' -e 's/text-amber-800/text-amber-300/g' -e 's/text-amber-700/text-amber-300/g'
grep -rl 'text-amber-600' app components | xargs sed -i '' 's/text-amber-600/text-amber-400/g'
```
> 배지/게이지 `bg-amber-*`는 문맥이 달라 **일괄 sed 말고**, 위 위치를 열어 배지=`/10`, 게이지=`/45`로 판단해서 바꿀 것.

### B. emerald/red 상태색 다크 대비
```bash
grep -rl 'text-emerald-600' app components | xargs sed -i '' 's/text-emerald-600/text-emerald-400/g'
grep -rl 'hover:bg-emerald-50' app components | xargs sed -i '' 's/hover:bg-emerald-50/hover:bg-emerald-400\/10/g'
grep -rl 'hover:bg-gray-50' app components | xargs sed -i '' 's/hover:bg-gray-50/hover:bg-gray-100/g'
```
> `text-red-500`·`bg-emerald-500/5~10`·등락 `text-unjong-up/down`은 다크서 이미 잘 보임 → 유지.

### C. 특수 케이스 (라이트를 '의도적으로' 유지)
- **구글 로그인 버튼** (`app/auth/login/page.tsx`, `app/admin/login/page.tsx`): 705에서 `bg-white`→`bg-unjong-surface`로 바뀌어 **어두운 버튼**이 됨. 구글 버튼은 다크에서도 **흰색이 브랜드 정석** → 해당 버튼만 **명시적 `bg-white text-[#1f1f1f]`로 되돌림** (hover `bg-gray-100`). 구글 4색 로고 유지.
- **StockLogo fallback 원** (`components/ui/StockLogo.tsx:52`): `bg-unjong-surface`(다크 원)에 어두운 이니셜이면 안 보임 → **`bg-unjong-strong` + 이니셜 `text-unjong-primary`(밝음)**, 또는 이니셜을 흰색으로. (로고 이미지 있는 종목은 무관 — fallback만.)
- **슬라이더 흰 링** (`StockLensClient.tsx` 84,105,156,170 `border-2 border-white`): 다크 카드 위에선 흰 링이 오히려 잘 보임 → **유지**(문제 없음). 톤 통일 원하면 `border-unjong-surface`.

### D. (라이브 튜닝 후속) accent 틴트·그림자
- `bg-unjong-accent/5~/12` 등 아주 옅은 틴트가 다크서 안 보이면 알파 상향(예 `/5`→`/12`) — **배포 후 눈으로 보고** 필요한 곳만. (지금 일괄 변경 X)
- `.shadow-soft`(globals.css): 다크서 안 보이나 카드에 border 있어 무해 → 후속에 border/글로우 대체 검토.

### 빌드 + 커밋
```bash
npm run build
git add -A && git commit -m "dark(3/3): 폴리시 — 앰버 배지·게이지·상태색 다크 대비 + 구글버튼·StockLogo 특수케이스 라이트 유지" && git push
```

## 검증 (배포 후 Cowork 라이브)
종목 렌즈 상세(앰버 게이지·밸류 배지 톤 낮아짐), 로그인(구글 버튼 흰색), 보드/폼 전반 대비 확인. 남는 미세 틴트는 D로 후속.
