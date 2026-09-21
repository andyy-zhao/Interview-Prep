import { useEffect, useRef, useState } from "react";
import { X, ArrowUpRight } from "lucide-react";
import {
  attemptSchema,
  complexityFields,
  suggestedReview,
  type AttemptInput,
} from "../domain/attempts";
import { dateKey, type RecordData } from "../domain/types";
export function AttemptEditor({
  problem,
  task,
  configured,
  onSave,
  onClose,
}: {
  problem: RecordData;
  task?: RecordData;
  configured: boolean;
  onSave: (attempt: AttemptInput) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState<AttemptInput>(() => ({
    id: crypto.randomUUID(),
    problem_id: problem.id,
    task_id: task?.id || null,
    attempted_at: new Date().toISOString(),
    solved: false,
    time_spent: 0,
    hints_used: 0,
    perceived_difficulty: "Medium",
    mastery_after: (problem.mastery as AttemptInput["mastery_after"]) || "RED",
    review_action: "normal",
    notes: "",
    next_review_date: suggestedReview(
      problem,
      String(problem.mastery || "RED"),
      "normal",
    ),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const submitting = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  function close() {
    if (
      !submitting.current &&
      (!dirty || window.confirm("Discard unsaved session result?"))
    )
      onClose();
  }
  function change(patch: Partial<AttemptInput>) {
    setDirty(true);
    setValue((v) => ({ ...v, ...patch }));
  }
  function quick(action: AttemptInput["review_action"]) {
    const mastery =
      action === "easy" || action === "mastered"
        ? "GREEN"
        : action === "stuck"
          ? "RED"
          : value.mastery_after;
    change({
      review_action: action,
      mastery_after: mastery,
      next_review_date: suggestedReview(problem, mastery, action),
    });
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await onSave(attemptSchema.parse(value));
      onClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save. Your result is still here.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="editor"
      aria-labelledby="session-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <form onSubmit={submit}>
        <div className="modal-heading">
          <div>
            <div className="eyebrow">
              {task ? "FINISH SCHEDULED SESSION" : "RECORD ATTEMPT"}
            </div>
            <h2 id="session-title">{problem.title}</h2>
            {task && (
              <p>
                {task.scheduled_date} · {String(task.start_time).slice(0, 5)}–
                {String(task.end_time).slice(0, 5)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Close session"
          >
            <X size={18} />
          </button>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {!configured && (
          <div className="notice">Connect Supabase to save your result.</div>
        )}
        <fieldset disabled={busy} className="session-fields">
          <div className="session-intro">
            <p>
              {task
                ? "Saving records your attempt, schedules the review, and completes this task."
                : "Record spontaneous practice without changing your scheduled tasks."}
            </p>
            {String(problem.url || "").startsWith("https://") && (
              <a
                href={String(problem.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link"
              >
                Open problem <ArrowUpRight size={14} />
              </a>
            )}
          </div>
          <div className="form-fields">
            <label>
              Result
              <select
                value={value.solved ? "solved" : "not-solved"}
                onChange={(e) =>
                  change({ solved: e.target.value === "solved" })
                }
              >
                <option value="not-solved">Not solved</option>
                <option value="solved">Solved</option>
              </select>
            </label>
            <label>
              Mastery after attempt
              <select
                value={value.mastery_after}
                onChange={(e) => {
                  const mastery = e.target
                    .value as AttemptInput["mastery_after"];
                  change({
                    mastery_after: mastery,
                    review_action: "normal",
                    next_review_date: suggestedReview(
                      problem,
                      mastery,
                      "normal",
                    ),
                  });
                }}
              >
                {[
                  ["RED", "RED — Cannot identify the pattern"],
                  ["ORANGE", "ORANGE — Understand after help"],
                  ["YELLOW", "YELLOW — Can reproduce"],
                  ["GREEN", "GREEN — Derive, explain and adapt"],
                ].map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Time spent (minutes)
              <input
                type="number"
                min="0"
                max="100000"
                required
                value={Number.isNaN(value.time_spent) ? "" : value.time_spent}
                onChange={(e) => change({ time_spent: e.target.valueAsNumber })}
              />
            </label>
            <label>
              Hints used
              <input
                type="number"
                min="0"
                max="100000"
                required
                value={Number.isNaN(value.hints_used) ? "" : value.hints_used}
                onChange={(e) => change({ hints_used: e.target.valueAsNumber })}
              />
            </label>
            <label>
              Perceived difficulty
              <select
                value={value.perceived_difficulty}
                onChange={(e) =>
                  change({
                    perceived_difficulty: e.target
                      .value as AttemptInput["perceived_difficulty"],
                  })
                }
              >
                {["Easy", "Medium", "Hard"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              Attempt time
              <input
                type="datetime-local"
                required
                value={new Date(
                  new Date(value.attempted_at).getTime() -
                    new Date(value.attempted_at).getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16)}
                onChange={(e) => {
                  if (e.target.value)
                    change({
                      attempted_at: new Date(e.target.value).toISOString(),
                    });
                }}
              />
            </label>
            <label className="full">
              Notes / reflection
              <textarea
                rows={3}
                value={value.notes || ""}
                onChange={(e) => change({ notes: e.target.value })}
                placeholder="What worked? Where did you need help? What will you try next time?"
              />
            </label>
            {complexityFields.map(([key, label]) => (
              <label
                key={key}
                className={key === "complexity_explanation" ? "full" : ""}
              >
                {label}
                {key === "complexity_explanation" ? (
                  <textarea
                    rows={2}
                    value={value[key] || ""}
                    onChange={(e) => change({ [key]: e.target.value })}
                    placeholder="Explain the operations, assumptions, and auxiliary space."
                  />
                ) : (
                  <input
                    value={value[key] || ""}
                    onChange={(e) => change({ [key]: e.target.value })}
                    placeholder={
                      key === "space_complexity"
                        ? "e.g. O(n) auxiliary space"
                        : "e.g. O(n)"
                    }
                  />
                )}
              </label>
            ))}
          </div>
          <div className="review-controls">
            <h3>What happens next?</h3>
            <p>
              These choices apply when you save. Mastery is your assessment, not
              inferred from “Solved.”
            </p>
            <div className="quick-actions">
              {[
                ["easy", "Too Easy"],
                ["stuck", "Got Stuck"],
                ["later", "Review Later"],
                ["mastered", "Mark Mastered"],
              ].map(([a, l]) => (
                <button
                  type="button"
                  key={a}
                  aria-pressed={value.review_action === a}
                  onClick={() => quick(a as AttemptInput["review_action"])}
                >
                  {l}
                </button>
              ))}
            </div>
            {value.review_action !== "normal" && (
              <button
                type="button"
                className="text-button"
                onClick={() => quick("normal")}
              >
                Use normal review schedule
              </button>
            )}
            <label>
              Next review
              <input
                type="date"
                min={dateKey()}
                disabled={value.review_action === "easy"}
                required={value.review_action !== "easy"}
                value={value.next_review_date || ""}
                onChange={(e) => change({ next_review_date: e.target.value })}
              />
            </label>
            <p>
              {value.review_action === "easy"
                ? "This problem will leave the active learning queue. Its history stays intact."
                : "A review will appear on Today when it is due."}
            </p>
          </div>
        </fieldset>
        <div className="modal-actions">
          <button type="button" onClick={close} disabled={busy}>
            Cancel
          </button>
          <div className="spacer" />
          <button className="primary" disabled={!configured || busy}>
            {busy
              ? "Saving…"
              : task
                ? "Save result & complete task"
                : "Save attempt"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
