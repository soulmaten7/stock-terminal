// STEP 954 §1-3 — fetchAllRows 유닛테스트.
import { describe, it, expect, vi } from "vitest";
import { fetchAllRows, type PageOrder } from "./supabasePaging";

function mockQuery<T>(pages: T[][]) {
  const orderCalls: { column: string; opts: { ascending: true; nullsFirst?: boolean } }[] = [];
  let pageIdx = -1; // build()가 새로 호출될 때마다 다음 페이지로
  const build = () => {
    pageIdx++;
    const thisPageIdx = pageIdx;
    const chain = {
      order: vi.fn((column: string, opts: { ascending: true; nullsFirst?: boolean }) => {
        orderCalls.push({ column, opts });
        return chain;
      }),
      range: async () => ({ data: pages[thisPageIdx] ?? [], error: null }),
    };
    return chain;
  };
  return { build, orderCalls };
}

describe("fetchAllRows", () => {
  it("🔴 orderBy 빈 배열 → throw(조용히 넘어가지 않는다)", async () => {
    const { build } = mockQuery<{ id: number }>([[{ id: 1 }]]);
    await expect(fetchAllRows(build, [])).rejects.toThrow(/orderBy/);
  });

  it("2페이지 이상일 때 .order()가 실제로 호출된다(mock 확인)", async () => {
    const page1 = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
    const page2 = [{ id: 1000 }];
    const { build, orderCalls } = mockQuery([page1, page2]);
    const orderBy: PageOrder[] = [{ column: "exchange", nullsFirst: true }, { column: "ticker" }];
    const rows = await fetchAllRows(build, orderBy, 1000);
    expect(rows.length).toBe(1001);
    // 페이지마다 build()가 다시 호출되고, 그때마다 orderBy 전항목이 .order()로 걸린다 — 2페이지 × 2개 키 = 4회
    expect(orderCalls.length).toBe(4);
  });

  it("nullsFirst가 각 order() 호출에 그대로 전달된다", async () => {
    const { build, orderCalls } = mockQuery([[{ id: 1 }]]);
    const orderBy: PageOrder[] = [{ column: "exchange", nullsFirst: true }, { column: "ticker" }];
    await fetchAllRows(build, orderBy, 1000);
    expect(orderCalls[0]).toEqual({ column: "exchange", opts: { ascending: true, nullsFirst: true } });
    expect(orderCalls[1]).toEqual({ column: "ticker", opts: { ascending: true, nullsFirst: undefined } });
  });

  it("마지막 페이지 경계: 총 행 수가 정확히 pageSize 배수(1000)면 빈 페이지까지 한 번 더 읽어 종료를 확인한다", async () => {
    const page1 = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
    const page2: { id: number }[] = []; // 정확히 1000개뿐이므로 다음 페이지는 빈 배열
    const { build } = mockQuery([page1, page2]);
    const rows = await fetchAllRows(build, [{ column: "id" }], 1000);
    expect(rows.length).toBe(1000);
  });

  it("에러를 삼키지 않고 던진다", async () => {
    const build = () => {
      const chain = {
        order: () => chain,
        range: async () => ({ data: null, error: { message: "boom" } }),
      };
      return chain;
    };
    await expect(fetchAllRows(build, [{ column: "id" }])).rejects.toEqual({ message: "boom" });
  });
});
