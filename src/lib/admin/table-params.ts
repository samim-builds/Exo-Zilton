// Parses the URL search params that DataTable writes (q, page, per, sort, and
// one param per filter) into values a Prisma query can use.

export type SearchParams = Record<string, string | string[] | undefined>;

export const PAGE_SIZES = [10, 25, 50, 100] as const;

export type TableParams<S extends string, F extends string> = {
  q: string;
  page: number;
  perPage: number;
  skip: number;
  take: number;
  sort: { id: S; desc: boolean };
  filters: Partial<Record<F, string[]>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseTableParams<S extends string, F extends string = never>(
  params: SearchParams,
  options: { sortable: readonly S[]; defaultSort: { id: S; desc: boolean }; filters?: readonly F[] },
): TableParams<S, F> {
  const q = first(params.q)?.trim().slice(0, 200) ?? "";

  const per = Number(first(params.per));
  const perPage = (PAGE_SIZES as readonly number[]).includes(per) ? per : 25;
  const page = Math.max(1, Math.floor(Number(first(params.page))) || 1);

  const [sortId, sortDir] = (first(params.sort) ?? "").split(".");
  const sort = options.sortable.includes(sortId as S)
    ? { id: sortId as S, desc: sortDir !== "asc" }
    : options.defaultSort;

  const filters: Partial<Record<F, string[]>> = {};
  for (const key of options.filters ?? []) {
    const raw = first(params[key]);
    if (raw) filters[key] = raw.split(",").filter(Boolean);
  }

  return { q, page, perPage, skip: (page - 1) * perPage, take: perPage, sort, filters };
}
