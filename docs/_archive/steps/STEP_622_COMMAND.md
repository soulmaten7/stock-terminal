<!-- 2026-07-06 -->
# STEP 622 — 국가탭 플레이북 + 언어권 거미줄 로드맵 캡처 (문서)

> **왜**: 4개국(US·KR·JP·CN) 완성으로 **반복 가능한 국가탭 레시피 + 검수법**이 확립됨 → 베트남·영국·이후 국가에 그대로 적용하려고 문서에 확정. + 장은태 **언어권 거미줄 확장 전략** 마스터 로드맵 반영.
> **Cowork이 갱신한 문서**:
> - `docs/COUNTRY_TAB_PLAYBOOK.md`: **§4-4 AI 렌즈 R3 = 자국어 네이티브 종목명 필수**(야후 영어명 함정 → 거래소/포털 원어명 테이블 jp_names·cn_names / 데이터 소스 도달성 프로브 / 결정론 후처리) + **§4-5 R3 3중 검수법**(대표종목 3회 독립생성 → 6가지 결함 잡기) + DoD 항목 추가.
> - `docs/ROADMAP.md`: **§2-1 언어권 거미줄 확장 전략**(① 한국어권 완성[베트남→영국→디테일·SEO·광고] → ② 영어권/미국[미국시선 탭+어필리에이트+영어 SEO] → ③ 언어권마다 누적).
> **전제**: STEP 621(`3fdce13`) 이후. 코드 변경 없음(문서만).

## 1) 상태 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "COUNTRY_TAB_PLAYBOOK|ROADMAP|STEP_622"
```

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add docs/COUNTRY_TAB_PLAYBOOK.md docs/ROADMAP.md docs/STEP_622_COMMAND.md && git commit -m "docs: 국가탭 플레이북 AI R3 네이티브 종목명·3중 검수법(§4-4·4-5) + 언어권 거미줄 확장 전략(ROADMAP §2-1)" && git push
```

## ✅ 완료 시
- 새 국가탭 = **플레이북 그대로 찍어내기** 가능(§4-4 네이티브 이름 + §4-5 3중 검수 포함).
- 다음: **베트남 탭 착수** — 데이터 소스 도달성 프로브(HOSE/HNX·vi 뉴스·베트남어 종목명)부터(§4-4 원칙).
