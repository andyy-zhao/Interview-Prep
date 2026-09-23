import { NavLink } from "react-router-dom";
import { ArrowUpRight, Code2 } from "lucide-react";
import { api } from "../data/api";
import { dateKey, minutes, compareTaskTimes } from "../domain/types";
import {
  Heading,
  AddButton,
  Empty,
  Stats,
  TaskRow,
  type PageProps,
} from "../components/shared";
export default function Today(props: PageProps) {
  const { data, edit, configured, busy, mutate } = props;
  const tasks = data.tasks
    .filter((t) => t.scheduled_date === dateKey())
    .sort(compareTaskTimes);
  const done = tasks.filter((t) => t.completed).length;
  const due = data.leetcode_problems.filter(
    (p) =>
      p.active && p.next_review_date && String(p.next_review_date) <= dateKey(),
  );
  const duration = tasks.reduce((sum, t) => sum + minutes(t), 0);
  const groups = [
    ...new Set(tasks.map((t) => String(t.block || "Study session"))),
  ];
  return (
    <>
      <Heading
        eyebrow={new Date().toLocaleDateString("en-CA", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
        title="Your focus for today"
        description="A little deliberate practice. A little more confidence."
        action={<AddButton onClick={() => edit({ table: "tasks" })} />}
      />
      <Stats
        items={[
          {
            label: "Today's tasks",
            value: (
              <>
                {done}
                <em> / {tasks.length}</em>
              </>
            ),
            note: "Keep the momentum going",
          },
          {
            label: "Planned study time",
            value: (
              <>
                {Math.floor(duration / 60)}
                <em>h </em>
                {duration % 60}
                <em>m</em>
              </>
            ),
            note: tasks.some(t=>!t.start_time) ? "Timed sessions only · untimed tasks excluded" : "Time invested in what's next",
          },
          {
            label: "Reviews due",
            value: (
              <>
                {due.length}
                <em> problems</em>
              </>
            ),
            note: "Strengthen what you've learned",
          },
        ]}
      />
      <div className="today-grid">
        <section>
          <div className="section-heading">
            <h2>
              Your schedule <span>{tasks.length}</span>
            </h2>
            <NavLink to="/week">
              Week view <ArrowUpRight size={14} />
            </NavLink>
          </div>
          {!tasks.length && (
            <Empty
              title="Make room for a little progress"
              description="Add your first study session, or import your Week 1 plan using the seed script."
              action={<AddButton onClick={() => edit({ table: "tasks" })} />}
            />
          )}{" "}
          {groups.map((block) => (
            <div className="time-block" key={block}>
              <h3>
                <span className="timeline-dot" />
                {block}
              </h3>
              <div className="task-list">
                {tasks
                  .filter((t) => String(t.block || "Study session") === block)
                  .map((t) => (
                    <TaskRow key={t.id} task={t} props={props} />
                  ))}
              </div>
            </div>
          ))}
        </section>
        <section className="right-col">
          <div className="focus-card">
            <div className="mini-label">TODAY'S PROGRESS</div>
            <div
              className="progress-circle"
              style={{
                background: `conic-gradient(#6f9460 ${tasks.length ? (done / tasks.length) * 100 : 0}%, #d9e5d1 0)`,
              }}
            >
              <div>
                {tasks.length ? Math.round((done / tasks.length) * 100) : 0}
                <small>%</small>
              </div>
            </div>
            <h3>
              {done === tasks.length && tasks.length
                ? "A good day’s work."
                : "One session at a time."}
            </h3>
            <p>
              {done} of {tasks.length} tasks completed.
              <br />
              Every session counts.
            </p>
            <div className="bar">
              <i
                style={{
                  width: `${tasks.length ? (done / tasks.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="review-card">
            <h3>
              Time for a refresh <Code2 size={17} />
            </h3>
            <p>
              {due.length
                ? "Revisit these before they fade."
                : "No reviews due. A little breathing room."}
            </p>
            {due.map((p) => (
              <div className="review-item" key={p.id}>
                <span className={"mastery-dot " + p.mastery} />
                <button
                  className="text-button"
                  onClick={() =>
                    edit({ table: "leetcode_problems", record: p })
                  }
                >
                  {p.title}
                  <small>
                    {p.pattern} ·{" "}
                    {String(p.next_review_date) < dateKey()
                      ? "Overdue"
                      : "Due today"}
                  </small>
                </button>
                <button
                  className="small-button"
                  disabled={!configured || busy}
                  onClick={() =>
                    void mutate(
                      () => api.review(p.id),
                      "Review completed and rescheduled",
                    )
                  }
                >
                  Done
                </button>
              </div>
            ))}
            <NavLink to="/leetcode">
              Open problem library <ArrowUpRight size={14} />
            </NavLink>
          </div>
        </section>
      </div>
    </>
  );
}
