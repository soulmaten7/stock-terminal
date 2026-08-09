/**
 * STEP 954 — Supabase 전체 조회 공용 페이지네이션 헬퍼.
 *
 * 🔴 왜 필요한가: PostgREST는 `ORDER BY` 없는 쿼리의 행 순서를 실행마다 보장하지 않는다 —
 *   별개의 `.range()` 페이지 호출들이 매번 같은 스캔 순서를 쓴다는 보장이 없어, 페이지 경계에 걸친
 *   행이 어느 페이지에도 안 들어가는 일이 생긴다(STEP 953 실측: `damodaran_industry` 동일 인자
 *   10회 반복 호출 중 1회, 118건 결측). `orderBy`는 반드시 **고유 전순서**여야 한다 — 동점이 남으면
 *   그 구간은 여전히 비결정적이다(정렬 키가 유일하지 않으면 동점 그룹 내부의 상대 순서는 여전히
 *   보장되지 않는다).
 *
 * 🔴 이 파일은 "행을 어떻게 읽어오는가"만 다룬다. 어느 테이블을 읽을지·필터·판정 로직은 호출부의 몫이다.
 * 🔴 재시도·백오프는 넣지 않는다(범위 밖) — 에러는 그대로 던진다.
 */

export interface PageOrder {
  column: string;
  nullsFirst?: boolean;
}

// 🔴 @supabase/postgrest-js의 PostgrestFilterBuilder는 스키마 제네릭이 매우 복잡해(DB 타입 생성 없이는
//   실질적으로 못 씀 — 이 저장소는 생성된 DB 타입을 안 씀, 기존 관행: 모든 곳에서 `as T[]` 캐스팅) 여기서는
//   이 함수가 실제로 쓰는 두 메서드(`order`·`range`)만 구조적으로 요구한다. 실제 Supabase 쿼리 객체는
//   이 구조를 만족하므로 별도 캐스팅 없이 그대로 전달 가능하다.
interface OrderableRangeQuery<T> {
  order(column: string, opts: { ascending: true; nullsFirst?: boolean }): OrderableRangeQuery<T>;
  range(from: number, to: number): PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
}

/**
 * `build()`가 만드는 쿼리(이미 `.select()`·`.eq()` 등 필터까지 끝낸 상태)를 `orderBy` 순서대로
 * 정렬한 뒤 `pageSize` 단위로 전량 페이지네이션해 읽는다.
 * `build`는 페이지마다 새로 호출된다(Supabase 빌더는 1회용 체인이라 재사용 불가).
 */
export async function fetchAllRows<T>(
  build: () => OrderableRangeQuery<T>,
  orderBy: PageOrder[],
  pageSize = 1000
): Promise<T[]> {
  if (orderBy.length === 0) {
    throw new Error("fetchAllRows: orderBy가 비어 있다 — 정렬 없는 페이지네이션은 결과가 실행마다 흔들릴 수 있다(STEP 953/954)");
  }
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    let q = build();
    for (const o of orderBy) q = q.order(o.column, { ascending: true, nullsFirst: o.nullsFirst });
    const { data, error } = await q.range(from, from + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    out.push(...page);
    if (page.length < pageSize) break;
  }
  return out;
}
