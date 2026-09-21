import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, monday, nextReview, minutes } from "./types";
import { schemaFor } from "./validation";
test("Monday–Sunday navigation crosses years", () => {
  assert.equal(monday("2026-01-04"), "2025-12-29");
  assert.equal(addDays("2025-12-29", 7), "2026-01-05");
});
test("Review intervals produce day 1, 3, 7, 14", () => {
  let d = "2026-09-21";
  const dates = [];
  for (let stage = 0; stage < 4; stage++) {
    d = nextReview(d, stage);
    dates.push(d);
  }
  assert.deepEqual(dates, [
    "2026-09-22",
    "2026-09-24",
    "2026-09-28",
    "2026-10-05",
  ]);
});
test("Duration handles PostgreSQL time values", () =>
  assert.equal(
    minutes({ id: "x", start_time: "08:25:00", end_time: "08:55:00" }),
    30,
  ));
test("Task validation rejects reversed times and blank title", () => {
  const task = {
    id: "5ec7b8a7-3e63-437e-aabb-e17a965c8461",
    title: "Study",
    category: "LeetCode",
    scheduled_date: "2026-09-21",
    start_time: "08:00",
    end_time: "09:00",
  };
  assert.ok(schemaFor("tasks").safeParse(task).success);
  assert.ok(
    !schemaFor("tasks").safeParse({ ...task, end_time: "07:00" }).success,
  );
  assert.ok(!schemaFor("tasks").safeParse({ ...task, title: " " }).success);
  assert.ok(
    !schemaFor("tasks").safeParse({ ...task, scheduled_date: "2026-02-31" })
      .success,
  );
});
