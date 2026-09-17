import test from "node:test";
import assert from "node:assert/strict";
import { dateKey, monthDays, taskCsv } from "../client/src/planning";
import type { Task } from "../client/src/types";
test("calendar keeps local dates and spans Monday through Sunday across year and leap boundaries", () => {
  const january = monthDays(new Date(2027, 0, 1));
  assert.equal(january.length, 42);
  assert.equal(dateKey(january[0]), "2026-12-28");
  assert.equal(january[41].getDay(), 0);
  assert.ok(
    monthDays(new Date(2028, 1, 1)).some((d) => dateKey(d) === "2028-02-29"),
  );
});
test("CSV preserves punctuation and neutralizes formulas in user-supplied text", () => {
  const csv = taskCsv([
    {
      title: ' =HYPERLINK("evil")',
      description: "A, B\nC",
      status: "todo",
      priority: "high",
      dueDate: "2026-09-17T12:00:00Z",
      assignee: { name: "@formula" },
    } as Task,
  ]);
  assert.ok(csv.includes('"\' =HYPERLINK(""evil"")"'));
  assert.ok(csv.includes('"A, B\nC"'));
  assert.ok(csv.includes('"\'@formula"'));
  assert.ok(csv.includes('"2026-09-17"'));
});
