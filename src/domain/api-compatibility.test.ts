import { test } from "node:test";
import assert from "node:assert/strict";
import { api } from "../data/api";
import { attemptSchema } from "./attempts";
const input = attemptSchema.parse({
  id: "90502292-d699-4313-b384-c341a189e778",
  problem_id: "756cf32f-3b79-4d7e-8c46-c0dfdeeb4b6b",
  attempted_at: "2026-09-21T12:00:00Z",
  solved: true,
  time_spent: 2,
  hints_used: 0,
  perceived_difficulty: "Easy",
  mastery_after: "GREEN",
});
test("outdated backend is rejected before any attempt is submitted", async (t) => {
  const paths: string[] = [];
  t.mock.method(globalThis, "fetch", async (path: string) => {
    paths.push(path);
    return new Response(JSON.stringify({ workflowVersion: 1 }));
  });
  await assert.rejects(api.attempt(input), /Restart npm run dev/);
  assert.deepEqual(paths, ["/api/health"]);
});
test("compatible backend receives the full attempt after version check", async (t) => {
  const paths: string[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (path: string, options?: RequestInit) => {
      paths.push(path);
      if (path.endsWith("/health"))
        return new Response(JSON.stringify({ workflowVersion: 3 }));
      assert.equal(JSON.parse(String(options?.body)).mastery_after, "GREEN");
      return new Response(JSON.stringify({ ok: true, attempt_id: input.id }));
    },
  );
  await api.attempt(input);
  assert.deepEqual(paths, ["/api/health", "/api/attempt"]);
});
