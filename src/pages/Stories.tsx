import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Heading,
  AddButton,
  Empty,
  type PageProps,
} from "../components/shared";
import {
  categoryMap,
  storyStatuses,
  tags,
  storySections,
} from "../domain/stories";
import type { RecordData } from "../domain/types";
function StoryTags({ story }: { story: RecordData }) {
  return (
    <>
      <div className="theme-tags">
        {tags(story.themes).map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="theme-tags story-lps">
        {tags(story.leadership_principles, ";").map((t) => (
          <span key={t}>LP · {t}</span>
        ))}
      </div>
    </>
  );
}
export default function Stories({ data, edit }: PageProps) {
  const [view, setView] = useState("stories");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const stories = data.behavioral_stories;
  const mapping = categoryMap(stories);
  const visible = stories
    .filter(
      (s) =>
        (!category || tags(s.themes).includes(category)) &&
        (!status || s.status === status) &&
        [s.title, s.short_summary, s.company, s.project_name].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
    )
    .sort(
      (a, b) =>
        String(b.updated_at || "").localeCompare(String(a.updated_at || "")) ||
        String(a.title).localeCompare(String(b.title)),
    );
  return (
    <>
      <Heading
        eyebrow="BEHAVIORAL · STAR PREP"
        title="Your story bank"
        description="Build 5–7 strong core stories. Refine them over time, and adapt the framing to each question."
        action={
          <AddButton onClick={() => edit({ table: "behavioral_stories" })}>
            Add story
          </AddButton>
        }
      />
      <div className="tabs">
        {[
          ["stories", "Story bank"],
          ["mapping", "Question mapping"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={view === id}
            className={view === id ? "selected" : ""}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "mapping" ? (
        <>
          <p className="story-help">
            {mapping.filter((m) => !m.stories.length).length} categories need a
            story. Each link opens the same core story.
          </p>
          <div className="record-grid story-grid">
            {mapping.map((m) => (
              <section className="story-section" key={m.category}>
                <h2>
                  {m.category} <small>({m.stories.length})</small>
                </h2>
                {m.stories.length ? (
                  <ul>
                    {m.stories.map((s) => (
                      <li key={s.id}>
                        <Link to={"/behavioral/" + s.id}>{s.title} ↗</Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <p className="story-gap">No story mapped yet</p>
                    <button
                      onClick={() =>
                        edit({
                          table: "behavioral_stories",
                          defaults: { themes: m.category },
                        })
                      }
                    >
                      Capture an idea
                    </button>
                  </>
                )}
              </section>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="filters">
            <input
              className="standalone-search"
              aria-label="Search stories"
              placeholder="Search stories or experience…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Question category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All question categories</option>
              {mapping.map((m) => (
                <option key={m.category}>{m.category}</option>
              ))}
            </select>
            <select
              aria-label="Story status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All stages</option>
              {Object.entries(storyStatuses).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <span>{visible.length} stories</span>
          </div>
          {!visible.length ? (
            <Empty
              title="No stories here yet"
              description="Start with a title and a few rough notes, or adjust your filters."
            />
          ) : (
            <div className="record-grid story-grid">
              {visible.map((s) => (
                <Link
                  className="record-card story-card"
                  key={s.id}
                  to={"/behavioral/" + s.id}
                >
                  <div className="record-top">
                    <span>{s.company || "Your experience"}</span>
                    <span className="soft-tag">
                      {storyStatuses[String(s.status)] || s.status}
                    </span>
                  </div>
                  <h2>{s.title}</h2>
                  <p>
                    {s.short_summary ||
                      s.situation ||
                      "A rough idea is enough. Add a reminder of what happened."}
                  </p>
                  <StoryTags story={s} />
                  <div className="record-bottom">Open story ↗</div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
export function StoryDetail(props: PageProps) {
  const { id } = useParams();
  const story = props.data.behavioral_stories.find((s) => s.id === id);
  if (!story)
    return (
      <Empty
        title="Story not found"
        description="It may have been deleted."
        action={<Link to="/behavioral">Back to story bank</Link>}
      />
    );
  return (
    <>
      <Link className="external-link" to="/behavioral">
        ← Story bank
      </Link>
      <Heading
        eyebrow="BEHAVIORAL · CORE STORY"
        title={String(story.title)}
        description={[
          story.company,
          story.project_name,
          storyStatuses[String(story.status)],
        ]
          .filter(Boolean)
          .join(" · ")}
        action={
          <button
            onClick={() =>
              props.edit({ table: "behavioral_stories", record: story })
            }
          >
            Edit story
          </button>
        }
      />
      <p className="story-help">
        Save each section as it develops. Rough notes are welcome; no section is
        required.
      </p>
      <div className="story-detail">
        {storySections.map(([label, key]) => (
          <section className="story-section" key={key}>
            <div className="section-heading">
              <h2>{label}</h2>
              <button
                onClick={() =>
                  props.edit({
                    table: "behavioral_stories",
                    record: story,
                    fieldKeys: [key],
                  })
                }
              >
                Edit {label.toLowerCase()}
              </button>
            </div>
            {key === "themes" || key === "leadership_principles" ? (
              <div className="theme-tags">
                {tags(story[key], key === "themes" ? "," : ";").map((t) => (
                  <span key={t}>{t}</span>
                ))}
                {!story[key] && <p>No tags yet.</p>}
              </div>
            ) : (
              <p className="preserve">
                {story[key] || "Add rough notes when you’re ready."}
              </p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
