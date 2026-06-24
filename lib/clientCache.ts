// 탭 전환 즉시 표시용 클라이언트 캐시 (세션 한정, stale-while-revalidate)
// 한 번 받은 탭 데이터를 메모리에 저장 → 같은 탭 재방문 시 즉시 표시, 백그라운드로만 갱신.
const store = new Map<string, unknown>();

export function getCache<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function setCache(key: string, value: unknown): void {
  store.set(key, value);
}

// 로그아웃 시 호출 — 메모리 캐시 비워 다음 사용자가 신선한 데이터 받게.
export function clearCache(): void {
  store.clear();
}
