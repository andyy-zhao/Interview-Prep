import assert from "node:assert/strict";
const base = process.env.TEST_API_URL || "http://127.0.0.1:3001/api";
const story = crypto.randomUUID(),
  q1 = crypto.randomUUID(),
  q2 = crypto.randomUUID();
async function req(path, method = "GET", body) {
  const r = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}
const save = (table, row) => req("/" + table, "POST", row);
try {
  await save("behavioral_stories", {
    id: story,
    title: "Temporary experience test",
    status: "idea",
    context: "Facts only",
  });
  await save("behavioral_questions", {
    id: q1,
    question_text: "Temporary question one",
    status: "rough",
    linked_story_id: story,
    response: "Answer one",
  });
  await save("behavioral_questions", {
    id: q2,
    question_text: "Temporary question two",
    status: "idea",
    linked_story_id: story,
  });
  let data = (await req("/data")).data;
  assert.equal(
    data.behavioral_questions.find((q) => q.id === q2).response,
    null,
  );
  assert.equal(
    data.behavioral_questions.find((q) => q.id === q1).situation,
    null,
  );
  await save("behavioral_questions", {
    ...data.behavioral_questions.find((q) => q.id === q1),
    linked_story_id: null,
    response: "Revised answer",
    action: "Specific angle",
  });
  data = (await req("/data")).data;
  assert.equal(
    data.behavioral_stories.find((s) => s.id === story).context,
    "Facts only",
  );
  assert.equal(
    data.behavioral_questions.find((q) => q.id === q1).linked_story_id,
    null,
  );
  await req("/behavioral_stories/" + story, "DELETE");
  data = (await req("/data")).data;
  assert.equal(
    data.behavioral_questions.find((q) => q.id === q2).linked_story_id,
    null,
  );
  assert.equal(
    data.behavioral_questions.find((q) => q.id === q1).response,
    "Revised answer",
  );
  console.log(
    "PASS: many questions per story; independent drafts; unlinking; deletion preserves answers",
  );
} finally {
  for (const id of [q1, q2])
    await req("/behavioral_questions/" + id, "DELETE").catch(() => {});
  await req("/behavioral_stories/" + story, "DELETE").catch(() => {});
}
