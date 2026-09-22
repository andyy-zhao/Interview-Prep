import { test } from "node:test";
import assert from "node:assert/strict";
import { categoryMap, tags } from "./stories";
import { schemaFor } from "./validation";
const id = "90502292-d699-4313-b384-c341a189e778";
test("rough story requires only title and status, not STAR details", () => {
  const story = schemaFor("behavioral_stories").parse({
    id,
    title: "Rough idea",
    status: "idea",
  });
  assert.ok("title" in story && story.title === "Rough idea");
  assert.throws(() =>
    schemaFor("behavioral_stories").parse({ id, title: " ", status: "idea" }),
  );
});
test("story fields survive validation and unrelated fields are stripped", () => {
  const input = {
    id,
    title: "Story",
    status: "refined",
    short_summary: "Summary",
    company: "Achievers",
    project_name: "Project",
    situation: "Context",
    task: "Goal",
    action: "My contribution",
    result: "Impact",
    lessons: "Learning",
    themes: "Ownership, Dive Deep",
    leadership_principles: "Are Right, A Lot; Dive Deep",
    notes: "Follow up",
  };
  assert.deepEqual(
    schemaFor("behavioral_stories").parse({ ...input, unexpected: "no" }),
    input,
  );
  assert.deepEqual(tags(input.leadership_principles, ";"), [
    "Are Right, A Lot",
    "Dive Deep",
  ]);
});
test("mapping reuses one story across categories and exposes missing categories", () => {
  const story = {
    id,
    title: "Story",
    themes: "Ownership, Dive Deep, Ownership",
  };
  const mapping = categoryMap([story]);
  assert.equal(
    mapping.find((m) => m.category === "Ownership")!.stories[0],
    story,
  );
  assert.equal(
    mapping.find((m) => m.category === "Dive Deep")!.stories.length,
    1,
  );
  assert.equal(
    mapping.find((m) => m.category === "Failure / Mistake")!.stories.length,
    0,
  );
  assert.deepEqual(tags(" Ownership, , Ownership, Dive Deep"), [
    "Ownership",
    "Dive Deep",
  ]);
});
