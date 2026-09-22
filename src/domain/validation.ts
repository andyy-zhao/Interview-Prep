import { attemptSchema } from "./attempts";
import { z } from "zod";
import configs from "./fields.json";
import type { Table } from "./types";
export function schemaFor(table: Table) {
  if (table === "leetcode_attempts") return attemptSchema;
  const shape: Record<string, z.ZodTypeAny> = { id: z.string().uuid() };
  const fields = configs[table as keyof typeof configs];
  if (!fields) throw new Error("This record is read-only.");
  for (const f of fields) {
    let s: z.ZodTypeAny;
    if (f.type === "checkbox") s = z.boolean();
    else if (f.type === "number")
      s = z
        .number()
        .int()
        .min(f.key === "confidence" ? 1 : 0)
        .max(f.key === "confidence" ? 5 : 100000);
    else if (f.type === "problem" || f.type === "story") s = z.string().uuid();
    else if (f.type === "date")
      s = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .refine(
          (v) =>
            !Number.isNaN(Date.parse(v)) &&
            new Date(v).toISOString().slice(0, 10) === v,
          "Invalid date",
        );
    else if (f.type === "time")
      s = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);
    else if (f.type === "datetime-local") s = z.string().datetime();
    else if (f.type === "tags") s = z.string().max(10000);
    else if ("options" in f && f.options)
      s = z.enum(f.options as [string, ...string[]]);
    else if (f.type === "url")
      s = z
        .string()
        .url()
        .refine((v) => v.startsWith("https://"), "Use an HTTPS URL");
    else s = z.string().max(100000);
    if ("required" in f && f.required) {
      if (f.type === "text") s = z.string().trim().min(1).max(500);
    } else s = s.nullable().optional();
    shape[f.key] = s;
  }
  const schema = z.object(shape);
  return table === "tasks"
    ? schema.refine((v) => String(v.end_time) > String(v.start_time), {
        message: "End time must be after start time.",
        path: ["end_time"],
      })
    : schema;
}
