import { AttemptEditor } from "./components/AttemptEditor";
import { AttemptDetails } from "./components/AttemptDetails";
import { attemptSchema } from "./domain/attempts";
import { useState, useEffect, useCallback } from "react";
import { NavLink, Routes, Route, useLocation } from "react-router-dom";
import {
  Sun,
  CalendarDays,
  Code2,
  Layers,
  MessageSquare,
  Briefcase,
  ChartNoAxesCombined,
  CheckCheck,
  RefreshCw,
} from "lucide-react";
import { api } from "./data/api";
import { demo } from "./data/demo";
import {
  dateKey,
  type Store,
  type Table,
  type RecordData,
} from "./domain/types";
import { Editor, type EditSpec } from "./components/Editor";
import Today from "./pages/Today";
import Week from "./pages/Week";
import Library from "./pages/Library";
import Collections from "./pages/Collections";
import Progress from "./pages/Progress";
import { Empty } from "./components/shared";
const nav = [
  ["Today", Sun, "/"],
  ["Week", CalendarDays, "/week"],
  ["LeetCode", Code2, "/leetcode"],
  ["System Design", Layers, "/system-design"],
  ["Behavioral", MessageSquare, "/behavioral"],
  ["Achievers", Briefcase, "/achievers"],
  ["Progress", ChartNoAxesCombined, "/progress"],
] as const;
const empty = {
  tasks: [],
  leetcode_problems: [],
  leetcode_attempts: [],
  leetcode_reviews: [],
  system_design_topics: [],
  system_design_exercises: [],
  behavioral_stories: [],
  achievers_projects: [],
};
export default function App() {
  const [data, setData] = useState<Store>(empty);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [spec, setSpec] = useState<EditSpec | null>(null);
  const load = useCallback(async () => {
    const r = await api.load();
    setConfigured(r.configured);
    setData(r.configured ? r.data : demo);
  }, []);
  useEffect(() => {
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const refresh = async () => {
    setError("");
    setLoading(true);
    try {
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  const run = async (
    action: () => Promise<unknown>,
    message = "Saved to Supabase",
  ) => {
    setBusy(true);
    setError("");
    try {
      await action();
      try {
        await load();
      } catch {
        setError(
          "Saved successfully, but refreshing failed. Refresh before making further changes.",
        );
      }
      setToast(message);
    } finally {
      setBusy(false);
    }
  };
  const mutate = async (action: () => Promise<unknown>, message?: string) => {
    try {
      await run(action, message);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const save = (table: Table, row: RecordData) =>
    table === "leetcode_attempts"
      ? api.attempt(attemptSchema.parse(row))
      : api.save(table, row);
  const path = useLocation().pathname;
  const name = nav.find((n) => n[2] === path)?.[0] || "Not found";
  const props = { data, configured, busy, edit: setSpec, mutate, save };
  useEffect(() => {
    type Context = {
      registerTool: (
        tool: unknown,
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!context) return;
    const controller = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "read_today_plan",
          title: "Read today’s preparation plan",
          description:
            "Read today’s scheduled tasks and due reviews. Does not modify data.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: (input: unknown) => {
            if (
              !input ||
              typeof input !== "object" ||
              Object.keys(input).length
            )
              throw new Error("Expected an empty object.");
            return {
              preview: !configured,
              tasks: data.tasks.filter((t) => t.scheduled_date === dateKey()),
              reviews: data.leetcode_problems.filter(
                (p) =>
                  p.active &&
                  p.next_review_date &&
                  String(p.next_review_date) <= dateKey(),
              ),
            };
          },
        },
        { signal: controller.signal },
      ),
    ).catch(() => {});
    return () => controller.abort();
  }, [data, configured]);
  return (
    <div className="shell">
      <aside>
        <NavLink className="brand" to="/">
          <span>
            <CheckCheck size={22} />
          </span>
          prep<span className="brand-dot">.</span>
        </NavLink>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map(([label, Icon, url]) => (
            <NavLink
              title={label}
              aria-label={label}
              key={url}
              to={url}
              end={url === "/"}
            >
              <Icon size={18} />
              {label}
              {label === "Today" && (
                <small>
                  {
                    data.tasks.filter((t) => t.scheduled_date === dateKey())
                      .length
                  }
                </small>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-label">ONE DAY AT A TIME</div>
          <p>
            Build confidence.
            <br />
            Make it a habit.
          </p>
          <div className="profile">
            <span>AZ</span>
            <div>
              My preparation<small>Personal workspace</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-wrap">
        <header>
          <span>
            Workspace <span className="slash">/</span> <b>{name}</b>
          </span>
          <div className="header-status">
            <span className="status-dot">
              {loading
                ? "Connecting…"
                : configured
                  ? "Supabase connected"
                  : "Sample preview"}
            </span>
            <button
              aria-label="Refresh data"
              className="icon-button"
              onClick={() => void refresh()}
              disabled={busy || loading}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </header>
        <main>
          {!configured && !loading && !error && (
            <div className="notice">
              Sample preview · Connect Supabase to save your preparation. Sample
              data is not your actual schedule.
            </div>
          )}
          {error && (
            <div role="alert" className="error">
              {error} <button onClick={() => void refresh()}>Retry</button>
            </div>
          )}
          {loading ? (
            <div className="loading" role="status">
              Loading your preparation…
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Today {...props} />} />
              <Route path="/week" element={<Week {...props} />} />
              <Route path="/leetcode" element={<Library {...props} />} />
              <Route
                path="/system-design"
                element={<Collections key="system" kind="system" {...props} />}
              />
              <Route
                path="/behavioral"
                element={
                  <Collections key="behavioral" kind="behavioral" {...props} />
                }
              />
              <Route
                path="/achievers"
                element={
                  <Collections key="achievers" kind="achievers" {...props} />
                }
              />
              <Route path="/progress" element={<Progress {...props} />} />
              <Route
                path="*"
                element={
                  <Empty
                    title="Page not found"
                    description="Choose a section from your sidebar."
                  />
                }
              />
            </Routes>
          )}
          <footer>Progress is built in the small sessions.</footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCheck size={16} />
          {toast}
        </div>
      )}
      {spec?.table === "leetcode_attempts" ? (
        spec.record ? (
          <AttemptDetails
            attempt={spec.record}
            problem={data.leetcode_problems.find(
              (p) => p.id === spec.record?.problem_id,
            )}
            onClose={() => setSpec(null)}
          />
        ) : (
          <AttemptEditor
            key={String(spec.defaults?.task_id || spec.defaults?.problem_id)}
            problem={
              data.leetcode_problems.find(
                (p) => p.id === spec.defaults?.problem_id,
              )!
            }
            task={data.tasks.find((t) => t.id === spec.defaults?.task_id)}
            configured={configured}
            onClose={() => setSpec(null)}
            onSave={async (attempt) =>
              run(
                () => api.attempt(attempt),
                attempt.task_id
                  ? "Session recorded · task complete · review updated"
                  : "Attempt recorded · review updated",
              )
            }
          />
        )
      ) : (
        spec && (
          <Editor
            key={spec.record?.id || spec.table}
            spec={spec}
            problems={data.leetcode_problems}
            configured={configured}
            onClose={() => setSpec(null)}
            onSave={async (table, row) => run(() => save(table, row))}
            onDelete={async (table, id) =>
              run(() => api.remove(table, id), "Record deleted")
            }
          />
        )
      )}
    </div>
  );
}
