<!-- 2026-07-07 -->
# STEP 649 — KR 종목 로고 도메인 수집 (DART hm_url) 🔴 Claude Code가 수집 실행

> **문제**: 한국탭 종목 보드에 로고가 반쪽만(효성중공업·두산·삼양식품 등 글자 아바타). 원인 = KR은 `lib/avatar.ts` **하드코딩 `DOMAIN_MAP` 101개뿐**(전체 ~2,800 중). JP/CN/VN/GB는 야후 수집 파일(`*_logo_domains.json`)이 있는데 **KR만 없음**.
>
> **해결**: KR도 도메인 수집 파일을 만든다. 소스 = **DART 기업개황(company.json)의 `hm_url`(홈페이지)** — 한국 공식·앱에 DART 키·`dart_corp_codes`(stock_code↔corp_code) 이미 있음.
>
> **Cowork이 이미 함** (tsc EXIT=0):
> - `scripts/collect_kr_logo_domains.ts` — dart_corp_codes 전 상장사 → DART company.json → hm_url → 도메인 → `data/kr_logo_domains.json`.
> - `lib/avatar.ts` — `krLogoDomains` import + KR 조회를 `DOMAIN_MAP[code](손매핑 101 우선) || krLogoDomains[code](수집 폴백)`으로.
> - `data/kr_logo_domains.json` = 빈 `{}` 스텁(수집이 채움).
>
> **전제**: STEP 648(`c4b1ef8`) 이후.

## 0) 🔴 수집 실행 (Claude Code가 DART 호출 — ~5분, 진행상황 출력)
```bash
cd ~/stock-terminal && npx tsx scripts/collect_kr_logo_domains.ts
```
- 기대: `상장 corp: ~26xx` → `... 수집 N` 진행 → `DONE: N개 도메인 → data/kr_logo_domains.json`.
- N은 보통 수백~2천대(hm_url 없는 곳 제외). 끝나면 `data/kr_logo_domains.json`이 채워짐.

## 1) 확인
```bash
cd ~/stock-terminal && echo "도메인 수: $(node -e "console.log(Object.keys(require('./data/kr_logo_domains.json')).length)")" && git status --short | grep -E "avatar|kr_logo|collect_kr"
```

## 2) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error" | head -8
```

## 3) 커밋 + push
```bash
cd ~/stock-terminal && git add lib/avatar.ts data/kr_logo_domains.json scripts/collect_kr_logo_domains.ts docs/STEP_649_COMMAND.md && git commit -m "feat(logo): KR 종목 로고 도메인 수집(DART hm_url)→kr_logo_domains.json·avatar 배선(101 손매핑+수집 폴백)" && git push
```

## 4) (배포 후) Cowork 검증
- 한국탭 보드 새로고침 → 효성중공업·두산·삼양식품·HD현대일렉트릭 등에 실로고. hm_url 없는 초소형주만 글자 폴백 잔존.

## ✅ 완료 시 → 다음: JP 종목페이지 UI(JpEventLayer+R1) · 완전성 GB→VN→CN · 광고.
