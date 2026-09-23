import type { RecordData } from "./types";
import fields from "./fields.json";
export const storyStatuses: Record<string, string> = {
  idea: "Idea",
  developed: "Developed",
  strong: "Strong",
};
export const questionStatuses: Record<string, string> = {
  idea: "Idea",
  rough: "Rough Draft",
  refined: "Refined",
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
  (f) => f.key === "useful_angles",
)!.options!;
export function categoryMap(
  stories: RecordData[],
  questions: RecordData[] = [],
) {
  return [
    ...new Set([
      ...questionCategories,
      ...stories.flatMap((s) => tags(s.useful_angles)),
      ...questions.flatMap((q) => tags(q.category)),
    ]),
  ]
    .sort()
    .map((category) => ({
      category,
      stories: stories.filter((s) => tags(s.useful_angles).includes(category)),
      questions: questions.filter((q) => tags(q.category).includes(category)),
    }));
}
export const storySections = [
  ["Summary", "short_summary"],
  ["Context", "context"],
  ["My Ownership", "my_ownership"],
  ["Important Actions", "important_actions"],
  ["Technical Details", "technical_details"],
  ["Challenges", "challenges"],
  ["Impact", "impact"],
  ["Learnings", "learnings"],
  ["Useful Angles", "useful_angles"],
  ["Leadership Principles", "leadership_principles"],
  ["Notes", "notes"],
] as const;
export const questionSections = [
  ["Situation", "situation"],
  ["Task", "task"],
  ["Action", "action"],
  ["Result", "result"],
  ["Learnings", "learnings"],
  ["Full Response", "response"],
  ["Notes", "notes"],
  ["Category", "category"],
  ["Leadership Principles", "leadership_principles"],
] as const;

// Match principles independently of optional priority labels, without changing stored notes.
export function principleTags(value: unknown) {
  return [
    ...new Set(
      String(value || "")
        .split(/[;|]/)
        .map((t) => t.replace(/^\s*(primary|secondary)\s*:\s*/i, "").trim())
        .filter(Boolean),
    ),
  ];
}
