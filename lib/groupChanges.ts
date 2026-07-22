// 변화 리스트 종목당 묶기(STEP 776 §3) — 같은 심볼의 다중 렌즈 변화를 한 행으로. 대표=정렬 순 첫 등장, 나머지는 "외 N건".
// 오늘 화면 3섹션·탐색 목록·풀리스트가 공용(중복 구현 금지). 톤 필터는 호출부가 먼저 걸러서 넘긴다(필터 후 그룹핑).
export function groupBySymbol<T extends { symbol: string }>(items: T[]): { item: T; extra: number }[] {
  const indexOf = new Map<string, number>();
  const result: { item: T; extra: number }[] = [];
  for (const it of items) {
    const idx = indexOf.get(it.symbol);
    if (idx == null) {
      indexOf.set(it.symbol, result.length);
      result.push({ item: it, extra: 0 });
    } else {
      result[idx].extra += 1;
    }
  }
  return result;
}
