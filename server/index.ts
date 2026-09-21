import { attemptSchema } from "../src/domain/attempts";
import "dotenv/config";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { tables, dateKey, addDays, type Table } from "../src/domain/types";
import { schemaFor } from "../src/domain/validation";
import { z } from "zod";
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
// Loopback only. Reject cross-origin mutations and DNS rebinding. No public browser database grants.
app.use((req, res, next) => {
  const host = req.hostname;
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host))
    return res.status(403).json({ error: "Local access only." });
  const origin = req.headers.origin;
  if (origin && !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
    return res.status(403).json({ error: "Origin rejected." });
  if (req.headers["sec-fetch-site"] === "cross-site")
    return res.status(403).json({ error: "Cross-site access rejected." });
  next();
});
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const db =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
app.get("/api/data", async (_req, res) => {
  if (!db) return res.json({ configured: false });
  try {
    const entries = await Promise.all(
      tables.map(async (table) => {
        const rows = [];
        for (let from = 0; ; from += 1000) {
          const { data, error } = await db
            .from(table)
            .select("*")
            .order("created_at")
            .order("id")
            .range(from, from + 999);
          if (error) throw error;
          rows.push(...data);
          if (data.length < 1000) break;
        }
        return [table, rows];
      }),
    );
    res.json({ configured: true, data: Object.fromEntries(entries) });
  } catch (e) {
    res.status(503).json({
      error:
        "Could not load Supabase data. Check your connection and run the SQL migration. " +
        (e instanceof Error ? e.message : ""),
    });
  }
});
app.use("/api", (_req, res, next) => {
  if (!db)
    return res.status(503).json({
      error:
        "Connect Supabase in .env before saving. Preview changes are not persisted.",
    });
  next();
});
app.post("/api/attempt", async (req, res) => {
  try {
    const data = attemptSchema.parse(req.body);
    const { data: result, error } = await db!.rpc("record_attempt_session", {
      p_attempt: data,
      p_today: new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Toronto",
      }).format(new Date()),
    });
    if (error) throw error;
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ error: errorText(e) });
  }
});
app.post("/api/review/:id", async (req, res) => {
  try {
    z.string().uuid().parse(req.params.id);
    const { error } = await db!.rpc("record_practice", {
      p_problem_id: req.params.id,
      p_today: dateKey(),
    });
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: errorText(e) });
  }
});
app.post("/api/quick/:id", async (req, res) => {
  try {
    z.string().uuid().parse(req.params.id);
    const action = z
      .enum(["easy", "stuck", "later", "mastered"])
      .parse(req.body.action);
    const values =
      action === "easy"
        ? { active: false, mastery: "GREEN", next_review_date: null }
        : action === "stuck"
          ? {
              active: true,
              mastery: "RED",
              next_review_date: dateKey(),
              review_stage: 0,
            }
          : action === "later"
            ? { next_review_date: addDays(dateKey(), 1) }
            : { mastery: "GREEN", next_review_date: addDays(dateKey(), 14) };
    const { error } = await db!
      .from("leetcode_problems")
      .update(values)
      .eq("id", req.params.id)
      .select("id")
      .single();
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: errorText(e) });
  }
});
app.post("/api/:table", async (req, res) => {
  try {
    const table = z.enum(tables).parse(req.params.table);
    if (table === "leetcode_reviews" || table === "leetcode_attempts")
      throw new Error("Use the practice action to record history.");
    const data = schemaFor(table).parse(req.body);
    const { error } = await db!.from(table).upsert(data).select("id").single();
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: errorText(e) });
  }
});
app.delete("/api/:table/:id", async (req, res) => {
  try {
    const table = z.enum(tables).parse(req.params.table) as Table;
    if (["leetcode_attempts", "leetcode_reviews"].includes(table))
      throw new Error("Practice history is read-only.");
    z.string().uuid().parse(req.params.id);
    const { error } = await db!
      .from(table)
      .delete()
      .eq("id", req.params.id)
      .select("id")
      .single();
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: errorText(e) });
  }
});
function errorText(e: unknown) {
  return e instanceof z.ZodError
    ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    : e instanceof Error
      ? e.message
      : typeof e === "object" && e && "message" in e
        ? String(e.message)
        : "Database operation failed. Please try again.";
}
const port = Number(process.env.API_PORT || 3001);
app.listen(port, "127.0.0.1", () =>
  console.log(`Local API: http://127.0.0.1:${port}`),
);
