import { describe, expect, it } from "vitest";

import {
  applyFilters,
  applySearch,
  clampPage,
  getFilterOptions,
  resolveRowId,
  sortRows,
  totalClientPages,
} from "./tableLogic";
import type { ColumnDefinition, FilterDefinition } from "./types";

interface Row {
  id: string;
  name: string;
  author: string;
  createdAt: string;
  count: number;
}

const rows: Row[] = [
  { id: "a", name: "Beta", author: "alice", createdAt: "2026-01-10", count: 3 },
  { id: "b", name: "alpha", author: "bob", createdAt: "2026-03-01", count: 1 },
  { id: "c", name: "Gamma", author: "alice", createdAt: "2026-02-15", count: 2 },
];

const columns: ColumnDefinition<Row>[] = [
  { id: "name", label: "Name", getSortValue: (r) => r.name, renderCell: (r) => r.name },
  { id: "count", label: "Count", getSortValue: (r) => r.count, renderCell: (r) => String(r.count) },
  { id: "noSort", label: "NoSort", renderCell: () => "—" },
];

describe("resolveRowId", () => {
  it("uses item.id by default", () => {
    expect(resolveRowId(rows[0], 5)).toBe("a");
  });

  it("falls back to the index when there is no id", () => {
    expect(resolveRowId({ name: "x" } as unknown as Row, 7)).toBe("7");
  });

  it("prefers an explicit getRowId", () => {
    expect(resolveRowId(rows[0], 0, (r) => `row-${r.name}`)).toBe("row-Beta");
  });
});

describe("getFilterOptions", () => {
  it("returns distinct, sorted, non-empty values", () => {
    const filter: FilterDefinition<Row> = {
      id: "author",
      label: "Author",
      type: "select",
      getValue: (r) => r.author,
    };
    expect(getFilterOptions(rows, filter)).toEqual(["alice", "bob"]);
  });
});

describe("applyFilters", () => {
  const selectAuthor: FilterDefinition<Row> = {
    id: "author",
    label: "Author",
    type: "select",
    getValue: (r) => r.author,
  };
  const dateCreated: FilterDefinition<Row> = {
    id: "createdAt",
    label: "Created",
    type: "dateRange",
    getValue: (r) => r.createdAt,
  };

  it("returns all rows when no filter is active", () => {
    expect(applyFilters(rows, [selectAuthor], {}, {})).toHaveLength(3);
  });

  it("filters by a selected value", () => {
    const out = applyFilters(rows, [selectAuthor], { author: "alice" }, {});
    expect(out.map((r) => r.id)).toEqual(["a", "c"]);
  });

  it("filters by a date range (inclusive bounds)", () => {
    const out = applyFilters(
      rows,
      [dateCreated],
      {},
      { createdAt: { from: "2026-02-01", to: "2026-02-28" } },
    );
    expect(out.map((r) => r.id)).toEqual(["c"]);
  });

  it("supports an open-ended 'from' bound", () => {
    const out = applyFilters(
      rows,
      [dateCreated],
      {},
      { createdAt: { from: "2026-02-01" } },
    );
    expect(out.map((r) => r.id).sort()).toEqual(["b", "c"]);
  });

  it("ANDs multiple filters together", () => {
    const out = applyFilters(
      rows,
      [selectAuthor, dateCreated],
      { author: "alice" },
      { createdAt: { from: "2026-02-01" } },
    );
    expect(out.map((r) => r.id)).toEqual(["c"]);
  });
});

describe("applySearch", () => {
  it("matches case-insensitively across sortable columns", () => {
    expect(applySearch(rows, columns, "alpha").map((r) => r.id)).toEqual(["b"]);
  });

  it("returns all rows for an empty query", () => {
    expect(applySearch(rows, columns, "   ")).toHaveLength(3);
  });
});

describe("sortRows", () => {
  const nameCol = columns[0];
  const countCol = columns[1];

  it("sorts ascending", () => {
    expect(sortRows(rows, countCol, "asc").map((r) => r.count)).toEqual([1, 2, 3]);
  });

  it("sorts descending", () => {
    expect(sortRows(rows, countCol, "desc").map((r) => r.count)).toEqual([3, 2, 1]);
  });

  it("does not mutate the input", () => {
    const copy = [...rows];
    sortRows(rows, nameCol, "asc");
    expect(rows).toEqual(copy);
  });

  it("returns input unchanged when direction is null", () => {
    expect(sortRows(rows, nameCol, null)).toBe(rows);
  });

  it("orders null values last in asc and first in desc", () => {
    const withNull: Row[] = [
      ...rows,
      { id: "d", name: "Zeta", author: "x", createdAt: "2026-04-01", count: null as unknown as number },
    ];
    const colNullable: ColumnDefinition<Row> = {
      id: "count",
      label: "Count",
      getSortValue: (r) => (r.count == null ? null : r.count),
      renderCell: (r) => String(r.count),
    };
    const asc = sortRows(withNull, colNullable, "asc");
    const desc = sortRows(withNull, colNullable, "desc");
    expect(asc[asc.length - 1].id).toBe("d");
    expect(desc[0].id).toBe("d");
  });
});

describe("pagination helpers", () => {
  it("totalClientPages is never below 1", () => {
    expect(totalClientPages(0, 5)).toBe(1);
    expect(totalClientPages(11, 5)).toBe(3);
  });

  it("clampPage keeps the page within range", () => {
    expect(clampPage(4, 2)).toBe(1);
    expect(clampPage(0, 1)).toBe(0);
    expect(clampPage(-3, 5)).toBe(0);
    expect(clampPage(1, 5)).toBe(1);
  });
});
