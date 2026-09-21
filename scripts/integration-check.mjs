import assert from "node:assert/strict";
const base = "http://127.0.0.1:5173/api";
const day = new Date().toLocaleDateString("en-CA");
const id = () => crypto.randomUUID();
const pid = id(),
  tid = id(),
  aid = id();
const cleanup = [];
async function request(path, body, method = "POST") {
  const r = await fetch(
    base + path,
    body
      ? {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : { method },
  );
  const data = await r.json();
  assert.ok(r.ok, JSON.stringify(data));
  return data;
}
const load = async () => (await request("/data", null, "GET")).data;
try {
  await request("/leetcode_problems", {
    id: pid,
    title: "QA temporary problem",
    difficulty: "Medium",
    mastery: "YELLOW",
    active: true,
    pattern: "Hash map",
    review_stage: 0,
    next_review_date: day,
  });
  cleanup.push(["leetcode_problems", pid]);
  await request("/tasks", {
    id: tid,
    title: "QA temporary session",
    category: "LeetCode",
    scheduled_date: day,
    start_time: "08:00",
    end_time: "08:30",
    problem_id: pid,
    completed: false,
  });
  cleanup.push(["tasks", tid]);
  let data = await load();
  assert.ok(data.tasks.some((t) => t.id === tid));
  await request("/tasks", {
    ...data.tasks.find((t) => t.id === tid),
    completed: true,
  });
  assert.ok((await load()).tasks.find((t) => t.id === tid).completed);
  const attempt = {
    id: aid,
    problem_id: pid,
    attempted_at: new Date().toISOString(),
    solved: true,
    time_spent: 20,
    hints_used: 0,
    perceived_difficulty: "Medium",
    mastery_after: "GREEN",
    notes: "Temporary integration verification",
  };
  await request("/attempt", attempt);
  await request("/attempt", attempt);
  data = await load();
  assert.equal(
    data.leetcode_attempts.filter((a) => a.problem_id === pid).length,
    1,
  );
  assert.equal(
    data.leetcode_reviews.filter((a) => a.problem_id === pid).length,
    1,
  );
  assert.equal(
    data.leetcode_problems.find((p) => p.id === pid).mastery,
    "GREEN",
  );
  await request("/quick/" + pid, { action: "stuck" });
  await request("/review/" + pid, {});
  assert.equal(
    (await load()).leetcode_reviews.filter((r) => r.problem_id === pid).length,
    2,
  );
  await request("/quick/" + pid, { action: "easy" });
  assert.equal(
    (await load()).leetcode_problems.find((p) => p.id === pid).active,
    false,
  );
  for (const [table, extra] of [
    ["system_design_topics", { status: "Learned", confidence: 4 }],
    [
      "system_design_exercises",
      { status: "Completed", confidence: 3, date_attempted: day },
    ],
    [
      "behavioral_stories",
      {
        status: "interview-ready",
        themes: "ownership",
        confidence: 4,
        situation: "Test",
      },
    ],
    [
      "achievers_projects",
      { summary: "Test", confidence: 4, interview_ready: true },
    ],
  ]) {
    const rid = id();
    await request("/" + table, {
      id: rid,
      title: "QA temporary record",
      ...extra,
    });
    cleanup.push([table, rid]);
    assert.ok((await load())[table].some((r) => r.id === rid));
  }
  const bad = await fetch(base + "/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: id(), title: "bad" }),
  });
  assert.equal(bad.status, 400);
  const cross = await fetch(base + "/data", {
    headers: { Origin: "https://example.com" },
  });
  assert.equal(cross.status, 403);
  console.log(
    "PASS: all record types save/read; task completion; atomic attempts; idempotent retry; due review completion; quick actions; invalid-input and cross-origin rejection.",
  );
} finally {
  for (const [table, rid] of cleanup.reverse())
    await request("/" + table + "/" + rid, null, "DELETE");
  console.log("Temporary test records removed.");
}
