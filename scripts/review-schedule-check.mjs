import assert from "node:assert/strict";
const base = process.env.TEST_API_URL || "http://127.0.0.1:3001/api";
const id = crypto.randomUUID();
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
}).format(new Date());
const plus = (n) => {
  const d = new Date(today + "T12:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
async function call(path, body, method = "POST") {
  const r = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json();
  assert.ok(r.ok, JSON.stringify(data));
  return data;
}
const load = async () => {
  const { data } = await call("/data", null, "GET");
  return data.leetcode_problems.find((p) => p.id === id);
};
const attempt = (extra = {}) => ({
  id: crypto.randomUUID(),
  problem_id: id,
  attempted_at: new Date().toISOString(),
  solved: true,
  time_spent: 10,
  time_spent_seconds: 45,
  hints_used: 0,
  perceived_difficulty: "Medium",
  mastery_after: "GREEN",
  review_action: "normal",
  review_mode: "automatic",
  ...extra,
});
await call("/leetcode_problems", {
  id,
  title: "QA review preservation (temporary)",
  difficulty: "Medium",
  mastery: "RED",
  active: true,
  review_stage: 0,
});
try {
  await call("/attempt", attempt());
  assert.equal((await load()).next_review_date, plus(14));
  let p = await load();
  await call("/leetcode_problems", { ...p, next_review_date: plus(40) });
  await call("/attempt", attempt({ next_review_date: plus(1) }));
  assert.equal((await load()).next_review_date, plus(40));
  await call(
    "/attempt",
    attempt({ review_mode: "custom", next_review_date: plus(5) }),
  );
  assert.equal((await load()).next_review_date, plus(5));
  await call(
    "/attempt",
    attempt({ mastery_after: "RED", solved: false, review_action: "stuck" }),
  );
  assert.equal((await load()).next_review_date, today);
  await call("/attempt", attempt({ review_action: "mastered" }));
  assert.equal((await load()).next_review_date, plus(14));
  console.log(
    "PASS: GREEN 14-day default; later plan preserved despite stale automatic date; explicit date and Got Stuck respected; Mark Mastered 14-day schedule.",
  );
} finally {
  await call("/leetcode_problems/" + id, null, "DELETE");
  console.log("Temporary review fixture removed.");
}
