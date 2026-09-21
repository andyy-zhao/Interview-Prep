import assert from "node:assert/strict";
const base = process.env.TEST_API_URL || "http://127.0.0.1:3001/api";
const day = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
}).format(new Date());
const id = () => crypto.randomUUID();
const problemId = id();
const taskId = id();
const secondTaskId = id();
const cleanup = [];
async function request(path, body, method = "POST", expected = 200) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  assert.equal(res.status, expected, JSON.stringify(data));
  return data;
}
const load = async () => (await request("/data", null, "GET")).data;
const attempt = (task = taskId) => ({
  id: id(),
  problem_id: problemId,
  task_id: task,
  attempted_at: new Date().toISOString(),
  solved: true,
  time_spent: 28,
  hints_used: 2,
  perceived_difficulty: "Medium",
  mastery_after: "YELLOW",
  time_complexity: "O(n)",
  space_complexity: "O(n)",
  average_case_complexity: "O(n)",
  worst_case_complexity: "O(n²)",
  complexity_explanation: "Temporary integration fixture",
  notes: "Temporary session verification",
  review_action: "normal",
});
try {
  await request("/leetcode_problems", {
    id: problemId,
    title: "QA session workflow (temporary)",
    difficulty: "Medium",
    mastery: "RED",
    active: true,
    review_stage: 0,
  });
  cleanup.push(["leetcode_problems", problemId]);
  for (const tid of [taskId, secondTaskId]) {
    await request("/tasks", {
      id: tid,
      title: "QA linked session (temporary)",
      category: "LeetCode",
      problem_id: problemId,
      scheduled_date: day,
      start_time: "08:00",
      end_time: "08:30",
      completed: false,
    });
    cleanup.push(["tasks", tid]);
  }
  const first = attempt();
  const concurrent = await Promise.all([
    request("/attempt", first),
    request("/attempt", { ...first, id: id() }),
  ]);
  assert.equal(concurrent[0].attempt_id, concurrent[1].attempt_id);
  await request("/attempt", first);
  let data = await load();
  let rows = data.leetcode_attempts.filter((a) => a.task_id === taskId);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].worst_case_complexity, "O(n²)");
  assert.equal(data.tasks.find((t) => t.id === taskId).completed, true);
  assert.equal(data.tasks.find((t) => t.id === secondTaskId).completed, false);
  assert.equal(
    data.leetcode_reviews.filter((r) => r.problem_id === problemId).length,
    1,
  );
  assert.equal(
    data.leetcode_problems.find((p) => p.id === problemId).mastery,
    "YELLOW",
  );
  // Fail after the inner record_practice writes; the enclosing transaction must roll back everything.
  await request(
    "/attempt",
    { ...attempt(secondTaskId), next_review_date: "2000-01-01" },
    "POST",
    400,
  );
  data = await load();
  assert.equal(
    data.leetcode_attempts.filter((a) => a.problem_id === problemId).length,
    1,
  );
  assert.equal(
    data.leetcode_reviews.filter((r) => r.problem_id === problemId).length,
    1,
  );
  assert.equal(data.tasks.find((t) => t.id === secondTaskId).completed, false);
  await request(
    "/attempt",
    { ...attempt(secondTaskId), problem_id: id() },
    "POST",
    400,
  );
  const spontaneous = attempt(null);
  await request("/attempt", spontaneous);
  await request("/attempt", spontaneous);
  data = await load();
  assert.equal(
    data.leetcode_attempts.filter((a) => a.id === spontaneous.id).length,
    1,
  );
  assert.equal(data.tasks.find((t) => t.id === secondTaskId).completed, false);
  await request("/attempt", {
    ...attempt(secondTaskId),
    mastery_after: "GREEN",
    review_action: "easy",
    next_review_date: null,
  });
  data = await load();
  assert.equal(
    data.leetcode_problems.find((p) => p.id === problemId).active,
    false,
  );
  assert.equal(
    data.leetcode_problems.find((p) => p.id === problemId).next_review_date,
    null,
  );
  assert.equal(data.tasks.find((t) => t.id === secondTaskId).completed, true);
  for (const action of ["stuck", "later", "mastered"])
    await request("/attempt", {
      ...attempt(null),
      review_action: action,
      mastery_after: action === "stuck" ? "RED" : "GREEN",
    });
  data = await load();
  assert.equal(
    data.leetcode_attempts.filter((a) => a.problem_id === problemId).length,
    6,
  );
  assert.equal(
    data.leetcode_reviews.filter((r) => r.problem_id === problemId).length,
    6,
  );
  // ID collision across sessions must fail instead of attaching history to the wrong task.
  await request("/attempt", { ...first, task_id: secondTaskId }, "POST", 400);
  console.log(
    "PASS: concurrent session submissions, replay, atomic rollback, complexity persistence, linked-task completion, standalone attempts, quick actions, and mismatch rejection.",
  );
} finally {
  for (const [table, rid] of cleanup.reverse())
    await request("/" + table + "/" + rid, null, "DELETE");
  console.log("Temporary session fixtures removed.");
}
