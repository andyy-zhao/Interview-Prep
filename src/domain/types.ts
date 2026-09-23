export const tables = [
  "tasks",
  "leetcode_problems",
  "leetcode_attempts",
  "leetcode_reviews",
  "system_design_topics",
  "system_design_exercises",
  "behavioral_stories",
  "behavioral_questions",
  "achievers_projects",
] as const;
export type Table = (typeof tables)[number];
export type RecordData = {
  id: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: string | number | boolean | null | undefined;
};
export type Store = Record<Table, RecordData[]>;
export const categories = [
  "LeetCode",
  "System Design",
  "Behavioral",
  "Achievers",
  "Other",
];
export const mastery = ["RED", "ORANGE", "YELLOW", "GREEN"];
export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function addDays(date: string, n: number) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
export function monday(date: string) {
  const d = new Date(date + "T12:00:00");
  return addDays(date, -((d.getDay() + 6) % 7));
}
export function minutes(task: RecordData) {
  if (!task.start_time || !task.end_time) return 0;
  const parse = (s: unknown) =>
    String(s || "00:00")
      .split(":")
      .slice(0, 2)
      .reduce((a, v) => a * 60 + Number(v), 0);
  return Math.max(0, parse(task.end_time) - parse(task.start_time));
}
export function nextReview(date: string, stage: number) {
  return addDays(date, [1, 2, 4, 7, 14][Math.min(stage, 4)]);
}

export function taskTime(task: RecordData) {
 return task.start_time && task.end_time ? `${String(task.start_time).slice(0,5)} – ${String(task.end_time).slice(0,5)}` : 'Untimed';
}
export function compareTaskTimes(a: RecordData, b: RecordData) {
 return Number(!a.start_time) - Number(!b.start_time) || String(a.start_time || '').localeCompare(String(b.start_time || '')) || String(a.title || '').localeCompare(String(b.title || '')) || a.id.localeCompare(b.id);
}
