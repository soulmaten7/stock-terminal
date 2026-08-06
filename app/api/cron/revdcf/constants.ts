// 🔴 STEP 919(#40): 화면 문구(RevDcf.overCapExplained의 "25년")와 계산 지평(`maxYears`)이 각자 리터럴 25를
//   따로 들고 있어 한쪽만 바뀌면 화면이 거짓말할 위험이 있었다(869 신규 §10 #40). 값은 그대로 25 — 이름만 붙여
//   route.ts(계산)와 RevDcfSection.tsx(화면)가 공유한다. lib/revdcf/** 밖에 둬 엔진 산식은 손대지 않는다.
export const REVDCF_DEFAULT_MAX_YEARS = 25;
