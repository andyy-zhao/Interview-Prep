import type { RecordData } from "./types";
import fields from "./fields.json";
export const storyStatuses: Record<string, string> = {
  idea: "Rough Idea",
  rough: "STAR Draft",
  refined: "Polished",
  "interview-ready": "Interview Ready",
};
export const tags = (value: unknown, separator = ",") => [
  ...new Set(
    String(value || "")
      .split(separator)
      .map((t) => t.trim())
      .filter(Boolean),
  ),
];
export const questionCategories = fields.behavioral_stories.find(
  (f) => f.key === "themes",
)!.options!;
export function categoryMap(stories: RecordData[]) {
  const categories = [
    ...new Set([
      ...questionCategories,
      ...stories.flatMap((s) => tags(s.themes)),
    ]),
  ].sort();
  return categories.map((category) => ({
    category,
    stories: stories.filter((s) => tags(s.themes).includes(category)),
  }));
}
export const storySections = [
  ["Overview / short summary", "short_summary"],
  ["Situation", "situation"],
  ["Task", "task"],
  ["Action", "action"],
  ["Result", "result"],
  ["Learnings", "lessons"],
  ["Question categories", "themes"],
  ["Leadership Principles", "leadership_principles"],
  ["Additional notes", "notes"],
] as const;
