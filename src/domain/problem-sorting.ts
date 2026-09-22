import { dateKey, type RecordData } from "./types";

export const problemSorts = {
  review_priority: "Review priority",
  title: "Title · A–Z",
  difficulty: "Difficulty · easy first",
  mastery: "Mastery · weakest first",
  next_review: "Next review · earliest first",
  recently_attempted: "Recently attempted",
} as const;
export type ProblemSort = keyof typeof problemSorts;
const collator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});
const rank = (value: unknown, values: string[]) => {
  const index = values.indexOf(String(value));
  return index < 0 ? values.length : index;
};
const masteryRank = (p: RecordData) =>
  rank(p.mastery, ["RED", "ORANGE", "YELLOW", "GREEN"]);
const dateCompare = (a: unknown, b: unknown, descending = false) => {
  if (!a || !b) return Number(!a) - Number(!b);
  return String(a).localeCompare(String(b)) * (descending ? -1 : 1);
};

export function sortProblems(
  problems: RecordData[],
  sort: ProblemSort = "review_priority",
  today = dateKey(),
  attempts: RecordData[] = [],
): RecordData[] {
  const latest = new Map<string, string>();
  if (sort === "recently_attempted") {
    for (const attempt of attempts) {
      const id = String(attempt.problem_id);
      const time = String(attempt.attempted_at || "");
      if (time > (latest.get(id) || "")) latest.set(id, time);
    }
  }
  const priority = (p: RecordData) =>
    !p.active
      ? 2
      : p.next_review_date && String(p.next_review_date) <= today
        ? 0
        : 1;
  return [...problems].sort((a, b) => {
    let order = 0;
    switch (sort) {
      case "review_priority":
        order = priority(a) - priority(b);
        if (!order && priority(a) === 0)
          order = dateCompare(a.next_review_date, b.next_review_date);
        if (!order) order = masteryRank(a) - masteryRank(b);
        break;
      case "difficulty":
        order =
          rank(a.difficulty, ["Easy", "Medium", "Hard"]) -
          rank(b.difficulty, ["Easy", "Medium", "Hard"]);
        break;
      case "mastery":
        order = masteryRank(a) - masteryRank(b);
        break;
      case "next_review":
        order = dateCompare(a.next_review_date, b.next_review_date);
        break;
      case "recently_attempted":
        order = dateCompare(
          latest.get(a.id) || a.last_attempted_date,
          latest.get(b.id) || b.last_attempted_date,
          true,
        );
        break;
    }
    return (
      order ||
      collator.compare(String(a.title || ""), String(b.title || "")) ||
      a.id.localeCompare(b.id)
    );
  });
}
