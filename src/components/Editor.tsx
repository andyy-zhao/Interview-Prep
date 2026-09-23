import { TagPicker } from "./TagPicker";
import { storyStatuses, questionStatuses } from "../domain/stories";
import { useState, useRef, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import configs from "../domain/fields.json";
import { dateKey, type RecordData, type Table } from "../domain/types";
import { schemaFor } from "../domain/validation";
export type Field = {
  key: string;
  label: string;
  type: string;
  options?: string[] | null;
  required?: boolean | null;
};
export type EditSpec = {
  table: Table;
  record?: RecordData;
  defaults?: Partial<RecordData>;
  fieldKeys?: string[];
};
export function Editor({
  spec,
  problems,
  stories,
  configured,
  onSave,
  onDelete,
  onClose,
}: {
  spec: EditSpec;
  problems: RecordData[];
  stories: RecordData[];
  configured: boolean;
  onSave: (table: Table, data: RecordData) => Promise<void>;
  onDelete: (table: Table, id: string) => Promise<void>;
  onClose: () => void;
}) {
  const fields: Field[] = configs[spec.table as keyof typeof configs];
  const [value, setValue] = useState<RecordData>(() => {
    const initial: RecordData = { id: crypto.randomUUID() };
    for (const f of fields)
      initial[f.key] =
        f.type === "checkbox"
          ? f.key === "active"
          : f.type === "select"
            ? f.options?.[0] || ""
            : f.type === "number"
              ? f.key === "confidence"
                ? 3
                : 0
              : "";
    return {
      ...initial,
      scheduled_date: dateKey(),
      start_time: "08:00",
      end_time: "08:30",
      attempted_at: new Date().toISOString(),
      next_review_date:
        spec.table === "leetcode_problems" ? dateKey() : undefined,
      ...spec.defaults,
      ...spec.record,
    };
  });
  const [showExtraStoryFields, setShowExtraStoryFields] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [dirty, setDirty] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  function close() {
    if (!busy && (!dirty || window.confirm("Discard unsaved changes?")))
      onClose();
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setError("");
    setBusy(true);
    try {
      const cleaned: RecordData = { ...value };
      for (const f of fields) {
        if (cleaned[f.key] === "" && !f.required) cleaned[f.key] = null;
      }
      const parsed = schemaFor(spec.table).parse(cleaned) as RecordData;
      await onSave(spec.table, parsed);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save. Your input is still here.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="record-editor-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      className="editor"
    >
      <form onSubmit={save}>
        <div className="modal-heading">
          <div>
            <div className="eyebrow">{spec.table.replaceAll("_", " ")}</div>
            <h2 id="record-editor-title">
              {spec.table === "leetcode_attempts"
                ? "Record attempt"
                : spec.fieldKeys
                  ? "Edit " +
                    fields.find((f) => f.key === spec.fieldKeys?.[0])?.label
                  : spec.table === "behavioral_stories"
                    ? spec.record
                      ? "Edit story"
                      : "Capture a story"
                    : spec.table === "behavioral_questions"
                      ? spec.record
                        ? "Edit question"
                        : "Add question"
                      : spec.record
                        ? "Edit record"
                        : "Add record"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close editor"
            onClick={close}
            disabled={busy}
          >
            <X size={18} />
          </button>
        </div>
        {!configured && (
          <div className="notice">
            Preview only. Connect Supabase to save records.
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {spec.table === "behavioral_stories" && !spec.fieldKeys && (
          <div className="story-editor-options">
            <button
              type="button"
              aria-expanded={showExtraStoryFields}
              onClick={() => setShowExtraStoryFields(!showExtraStoryFields)}
            >
              {showExtraStoryFields
                ? "Hide optional fields"
                : "More details & tags"}
            </button>
          </div>
        )}
        {spec.table === 'tasks' && <div className="story-editor-options"><label className="check-label"><input type="checkbox" checked={!value.start_time && !value.end_time} disabled={busy} onChange={e=>{setDirty(true);setValue({...value,start_time:e.target.checked?null:'08:00',end_time:e.target.checked?null:'08:30'});}} />Untimed — do this anytime that day</label></div>}
        <div className="form-fields">
          {fields
            .filter(
              (f) =>
                f.key !== "review_stage" &&
                !(spec.table === "tasks" && !value.start_time && !value.end_time && ["start_time","end_time"].includes(f.key)) &&
                (!spec.fieldKeys || spec.fieldKeys.includes(f.key)) &&
                (spec.table !== "behavioral_stories" ||
                  spec.fieldKeys ||
                  showExtraStoryFields ||
                  ![
                    "technical_details",
                    "challenges",
                    "useful_angles",
                    "leadership_principles",
                    "confidence",
                    "project_name",
                  ].includes(f.key)),
            )
            .map((f) => {
              const raw = value[f.key];
              const common = {
                id: f.key,
                name: f.key,
                required: !!f.required,
                disabled: busy,
                onChange: (
                  e: React.ChangeEvent<
                    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                  >,
                ) => {
                  setDirty(true);
                  setValue({
                    ...value,
                    [f.key]:
                      f.type === "checkbox"
                        ? (e.target as HTMLInputElement).checked
                        : f.type === "number"
                          ? e.target.value === ""
                            ? ""
                            : Number(e.target.value)
                          : f.type === "datetime-local"
                            ? e.target.value
                              ? new Date(e.target.value).toISOString()
                              : ""
                            : e.target.value,
                  });
                },
              };
              const display =
                f.type === "datetime-local" && raw
                  ? new Date(
                      new Date(String(raw)).getTime() -
                        new Date(String(raw)).getTimezoneOffset() * 60000,
                    )
                      .toISOString()
                      .slice(0, 16)
                  : f.type === "time"
                    ? String(raw || "").slice(0, 5)
                    : String(raw ?? "");
              const Wrapper = f.type === "tags" ? "div" : "label";
              return (
                <Wrapper
                  key={f.key}
                  className={
                    f.type === "textarea" || f.type === "tags"
                      ? "full"
                      : f.type === "checkbox"
                        ? "check-label"
                        : ""
                  }
                  htmlFor={f.key}
                >
                  {f.label}
                  {f.required && <span className="required"> *</span>}
                  {f.type === "tags" ? (
                    <TagPicker
                      label={f.label}
                      value={display}
                      options={f.options || []}
                      separator={f.key === "leadership_principles" ? ";" : ","}
                      disabled={busy}
                      onChange={(v) => {
                        setDirty(true);
                        setValue({ ...value, [f.key]: v });
                      }}
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      {...common}
                      value={display}
                      rows={
                        ["action", "important_actions", "response"].includes(
                          f.key,
                        )
                          ? 10
                          : f.key === "notes"
                            ? 4
                            : 3
                      }
                    />
                  ) : f.type === "select" ||
                    f.type === "problem" ||
                    f.type === "story" ? (
                    <select {...common} value={display}>
                      {(!f.required || f.type === "problem") && (
                        <option value="">
                          {f.type === "story"
                            ? "No linked story"
                            : f.type === "problem"
                              ? "No linked problem"
                              : "Select…"}
                        </option>
                      )}
                      {(f.type === "story"
                        ? stories.map((p) => [p.id, String(p.title)])
                        : f.type === "problem"
                          ? problems.map((p) => [p.id, String(p.title)])
                          : f.options?.map((o) => [o, o]) || []
                      ).map(([v, l]) => (
                        <option value={v} key={v}>
                          {spec.table === "behavioral_stories" &&
                          f.key === "status"
                            ? storyStatuses[l]
                            : spec.table === "behavioral_questions" &&
                                f.key === "status"
                              ? questionStatuses[l]
                              : l}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "checkbox" ? (
                    <input {...common} type="checkbox" checked={Boolean(raw)} />
                  ) : (
                    <input
                      {...common}
                      type={f.type}
                      value={display}
                      min={
                        f.key === "confidence"
                          ? 1
                          : f.type === "number"
                            ? 0
                            : undefined
                      }
                      max={f.key === "confidence" ? 5 : undefined}
                    />
                  )}
                </Wrapper>
              );
            })}
        </div>
        {confirm && (
          <div className="delete-confirm" role="alert">
            <strong>Delete this record?</strong>
            <p>
              {spec.table === "leetcode_problems"
                ? "Its attempts and reviews will also be deleted. Scheduled tasks will remain, without the problem link."
                : "This cannot be undone."}
            </p>
            <button
              type="button"
              disabled={busy}
              className="danger"
              onClick={async () => {
                setBusy(true);
                try {
                  await onDelete(spec.table, value.id);
                  onClose();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Delete permanently
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Keep record
            </button>
          </div>
        )}
        <div className="modal-actions">
          {spec.record && !spec.fieldKeys && (
            <button
              type="button"
              className="danger-text"
              disabled={!configured || busy}
              onClick={() => setConfirm(true)}
            >
              <Trash2 size={15} /> Delete
            </button>
          )}
          <div className="spacer" />
          <button type="button" onClick={close} disabled={busy}>
            Cancel
          </button>
          <button className="primary" disabled={!configured || busy}>
            {busy
              ? "Saving…"
              : "Save " +
                (spec.table === "leetcode_attempts"
                  ? "attempt"
                  : spec.table === "behavioral_stories"
                    ? spec.fieldKeys
                      ? "section"
                      : "story"
                    : spec.table === "behavioral_questions"
                      ? spec.fieldKeys
                        ? "section"
                        : "question"
                      : "record")}
          </button>
        </div>
      </form>
    </dialog>
  );
}
