import assert from "node:assert/strict";
const base = process.env.TEST_API_URL || "http://127.0.0.1:3001/api";
const id = crypto.randomUUID();
async function request(path, method = "GET", body) {
  const r = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error);
  return data;
}
try {
  await request("/behavioral_stories", "POST", {
    id,
    title: "Temporary STAR verification",
    status: "idea",
  });
  let row = (await request("/data")).data.behavioral_stories.find(
    (s) => s.id === id,
  );
  assert.ok(row);
  assert.equal(row.situation, null);
  await request("/behavioral_stories", "POST", {
    ...row,
    action: "Test action only",
    themes: "Ownership, Dive Deep",
    leadership_principles: "Are Right, A Lot; Dive Deep",
  });
  row = (await request("/data")).data.behavioral_stories.find(
    (s) => s.id === id,
  );
  assert.equal(row.action, "Test action only");
  assert.equal(row.themes, "Ownership, Dive Deep");
  assert.equal(row.leadership_principles, "Are Right, A Lot; Dive Deep");
  assert.equal(row.situation, null);
  await request("/behavioral_stories", "POST", {
    ...row,
    notes: "Refined later",
    status: "refined",
  });
  row = (await request("/data")).data.behavioral_stories.find(
    (s) => s.id === id,
  );
  assert.equal(row.action, "Test action only");
  assert.equal(row.notes, "Refined later");
  assert.equal(row.status, "refined");
  console.log(
    "PASS: rough creation, persistent STAR edits, category/LP round-trip, status and preserved sections",
  );
} finally {
  await request("/behavioral_stories/" + id, "DELETE");
}
assert.equal(
  (await request("/data")).data.behavioral_stories.some((s) => s.id === id),
  false,
);
console.log("PASS: deletion and cleanup");
