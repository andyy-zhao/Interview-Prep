import { z } from "zod";
import { addDays, dateKey, nextReview, type RecordData } from "./types";
export const complexityFields = [
  ["time_complexity", "Time complexity"],
  ["space_complexity", "Space complexity"],
  ["average_case_complexity", "Average-case complexity"],
  ["worst_case_complexity", "Worst-case complexity"],
  ["complexity_explanation", "Complexity explanation"],
] as const;
export const attemptSchema = z
  .object({
    id: z.string().uuid(),
    problem_id: z.string().uuid(),
    task_id: z.string().uuid().nullable().optional(),
    attempted_at: z.string().datetime(),
    solved: z.boolean(),
    time_spent: z.number().int().min(0).max(100000),
    hints_used: z.number().int().min(0).max(100000),
    perceived_difficulty: z.enum(["Easy", "Medium", "Hard"]),
    mastery_after: z.enum(["RED", "ORANGE", "YELLOW", "GREEN"]),
    notes: z.string().max(100000).nullable().optional(),
    time_complexity: z.string().max(1000).nullable().optional(),
    space_complexity: z.string().max(1000).nullable().optional(),
    average_case_complexity: z.string().max(1000).nullable().optional(),
    worst_case_complexity: z.string().max(1000).nullable().optional(),
    complexity_explanation: z.string().max(100000).nullable().optional(),
    review_action: z
      .enum(["normal", "easy", "stuck", "later", "mastered"])
      .default("normal"),
    next_review_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (v) =>
          !Number.isNaN(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v,
        "Invalid review date",
      )
      .nullable()
      .optional(),
  })
  .superRefine((a, ctx) => {
    if (
      (a.review_action === "easy" || a.review_action === "mastered") &&
      a.mastery_after !== "GREEN"
    )
      ctx.addIssue({
        code: "custom",
        path: ["mastery_after"],
        message: "This action requires GREEN mastery.",
      });
    if (a.review_action === "stuck" && a.mastery_after !== "RED")
      ctx.addIssue({
        code: "custom",
        path: ["mastery_after"],
        message: "Got Stuck requires RED mastery.",
      });
    if (a.review_action === "easy" && a.next_review_date)
      ctx.addIssue({
        code: "custom",
        path: ["next_review_date"],
        message: "Too Easy removes this problem from active reviews.",
      });
  });
export type AttemptInput = z.infer<typeof attemptSchema>;
export type AttemptRecord = AttemptInput & { created_at?: string };
export function suggestedReview(
  problem: RecordData,
  mastery: string,
  action: AttemptInput["review_action"],
  today = dateKey(),
) {
  if (action === "easy") return null;
  if (action === "stuck") return today;
  if (action === "later") return addDays(today, 1);
  if (action === "mastered") return addDays(today, 14);
  return nextReview(
    today,
    ["RED", "ORANGE"].includes(mastery) ? 0 : Number(problem.review_stage || 0),
  );
}
export function sessionAttempt(attempts: RecordData[], task: RecordData) {
  return attempts.find((a) => a.task_id === task.id);
}
