import "dotenv/config";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { schemaFor } from "../src/domain/validation";
const file = process.argv[2];
if (!file) throw new Error("Usage: npm run seed -- <tasks.json>");
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY)
  throw new Error("Configure .env first.");
const input: unknown = JSON.parse(await readFile(file, "utf8"));
if (!Array.isArray(input))
  throw new Error("Seed must be an array of task records.");
const tasks = input.map((row) => schemaFor("tasks").parse(row));
if (new Set(tasks.map((t) => t.id)).size !== tasks.length)
  throw new Error("Seed IDs must be unique.");
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);
const { error } = await db.from("tasks").upsert(tasks);
if (error) throw error;
console.log(`Saved ${tasks.length} tasks. Re-running the same IDs is safe.`);
