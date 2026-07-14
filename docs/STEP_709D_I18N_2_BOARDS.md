<!-- 2026-07-14 -->
# STEP 709D — i18n 2/3단계 (4군: 6개 보드)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(6파일 공유 문자열 dedup + 709B/709C에서 확인된 함정 재적용)
**목표:** 6개 보드의 정적 UI 문자열을 `messages/ko.json` **"Board" 공유 네임스페이스**로. **한국어 동일·화면 0 변화.**
**전제:** STEP 709C 완료(`27cfcf8`).

---

## 접근 — 공유 네임스페이스 (dedup)
6개 보드(`MarketBoard`·`UsMarketBoard`·`JpMarketBoard`·`CnMarketBoard`·`VnMarketBoard`·`GbMarketBoard`)는 거의 같은 구조 → 문자열도 대부분 공유. **하나의 "Board" 네임스페이스**로 모으고 **중복 키 만들지 말 것**(같은 "현재가"를 6번 넣지 말고 1키). KR 전용(전체·코스피·코스닥·상한·하한)도 이 안에.

## 이관 대상 (정적 UI)
컬럼 헤더(종목명·현재가·등락), 기간 라벨(1일전·1주일전·1개월전·3개월전·6개월전·1년전 및 1일/1주/1개월 등 셀렉트), 정렬·검색 placeholder, 빈 상태, 페이지네이션(이전·다음·aria-label), **KR 세그먼트(전체·코스피·코스닥)**, 상한/하한 배지, 모달·안내 문구 등 **6파일의 JSX 하드코딩 정적 한국어 전부**.

## 제외 (동적) — 709C와 동일
종목명·가격·등락%·verdict·API 반환값. **props·데이터·정규식/필터 키에서 오는 문자열은 손대지 마라.**

## ⚠️ 주의 (709B·709C에서 확인된 함정 그대로)
- 모듈 최상위 상수 라벨맵 → 값 키화 + 렌더 `t()`(709B 방식).
- 기존 지역 변수 `t` 충돌 → 리네임.
- **ICU 아포스트로피**: 작은따옴표(') 든 문자열은 `createTranslator`로 원문 보존 확인(709C처럼). `{·}` 만 escape.
- **데이터 매칭 문자열 번역 금지**(709C의 F-Score/ETN 사례) — 6보드에 필터·정규식에 쓰는 한국어가 있으면 그대로.

## 작업
1. 6파일 읽기(공유 패턴 파악).
2. ko.json "Board" — 공유 문자열 dedup, 값 **100% 동일**(오타·띄어쓰기·중점·따옴표까지).
3. 각 보드에 `useTranslations('Board')`, 정적 문자열 교체. 6파일 **일관되게**.
4. 빌드+검증: `npm run build` + tsc 0. dev(3333)로 **6개국 보드** 육안 100% 동일(헤더·기간·페이지네이션·KR 토글·상하한 배지), `IntlError`·MISSING_MESSAGE **0**. 사용 키 전부 ko.json 대조(누락 0).
5. 커밋:
```bash
git add -A && git commit -m "i18n(2/3·보드): 6개 보드 정적 UI → ko.json Board 공유 네임스페이스 (동적 제외·dedup·한국어 동일·화면 0)" && git push
```

## 다음
- **709E:** 나머지 컴포넌트/페이지 — `AdvisorDirectory`·피드들(News·Macro·Offerings·Dividend 등)·`about`·`feedback`·`advertise`·`business`·`mypage`·`admin`·`auth/login`.
- 그 후 **STEP 710(3/3, 집중 세션):** `app/[locale]` 라우팅 + `en.json` + 언어 스위처 + 로케일→기본 시장 매핑.
