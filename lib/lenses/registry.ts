// 렌즈 레지스트리 — 단일 출처(목록·순서·percentile 설정이 여기 한 곳). (docs/LENS_ARCHITECTURE.md §3)
// 렌즈 추가 = 이 배열에 한 줄. 순서 = 화면·배치 출력 순서(모멘텀·저변동·기술·밸류·퀄리티·자산성장).
import type { Lens } from "./types";
import { momentum, lowVol, technical, valuation, quality, assetGrowth } from "../lenses";

export const LENSES: Lens[] = [momentum, lowVol, technical, valuation, quality, assetGrowth];
