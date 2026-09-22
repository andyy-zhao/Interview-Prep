import { useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import {
  Heading,
  AddButton,
  Empty,
  type PageProps,
} from "../components/shared";
import {
  categoryMap,
  storyStatuses,
  questionStatuses,
  tags,
  storySections,
  questionSections,
} from "../domain/stories";
export default function Behavioral(
  props: PageProps & { view?: "questions" | "stories" | "coverage" },
) {
  const { data, edit, view = "questions" } = props;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const isStory = view === "stories";
  const records = isStory ? data.behavioral_stories : data.behavioral_questions;
  const statuses = isStory ? storyStatuses : questionStatuses;
  const table = isStory ? "behavioral_stories" : "behavioral_questions";
  const visible = records
    .filter(
      (r) =>
        (!status || r.status === status) &&
        [
          r.title,
          r.question_text,
          r.short_summary,
          r.category,
          r.company,
          r.useful_angles,
        ].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
    )
    .sort((a, b) =>
      String(b.updated_at || "").localeCompare(String(a.updated_at || "")),
    );
  return (
    <>
      <Heading
        eyebrow="BEHAVIORAL PREPARATION"
        title={
          isStory
            ? "Your story bank"
            : view === "coverage"
              ? "Preparation coverage"
              : "Questions & responses"
        }
        description={
          isStory
            ? "The facts, experiences, and context you can reuse."
            : view === "coverage"
              ? "A quick look at where you have material and where you need practice."
              : "What would you actually say if an interviewer asked you this?"
        }
        action={
          view === "coverage" ? undefined : (
            <AddButton onClick={() => edit({ table })}>
              Add {isStory ? "story" : "question"}
            </AddButton>
          )
        }
      />
      <nav className="tabs behavioral-tabs" aria-label="Behavioral sections">
        <NavLink end to="/behavioral">
          Questions & Responses
        </NavLink>
        <NavLink to="/behavioral/stories">Story Bank</NavLink>
        <NavLink to="/behavioral/coverage">Coverage</NavLink>
      </nav>
      {view === "coverage" ? (
        <div className="record-grid story-grid">
          {categoryMap(data.behavioral_stories, data.behavioral_questions).map(
            (m) => (
              <section className="story-section" key={m.category}>
                <h2>{m.category}</h2>
                <span
                  className={
                    !m.stories.length && !m.questions.length
                      ? "story-gap"
                      : "soft-tag"
                  }
                >
                  {m.questions.length
                    ? "Question prepared"
                    : m.stories.length
                      ? "Story available · draft a question"
                      : "Missing"}
                </span>
                <p>
                  {m.questions.length} questions · {m.stories.length} stories
                </p>
              </section>
            ),
          )}
        </div>
      ) : (
        <>
          <div className="filters">
            <input
              className="standalone-search"
              aria-label="Search behavioral records"
              placeholder={
                isStory ? "Search experiences…" : "Search questions…"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Preparation status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All stages</option>
              {Object.entries(statuses).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <span>
              {visible.length} {isStory ? "stories" : "questions"}
            </span>
          </div>
          {!visible.length ? (
            <Empty
              title={isStory ? "No stories found" : "No questions found"}
              description="Add a rough idea or adjust your search."
            />
          ) : (
            <div className="record-grid story-grid">
              {visible.map((r) => (
                <Link
                  className="record-card story-card"
                  key={r.id}
                  to={
                    "/behavioral/" +
                    (isStory ? "stories/" : "questions/") +
                    r.id
                  }
                >
                  <div className="record-top">
                    <span>{r.company || ""}</span>
                    <span className="soft-tag">
                      {statuses[String(r.status)]}
                    </span>
                  </div>
                  <h2>{isStory ? r.title : r.question_text}</h2>
                  {isStory ? (
                    <p>
                      {r.short_summary ||
                        "Capture the facts and context behind this experience."}
                    </p>
                  ) : (
                    <p>
                      Story:{" "}
                      {data.behavioral_stories.find(
                        (s) => s.id === r.linked_story_id,
                      )?.title || "Not linked yet"}
                    </p>
                  )}
                  <div className="theme-tags">
                    {tags(isStory ? r.useful_angles : r.category).map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  {r.leadership_principles && (
                    <div className="theme-tags story-lps">
                      {tags(r.leadership_principles, ";").map((t) => (
                        <span key={t}>LP · {t}</span>
                      ))}
                    </div>
                  )}
                  <div className="record-bottom">
                    {isStory ? "Open experience" : "Draft & practice response"}{" "}
                    ↗
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
export function BehavioralDetail(
  props: PageProps & { kind: "story" | "question" },
) {
  const { id } = useParams();
  const isStory = props.kind === "story";
  const table = isStory ? "behavioral_stories" : "behavioral_questions";
  const row = props.data[table].find((r) => r.id === id);
  const back = isStory ? "/behavioral/stories" : "/behavioral";
  if (!row)
    return (
      <Empty
        title="Record not found"
        description="It may have been deleted."
        action={<Link to={back}>Back to Behavioral</Link>}
      />
    );
  const linked = props.data.behavioral_stories.find(
    (s) => s.id === row.linked_story_id,
  );
  return (
    <>
      <Link className="external-link" to={back}>
        ← {isStory ? "Story Bank" : "Questions & Responses"}
      </Link>
      <Heading
        eyebrow={isStory ? "REUSABLE EXPERIENCE" : "INTERVIEW QUESTION"}
        title={String(isStory ? row.title : row.question_text)}
        description={[
          row.company,
          row.project_name,
          (isStory ? storyStatuses : questionStatuses)[String(row.status)],
        ]
          .filter(Boolean)
          .join(" · ")}
        action={
          <button onClick={() => props.edit({ table, record: row })}>
            Edit {props.kind}
          </button>
        }
      />
      <p className="story-help">
        {isStory
          ? "Keep rough facts and context here. Specific interview answers live in Questions & Responses."
          : "Shape this answer for this question. Linking a story does not copy or change either record."}
      </p>
      <div className="story-detail">
        {!isStory && (
          <section className="story-section">
            <div className="section-heading">
              <h2>Linked Story</h2>
              <button
                onClick={() =>
                  props.edit({
                    table,
                    record: row,
                    fieldKeys: ["linked_story_id"],
                  })
                }
              >
                Change linked story
              </button>
            </div>
            {linked ? (
              <Link
                className="external-link"
                to={"/behavioral/stories/" + linked.id}
              >
                {linked.title} ↗
              </Link>
            ) : (
              <p>No linked story. A standalone answer is fine.</p>
            )}
          </section>
        )}
        {(isStory ? storySections : questionSections).map(([label, key]) => (
          <section className="story-section" key={key}>
            <div className="section-heading">
              <h2>{label}</h2>
              <button
                onClick={() =>
                  props.edit({ table, record: row, fieldKeys: [key] })
                }
              >
                Edit {label.toLowerCase()}
              </button>
            </div>
            {["useful_angles", "leadership_principles"].includes(key) ? (
              <div className="theme-tags">
                {tags(
                  row[key],
                  key === "leadership_principles" ? ";" : ",",
                ).map((t) => (
                  <span key={t}>{t}</span>
                ))}
                {!row[key] && <p>No tags yet.</p>}
              </div>
            ) : (
              <p className="preserve">
                {row[key] ||
                  (key === "response"
                    ? "Draft the full answer you would say aloud."
                    : "Add notes when you’re ready.")}
              </p>
            )}
          </section>
        ))}
        {isStory && (
          <section className="story-section">
            <h2>Questions using this story</h2>
            {props.data.behavioral_questions
              .filter((q) => q.linked_story_id === row.id)
              .map((q) => (
                <p key={q.id}>
                  <Link
                    className="external-link"
                    to={"/behavioral/questions/" + q.id}
                  >
                    {q.question_text} ↗
                  </Link>
                </p>
              ))}
            {!props.data.behavioral_questions.some(
              (q) => q.linked_story_id === row.id,
            ) && <p>No questions linked yet.</p>}
            <button
              onClick={() =>
                props.edit({
                  table: "behavioral_questions",
                  defaults: { linked_story_id: row.id },
                })
              }
            >
              Draft a question using this story
            </button>
          </section>
        )}
      </div>
    </>
  );
}
