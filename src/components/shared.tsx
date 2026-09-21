import { Check, Plus, Pencil, ArrowUpRight } from "lucide-react";
import {
  minutes,
  type RecordData,
  type Store,
  type Table,
} from "../domain/types";
import type { EditSpec } from "./Editor";
export type PageProps = {
  data: Store;
  configured: boolean;
  busy: boolean;
  edit: (spec: EditSpec) => void;
  mutate: (action: () => Promise<unknown>, message?: string) => Promise<void>;
  save: (table: Table, row: RecordData) => Promise<unknown>;
};
export function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>
          {title}
          <span>.</span>
        </h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function AddButton({
  onClick,
  children = "Add task",
}: {
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button className="primary" onClick={onClick}>
      <Plus size={16} />
      {children}
    </button>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Plus size={21} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function TaskRow({
  task,
  props,
}: {
  task: RecordData;
  props: PageProps;
}) {
  const problem = task.category === "LeetCode"
    ? props.data.leetcode_problems.find((p) => p.id === task.problem_id)
    : undefined;
  const problemUrl = typeof problem?.url === "string" && problem.url.startsWith("https://")
    ? problem.url
    : undefined;
  const tagClass = "tag " + String(task.category).toLowerCase().replaceAll(" ", "-");
  return (
    <div className="task">
      <button
        className={"checkbox " + (task.completed ? "checked" : "")}
        aria-label={(task.completed ? "Uncomplete " : "Complete ") + task.title}
        disabled={!props.configured || props.busy}
        onClick={() =>
          void props.mutate(
            () => props.save("tasks", { ...task, completed: !task.completed }),
            "Task updated",
          )
        }
      >
        {task.completed && <Check size={13} />}
      </button>
      <button
        className="task-title"
        onClick={() => props.edit({ table: "tasks", record: task })}
      >
        <strong className={task.completed ? "complete" : ""}>
          {task.title}
        </strong>
        <small>
          {String(task.start_time).slice(0, 5)} –{" "}
          {String(task.end_time).slice(0, 5)} <span>·</span> {minutes(task)} min
        </small>
      </button>
      {problemUrl ? (
        <a
          className={tagClass + " problem-link"}
          href={problemUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${problem?.title} on LeetCode (new tab)`}
          title={`Open ${problem?.title} on LeetCode (new tab)`}
        >
          LeetCode <ArrowUpRight size={12} aria-hidden="true" />
        </a>
      ) : (
        <span className={tagClass}>{task.category}</span>
      )}
      <button
        className="icon-button"
        aria-label={"Edit " + task.title}
        onClick={() => props.edit({ table: "tasks", record: task })}
      >
        <Pencil size={13} />
      </button>
    </div>
  );
}
export function Stats({
  items,
}: {
  items: { label: string; value: React.ReactNode; note?: string }[];
}) {
  return (
    <section
      className="stats"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((i) => (
        <div key={i.label}>
          <label>{i.label}</label>
          <strong>{i.value}</strong>
          <small>{i.note}</small>
        </div>
      ))}
    </section>
  );
}
export function ProgressBar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  return (
    <div className="progress-row">
      <div>
        <span>{label}</span>
        <small>
          {value} / {total}
        </small>
      </div>
      <div className="bar">
        <i style={{ width: `${total ? (value / total) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
