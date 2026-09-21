import { useState, useEffect, useRef } from "react";
import { X, ArrowUpRight, Search } from "lucide-react";
import { api } from "../data/api";
import { dateKey, type RecordData } from "../domain/types";
import {
  Heading,
  AddButton,
  Empty,
  Stats,
  type PageProps,
} from "../components/shared";
const meanings = {
  RED: "Cannot identify the pattern",
  ORANGE: "Understand after help",
  YELLOW: "Can reproduce the solution",
  GREEN: "Derive, explain & modify",
};
export default function Library(props: PageProps) {
  const { data, edit, mutate, configured, busy } = props;
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const all = data.leetcode_problems;
  const due = (p: RecordData) =>
    !!p.active &&
    !!p.next_review_date &&
    String(p.next_review_date) <= dateKey();
  const problems = all.filter((p) =>
    Object.entries(filters).every(
      ([k, v]) =>
        !v ||
        (k === "search"
          ? String(p.title).toLowerCase().includes(v.toLowerCase())
          : k === "review"
            ? v === "due"
              ? due(p)
              : v === "inactive"
                ? !p.active
                : p.active
            : k === "topics"
              ? String(p.topics || "")
                  .split(",")
                  .map((x) => x.trim())
                  .includes(v)
              : p[k] === v),
    ),
  );
  const selectedProblem = all.find((p) => p.id === selected);
  return (
    <>
      <Heading
        eyebrow="PATTERNS, NOT MEMORIZATION"
        title="Your problem library"
        description="Build understanding that holds up when the problem changes."
        action={
          <AddButton onClick={() => edit({ table: "leetcode_problems" })}>
            Add problem
          </AddButton>
        }
      />
      <Stats
        items={[
          {
            label: "Active problems",
            value: all.filter((p) => p.active).length,
            note: "Your current learning set",
          },
          {
            label: "Mastered",
            value: all.filter((p) => p.mastery === "GREEN").length,
            note: "Confident from first principles",
          },
          {
            label: "Reviews due",
            value: all.filter(due).length,
            note: "Including overdue reviews",
          },
        ]}
      />
      <div className="mastery-legend">
        {Object.entries(meanings).map(([k, v]) => (
          <span key={k}>
            <i className={"mastery-dot " + k} />
            {v}
          </span>
        ))}
      </div>
      <div className="filters">
        <label className="search">
          <Search size={15} />
          <input
            aria-label="Search problems"
            placeholder="Find a problem…"
            value={filters.search || ""}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </label>
        {[
          ["difficulty", "Difficulty", ["Easy", "Medium", "Hard"]],
          [
            "topics",
            "Topic",
            [
              ...new Set(
                all.flatMap((p) =>
                  String(p.topics || "")
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                ),
              ),
            ],
          ],
          [
            "pattern",
            "Pattern",
            [
              ...new Set(
                all.map((p) => String(p.pattern || "")).filter(Boolean),
              ),
            ],
          ],
          ["mastery", "Mastery", Object.keys(meanings)],
          ["review", "Review status", ["due", "active", "inactive"]],
        ].map(([key, label, options]) => (
          <select
            key={String(key)}
            aria-label={String(label)}
            value={filters[String(key)] || ""}
            onChange={(e) =>
              setFilters({ ...filters, [String(key)]: e.target.value })
            }
          >
            <option value="">
              {key === "difficulty"
                ? "All difficulties"
                : key === "mastery"
                  ? "All mastery levels"
                  : key === "review"
                    ? "All review statuses"
                    : "All " + String(label).toLowerCase() + "s"}
            </option>
            {(options as string[]).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ))}
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({})}>Clear</button>
        )}
      </div>
      {!problems.length ? (
        <Empty
          title={
            all.length ? "No matching problems" : "Your practice starts here"
          }
          description={
            all.length
              ? "Try a different filter."
              : "Add a permanent problem record, then track attempts and reviews."
          }
          action={
            <AddButton onClick={() => edit({ table: "leetcode_problems" })}>
              Add problem
            </AddButton>
          }
        />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Problem</th>
                <th>Difficulty</th>
                <th>Pattern</th>
                <th>Mastery</th>
                <th>Next review</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => (
                <tr key={p.id}>
                  <td>
                    <button
                      className="text-button problem-name"
                      onClick={() => setSelected(p.id)}
                    >
                      {p.title}
                      <small>
                        {p.topics}
                        {!p.active ? " · Inactive" : ""}
                      </small>
                    </button>
                  </td>
                  <td>
                    <span className={"difficulty " + p.difficulty}>
                      {p.difficulty}
                    </span>
                  </td>
                  <td>{p.pattern || "—"}</td>
                  <td>
                    <span className="mastery-label">
                      <i className={"mastery-dot " + p.mastery} />
                      {p.mastery}
                    </span>
                  </td>
                  <td className={due(p) ? "due" : ""}>
                    {p.next_review_date || "Unscheduled"}
                    {due(p) && <small>Due for review</small>}
                  </td>
                  <td>
                    <button
                      className="small-button"
                      onClick={() =>
                        edit({
                          table: "leetcode_attempts",
                          defaults: {
                            problem_id: p.id,
                            mastery_after: p.mastery,
                          },
                        })
                      }
                    >
                      Record attempt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedProblem && (
        <ProblemDetail
          problem={selectedProblem}
          props={props}
          onClose={() => setSelected(null)}
          onQuick={(action) =>
            mutate(
              () => api.quick(selectedProblem.id, action),
              "Problem updated",
            )
          }
          disabled={!configured || busy}
        />
      )}
    </>
  );
}
function ProblemDetail({
  problem: p,
  props,
  onClose,
  onQuick,
  disabled,
}: {
  problem: RecordData;
  props: PageProps;
  onClose: () => void;
  onQuick: (action: string) => Promise<void>;
  disabled: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="editor detail"
      aria-labelledby="problem-detail-title"
      onCancel={onClose}
    >
      <div className="modal-heading">
        <div>
          <div className="eyebrow">{p.pattern || "PROBLEM DETAILS"}</div>
          <h2 id="problem-detail-title">{p.title}</h2>
        </div>
        <button aria-label="Close details" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="detail-body">
        <div className="button-group">
          <button
            onClick={() => {
              onClose();
              props.edit({ table: "leetcode_problems", record: p });
            }}
          >
            Edit problem
          </button>
          <button
            className="primary"
            onClick={() => {
              onClose();
              props.edit({
                table: "leetcode_attempts",
                defaults: { problem_id: p.id, mastery_after: p.mastery },
              });
            }}
          >
            Record attempt
          </button>
          {p.url && String(p.url).startsWith("https://") && (
            <a
              href={String(p.url)}
              target="_blank"
              rel="noreferrer"
              className="external-link"
            >
              Open LeetCode <ArrowUpRight size={14} />
            </a>
          )}
        </div>
        <p className="preserve">
          {p.notes ||
            "No notes yet. Capture the key insight after your next attempt."}
        </p>
        <div className="quick-actions">
          {[
            ["easy", "Too Easy", "Archive from active learning"],
            ["stuck", "Got Stuck", "Reset and review today"],
            ["later", "Review Later", "Move review to tomorrow"],
            ["mastered", "Mark Mastered", "GREEN; review in 14 days"],
          ].map(([key, label, help]) => (
            <button
              key={key}
              disabled={disabled}
              onClick={() => void onQuick(key)}
            >
              {label}
              <small>{help}</small>
            </button>
          ))}
        </div>
        <h3>Attempt history</h3>
        {!props.data.leetcode_attempts.some((a) => a.problem_id === p.id) && (
          <p>No attempts recorded yet.</p>
        )}
        {props.data.leetcode_attempts
          .filter((a) => a.problem_id === p.id)
          .sort((a, b) =>
            String(b.attempted_at).localeCompare(String(a.attempted_at)),
          )
          .map((a) => (
            <div className="history-row" key={a.id}>
              <strong>
                {a.solved ? "Solved" : "Not solved"} · {a.time_spent} min ·{" "}
                {a.hints_used || 0} hints
              </strong>
              <span>
                <i className={"mastery-dot " + a.mastery_after} />{" "}
                {a.mastery_after}
              </span>
              <small>
                {new Date(String(a.attempted_at)).toLocaleString()} · Felt{" "}
                {a.perceived_difficulty || "unrated"}
              </small>
              <p className="preserve">{a.notes}</p>
              <button
                className="small-button"
                onClick={() => {
                  onClose();
                  props.edit({ table: "leetcode_attempts", record: a });
                }}
              >
                View full result
              </button>
            </div>
          ))}
        <h3>Review history</h3>
        {!props.data.leetcode_reviews.some((r) => r.problem_id === p.id) && (
          <p>No completed reviews yet.</p>
        )}
        {props.data.leetcode_reviews
          .filter((r) => r.problem_id === p.id)
          .sort((a, b) =>
            String(b.reviewed_at).localeCompare(String(a.reviewed_at)),
          )
          .map((r) => (
            <div className="history-row" key={r.id}>
              <strong>
                {new Date(String(r.reviewed_at)).toLocaleDateString()}
              </strong>
              <small>
                Scheduled: {r.scheduled_for || "Initial practice"} → Next:{" "}
                {r.next_review_date}
              </small>
            </div>
          ))}
      </div>
    </dialog>
  );
}
