import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { dateKey, monday, addDays } from "../domain/types";
import { Heading, Stats, TaskRow, type PageProps } from "../components/shared";
export default function Week(props: PageProps) {
  const [start, setStart] = useState(monday(dateKey()));
  const end = addDays(start, 6);
  const tasks = props.data.tasks.filter(
    (t) => String(t.scheduled_date) >= start && String(t.scheduled_date) <= end,
  );
  return (
    <>
      <Heading
        eyebrow="A WEEK OF INTENTIONAL PRACTICE"
        title="Your weekly plan"
        description="Keep your commute useful. Keep your evenings balanced."
        action={
          <div className="button-group">
            <button
              aria-label="Previous week"
              onClick={() => setStart(addDays(start, -7))}
            >
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setStart(monday(dateKey()))}>
              This week
            </button>
            <button
              aria-label="Next week"
              onClick={() => setStart(addDays(start, 7))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />
      <Stats
        items={[
          {
            label: "Week of",
            value: (
              <em>
                {new Date(start + "T12:00").toLocaleDateString("en-CA", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                –{" "}
                {new Date(end + "T12:00").toLocaleDateString("en-CA", {
                  month: "short",
                  day: "numeric",
                })}
              </em>
            ),
            note: "Monday through Sunday",
          },
          {
            label: "Completed",
            value: (
              <>
                {tasks.filter((t) => t.completed).length}
                <em> / {tasks.length} tasks</em>
              </>
            ),
            note: "Edit any task to reschedule it",
          },
        ]}
      />
      <div className="week-grid">
        {Array.from({ length: 7 }, (_, n) => addDays(start, n)).map((day) => (
          <section
            className={"week-day " + (day === dateKey() ? "is-today" : "")}
            key={day}
          >
            <div className="section-heading">
              <h2>
                {new Date(day + "T12:00").toLocaleDateString("en-CA", {
                  weekday: "short",
                  day: "numeric",
                })}
                {day === dateKey() && <span>Today</span>}
              </h2>
              <button
                className="icon-button"
                aria-label={"Add task on " + day}
                onClick={() =>
                  props.edit({
                    table: "tasks",
                    defaults: { scheduled_date: day },
                  })
                }
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="task-list">
              {tasks
                .filter((t) => t.scheduled_date === day)
                .sort((a, b) =>
                  String(a.start_time).localeCompare(String(b.start_time)),
                )
                .map((t) => (
                  <TaskRow key={t.id} task={t} props={props} />
                ))}
              {!tasks.some((t) => t.scheduled_date === day) && (
                <button
                  className="empty-day"
                  onClick={() =>
                    props.edit({
                      table: "tasks",
                      defaults: { scheduled_date: day },
                    })
                  }
                >
                  No sessions yet. Add one →
                </button>
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
