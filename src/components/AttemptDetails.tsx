import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { complexityFields } from "../domain/attempts";
import type { RecordData } from "../domain/types";
export function AttemptDetails({
  attempt: a,
  problem,
  onClose,
}: {
  attempt: RecordData;
  problem?: RecordData;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="editor detail"
      aria-labelledby="attempt-detail-title"
      onCancel={onClose}
    >
      <div className="modal-heading">
        <div>
          <div className="eyebrow">
            {a.task_id ? "SCHEDULED SESSION RESULT" : "ATTEMPT RESULT"}
          </div>
          <h2 id="attempt-detail-title">
            {problem?.title || "Problem attempt"}
          </h2>
        </div>
        <button onClick={onClose} aria-label="Close attempt details">
          <X size={18} />
        </button>
      </div>
      <div className="detail-body">
        <p>{new Date(String(a.attempted_at)).toLocaleString()}</p>
        <div className="session-summary">
          {a.solved ? "Solved" : "Not solved"} · {a.time_spent} min ·{" "}
          {a.hints_used || 0} hints ·{" "}
          <span className="mastery-label">
            <i className={"mastery-dot " + a.mastery_after} />
            {a.mastery_after}
          </span>
        </div>
        <p>Perceived difficulty: {a.perceived_difficulty || "Not recorded"}</p>
        <h3>Reflection</h3>
        <p className="preserve">{a.notes || "No reflection recorded."}</p>
        <dl className="complexity-details">
          {complexityFields.map(([key, label]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd className="preserve">{a[key] || "Not recorded"}</dd>
            </div>
          ))}
        </dl>
        <h3>Review scheduled after this attempt</h3>
        <p>
          {a.next_review_date ||
            (a.review_action === "easy"
              ? "Inactive — no review scheduled"
              : "No review date captured for this older attempt.")}
        </p>
      </div>
    </dialog>
  );
}
