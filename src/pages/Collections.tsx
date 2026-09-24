import { useSearchParams } from "react-router-dom";
import SystemDesignFramework from "../components/SystemDesignFramework";
import { useState } from "react";
import {
  BookOpen,
  Layers,
  MessageSquare,
  Briefcase,
  ArrowUpRight,
} from "lucide-react";
import type { Table } from "../domain/types";
import {
  Heading,
  AddButton,
  Empty,
  type PageProps,
} from "../components/shared";
export default function Collections({
  kind,
  ...props
}: PageProps & { kind: "system" | "behavioral" | "achievers" }) {
  const [params, setParams] = useSearchParams();
  const tab = kind === "system" && ["exercises", "framework"].includes(params.get("tab") || "") ? params.get("tab") : "topics";
  const setTab = (value:string) => { const next = new URLSearchParams(params); next.set("tab",value); setParams(next); };
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState("");
  const table: Table =
    kind === "system"
      ? tab === "topics"
        ? "system_design_topics"
        : "system_design_exercises"
      : kind === "behavioral"
        ? "behavioral_stories"
        : "achievers_projects";
  const title =
    kind === "system"
      ? "Think in systems"
      : kind === "behavioral"
        ? "Stories worth telling"
        : "Know your own work";
  const description =
    kind === "system"
      ? "Connect the fundamentals. Practice the tradeoffs."
      : kind === "behavioral"
        ? "Turn real experiences into clear, confident STAR stories."
        : "Build a detailed understanding of your impact at Achievers.";
  const records = props.data[table];
  const themes = [
    ...new Set(
      records.flatMap((r) =>
        String(r.themes || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    ),
  ];
  const visible = records.filter(
    (r) =>
      String(r.title).toLowerCase().includes(search.toLowerCase()) &&
      (!theme ||
        String(r.themes || "")
          .split(",")
          .map((t) => t.trim())
          .includes(theme)),
  );
  const add = () => props.edit({ table });
  return (
    <>
      <Heading
        eyebrow={
          kind === "system"
            ? "SYSTEM DESIGN"
            : kind === "behavioral"
              ? "BEHAVIORAL INTERVIEWS"
              : "YOUR EXPERIENCE · ACHIEVERS"
        }
        title={title}
        description={description}
        action={
          kind === "system" && tab === "framework" ? undefined : <AddButton onClick={add}>
            Add{" "}
            {kind === "system"
              ? tab === "topics"
                ? "topic"
                : "exercise"
              : kind === "behavioral"
                ? "story"
                : "project"}
          </AddButton>
        }
      />
      {kind === "system" && (
        <div className="tabs" role="tablist" aria-label="System design records">
          <button
            role="tab"
            aria-selected={tab === "topics"}
            className={tab === "topics" ? "selected" : ""}
            onClick={() => {
              setTab("topics");
              setSearch("");
            }}
          >
            <BookOpen size={16} /> Topics{" "}
            <span>{props.data.system_design_topics.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === "exercises"}
            className={tab === "exercises" ? "selected" : ""}
            onClick={() => {
              setTab("exercises");
              setSearch("");
            }}
          >
            <Layers size={16} /> Exercises{" "}
            <span>{props.data.system_design_exercises.length}</span>
          </button>
          <button role="tab" aria-selected={tab === "framework"} className={tab === "framework" ? "selected" : ""} onClick={()=>setTab("framework")}><BookOpen size={16}/> Framework</button>
        </div>
      )}
      {kind === "system" && tab === "framework" ? <SystemDesignFramework /> : <>
      <div className="filters">
        <input
          className="standalone-search"
          aria-label="Search records"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {kind === "behavioral" && (
          <select
            aria-label="Filter by theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="">All themes</option>
            {themes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        )}
        <span className="record-count">
          {visible.length} {visible.length === 1 ? "record" : "records"}
        </span>
      </div>
      {!visible.length ? (
        <Empty
          title={
            records.length
              ? "No matching records"
              : kind === "system"
                ? tab === "topics"
                  ? "Start with the fundamentals"
                  : "Sketch your first system"
                : kind === "behavioral"
                  ? "Your experience has good stories"
                  : "Document the work you know best"
          }
          description={
            records.length
              ? "Try another search or theme."
              : kind === "system"
                ? "Try caching, load balancing, or a URL shortener design."
                : kind === "behavioral"
                  ? "Start with a moment of ownership, conflict, or learning. Refine it over time."
                  : "Capture the problem, your contribution, technical decisions, and measurable impact."
          }
          action={<AddButton onClick={add}>Add your first record</AddButton>}
        />
      ) : (
        <div className="record-grid">
          {visible.map((r) => (
            <button
              key={r.id}
              className="record-card"
              onClick={() => props.edit({ table, record: r })}
            >
              <div className="record-top">
                {kind === "system" ? (
                  <Layers size={20} />
                ) : kind === "behavioral" ? (
                  <MessageSquare size={20} />
                ) : (
                  <Briefcase size={20} />
                )}
                <span className="tag">
                  {r.status ||
                    (r.interview_ready ? "Interview-ready" : "In progress")}
                </span>
              </div>
              <h2>{r.title}</h2>
              <p>
                {String(
                  r.summary ||
                    r.situation ||
                    r.notes ||
                    "Add your notes and build on them after each session.",
                ).slice(0, 180)}
              </p>
              {r.themes && (
                <div className="theme-tags">
                  {String(r.themes)
                    .split(",")
                    .map((t) => (
                      <span key={t}>{t.trim()}</span>
                    ))}
                </div>
              )}
              <div className="record-bottom">
                <span>
                  Confidence <b>{r.confidence || "—"}</b> / 5
                </span>
                <ArrowUpRight size={16} />
              </div>
            </button>
          ))}
        </div>
      )}
      </>}
    </>
  );
}
