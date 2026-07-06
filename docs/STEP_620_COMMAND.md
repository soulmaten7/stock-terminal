<!-- 2026-07-06 -->
# STEP 620 — 3중 검수 결함 수정 커밋 (KR 별칭 · 통화 · 회사명)

> **배경**: JP·CN·KR R3를 실제 종목으로 **3회씩 독립생성** 검수(Cowork 샌드박스, 실 라우트 동일 파이프라인). 대부분 견고했으나 3개 결함 발견·수정:
> 1. **KR NAVER 빈 요약** — 공식 상장명이 영문 "NAVER"라 한국어 검색이 '네이버'(포털·블로그)에 잠식 → 3회 다 빈 summary. **`lib/krName.ts` 별칭(035420→네이버)** 추가. (S-Oil·HMM·LG·CJ 등 다른 영문명은 실측상 정상이라 미등록.)
> 2. **JP/CN 통화 오표기** — 소프트뱅크 "4조6700억 **원**"(엔인데 원). 프롬프트만으로 안 고쳐져 **결정론 후처리**(ja=원→엔·zh=원→위안, 숫자+단위 뒤만·KR 경로는 안 탐).
> 3. **회사명 CJK 잔존** — 任天堂/宁德时代 등 → **프롬프트에 한글 표기 규칙**(알리바바 3/3·닌텐도 부분 개선. 잔여는 경미).
> **재검증 통과**: 035420→네이버 기업뉴스(물류·두나무), 9984.T→"4조6700억 엔", 삼성(KR)은 원 안 건드림. tsc EXIT=0.
> **전제**: STEP 619(`6a9cecd`) 이후. 커밋 대상 = `lib/krName.ts`(신규)·`app/api/news-brief/route.ts`(별칭+SYSTEM 2줄+통화 후처리).

## 0) 임시 검수파일 삭제 + 빌드
```bash
cd ~/stock-terminal && rm -f scripts/_verify3.ts scripts/_krchk.ts scripts/_navchk.ts scripts/_probe_cn.ts _t_cn.ts && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 상태 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "krName|news-brief"
```
- 예상: `?? lib/krName.ts` · ` M app/api/news-brief/route.ts` (그 외 미커밋 파일 多 — 이번엔 이 둘만).

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add "lib/krName.ts" "app/api/news-brief/route.ts" docs/STEP_620_COMMAND.md && git commit -m "fix(ai-r3): 3x 검수 반영 — KR 검색 별칭(NAVER→네이버) + JP/CN 통화 결정론 교정(원→엔/위안) + 회사명 한글화 프롬프트" && git push
```

## ✅ 완료 시
- 4개국 R3 **3중 검수 통과**: US·KR·JP·CN 전부 네이티브·한국어·구체사건·무밸류/무전망/무짜깁기·통화 정확.
- 잔여(경미): ① A주 일부는 헤드라인이 자금유입만이라 빈 요약(정직 — 사건없음) ② CJK 회사명 드물게 잔존(가독 지장 없음).
- 다음 후보: 세션 문서 매듭(STEP 612~620) → 베트남 탭 / 전 국가 추가검수.
