import { test } from "node:test";
import assert from "node:assert/strict";
import { sortProblems } from "./problem-sorting";
import type { RecordData } from "./types";
const ids = (rows: RecordData[]) => rows.map((p) => p.id);
test("default prioritizes overdue, due, weak active, mastered, then inactive without mutating", () => {
  const rows = [
    {
      id: "inactive",
      active: false,
      mastery: "RED",
      next_review_date: "2026-01-01",
    },
    {
      id: "green",
      active: true,
      mastery: "GREEN",
      next_review_date: "2026-10-06",
    },
    { id: "weak", active: true, mastery: "RED" },
    { id: "due", active: true, mastery: "RED", next_review_date: "2026-09-22" },
    {
      id: "overdue",
      active: true,
      mastery: "GREEN",
      next_review_date: "2026-09-20",
    },
  ];
  const before = structuredClone(rows);
  assert.deepEqual(ids(sortProblems(rows, "review_priority", "2026-09-22")), [
    "overdue",
    "due",
    "weak",
    "green",
    "inactive",
  ]);
  assert.deepEqual(rows, before);
});
test("title ties use numeric titles then IDs, independent of input order", () => {
  const rows = [
    { id: "b", title: "Problem 2" },
    { id: "c", title: "Problem 10" },
    { id: "a", title: "Problem 2" },
  ];
  assert.deepEqual(ids(sortProblems(rows, "title")), ["a", "b", "c"]);
  assert.deepEqual(ids(sortProblems([...rows].reverse(), "title")), [
    "a",
    "b",
    "c",
  ]);
});
test("difficulty and mastery use semantic order with missing values last", () => {
  const rows = [
    { id: "h", difficulty: "Hard", mastery: "GREEN" },
    { id: "x" },
    { id: "m", difficulty: "Medium", mastery: "YELLOW" },
    { id: "e", difficulty: "Easy", mastery: "RED" },
    { id: "o", difficulty: "Medium", mastery: "ORANGE" },
  ];
  assert.deepEqual(ids(sortProblems(rows, "difficulty")), [
    "e",
    "m",
    "o",
    "h",
    "x",
  ]);
  assert.deepEqual(ids(sortProblems(rows, "mastery")), [
    "e",
    "o",
    "m",
    "h",
    "x",
  ]);
});
test("review dates put unscheduled last and recent attempts use full timestamps", () => {
  const rows = [
    { id: "a", next_review_date: null },
    { id: "b", next_review_date: "2026-10-06" },
    { id: "c", next_review_date: "2026-09-22" },
  ];
  assert.deepEqual(ids(sortProblems(rows, "next_review")), ["c", "b", "a"]);
  const attempts = [
    { id: "1", problem_id: "b", attempted_at: "2026-09-22T09:00:00Z" },
    { id: "2", problem_id: "c", attempted_at: "2026-09-22T10:00:00Z" },
    { id: "3", problem_id: "c", attempted_at: "2026-09-21T10:00:00Z" },
  ];
  assert.deepEqual(
    ids(sortProblems(rows, "recently_attempted", "2026-09-22", attempts)),
    ["c", "b", "a"],
  );
});
