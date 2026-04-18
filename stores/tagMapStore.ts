import { create } from 'zustand';

/**
 * 종목명 → symbol 매핑 맵. 채팅 메시지에서 $삼성전자 같은 한글 태그를 링크화할 때 사용.
 * 마운트 시 1회 fetch → 캐시. 페이지 이동·탭 전환 시에도 유지 (Persistent Chat 과 함께).
 */
type TagMapState = {
  tagMap: Record<string, string>;
  loaded: boolean;
  loading: boolean;
  loadTagMap: () => Promise<void>;
};

export const useTagMapStore = create<TagMapState>((set, get) => ({
  tagMap: {},
  loaded: false,
  loading: false,
  loadTagMap: async () => {
    const { loaded, loading } = get();
    if (loaded || loading) return;
    set({ loading: true });
    try {
      const res = await fetch('/api/stocks/tag-map');
      if (res.ok) {
        const { tagMap } = await res.json();
        set({ tagMap: tagMap ?? {}, loaded: true, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },
}));
