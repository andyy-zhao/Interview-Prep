import { test } from "node:test";
import assert from "node:assert/strict";
import { attemptSchema, suggestedReview, sessionAttempt } from "./attempts";
const base = {
  id: "90502292-d699-4313-b384-c341a189e778",
  problem_id: "756cf32f-3b79-4d7e-8c46-c0dfdeeb4b6b",
  attempted_at: "2026-09-21T12:00:00.000Z",
  solved: true,
  time_spent: 28,
  hints_used: 2,
  perceived_difficulty: "Medium",
  mastery_after: "YELLOW",
};
test("scheduled payload retains task, complexity and review date", () => {
  const a = attemptSchema.parse({
    ...base,
    task_id: "564e91f0-aea2-489a-bbb1-0767af7fb447",
    time_complexity: "O(n)",
    space_complexity: "O(n)",
    average_case_complexity: "O(n)",
    worst_case_complexity: "O(n²)",
    complexity_explanation: "Quickselect partitioning",
    next_review_date: "2026-09-22",
  });
  assert.equal(a.task_id, "564e91f0-aea2-489a-bbb1-0767af7fb447");
  assert.equal(a.worst_case_complexity, "O(n²)");
  assert.equal(a.review_action, "normal");
});
test("standalone attempt needs no task; solving does not imply GREEN", () => {
  const a = attemptSchema.parse(base);
  assert.equal(a.task_id, undefined);
  assert.equal(a.mastery_after, "YELLOW");
});
test("reject invalid session IDs, times, dates and inconsistent quick actions", () => {
  for (const patch of [
    { task_id: "invalid" },
    { time_spent: -1 },
    { hints_used: 1.5 },
    { next_review_date: "2026-02-31" },
    { review_action: "easy" },
    { review_action: "stuck" },
    {
      mastery_after: "GREEN",
      review_action: "easy",
      next_review_date: "2026-09-22",
    },
  ])
    assert.equal(attemptSchema.safeParse({ ...base, ...patch }).success, false);
});
test("review suggestions follow mastery and explicit quick actions", () => {
  const p = { id: "p", review_stage: 2 };
  assert.equal(
    suggestedReview(p, "YELLOW", "normal", "2026-09-21"),
    "2026-09-25",
  );
  assert.equal(suggestedReview(p, "RED", "normal", "2026-09-21"), "2026-09-22");
  assert.equal(suggestedReview(p, "GREEN", "easy", "2026-09-21"), null);
  assert.equal(suggestedReview(p, "RED", "stuck", "2026-09-21"), "2026-09-21");
  assert.equal(
    suggestedReview(p, "GREEN", "mastered", "2026-09-21"),
    "2026-10-05",
  );
});
test("session association uses task ID, never problem or date guessing", () => {
  const attempts = [
    { id: "a", problem_id: "p", task_id: "task-one" },
    { id: "b", problem_id: "p" },
  ];
  assert.equal(sessionAttempt(attempts, { id: "task-one" })?.id, "a");
  assert.equal(sessionAttempt(attempts, { id: "task-two" }), undefined);
});
