import { dateKey, monday, addDays } from "../domain/types";
import {
  Heading,
  Stats,
  ProgressBar,
  type PageProps,
} from "../components/shared";
export default function Progress({ data }: PageProps) {
  const start = monday(dateKey());
  const tasks = data.tasks.filter(
    (t) =>
      String(t.scheduled_date) >= start &&
      String(t.scheduled_date) <= addDays(start, 6),
  );
  const problems = data.leetcode_problems;
  const attempted = problems.filter(
    (p) =>
      p.first_attempted_date ||
      data.leetcode_attempts.some((a) => a.problem_id === p.id),
  ).length;
  const patterns = [
    ...new Set(problems.map((p) => String(p.pattern || "Uncategorized"))),
  ];
  return (
    <>
      <Heading
        eyebrow="THE BIGGER PICTURE"
        title="See how far you've come"
        description="Steady effort across all four areas. Confidence built on evidence."
      />
      <Stats
        items={[
          {
            label: "This week",
            value: (
              <>
                {tasks.filter((t) => t.completed).length}
                <em> / {tasks.length} tasks</em>
              </>
            ),
            note: "Completed versus planned",
          },
          {
            label: "Problems attempted",
            value: attempted,
            note: "Unique problems practiced",
          },
          {
            label: "Reviews due",
            value: problems.filter(
              (p) =>
                p.active &&
                p.next_review_date &&
                String(p.next_review_date) <= dateKey(),
            ).length,
            note: "Active problems ready to revisit",
          },
        ]}
      />
      <div className="progress-grid">
        <section className="panel">
          <h2>LeetCode mastery</h2>
          <ProgressBar
            label="Problems mastered"
            value={problems.filter((p) => p.mastery === "GREEN").length}
            total={problems.length}
          />
          <h3>Mastery by pattern</h3>
          {!patterns.length && (
            <p>Add problems to see your strengths by pattern.</p>
          )}
          {patterns.map((pattern) => (
            <ProgressBar
              key={pattern}
              label={pattern}
              value={
                problems.filter(
                  (p) =>
                    String(p.pattern || "Uncategorized") === pattern &&
                    p.mastery === "GREEN",
                ).length
              }
              total={
                problems.filter(
                  (p) => String(p.pattern || "Uncategorized") === pattern,
                ).length
              }
            />
          ))}
        </section>
        <section className="panel">
          <h2>System design</h2>
          <ProgressBar
            label="Topics learned"
            value={
              data.system_design_topics.filter((t) => t.status === "Learned")
                .length
            }
            total={data.system_design_topics.length}
          />
          <ProgressBar
            label="Designs attempted"
            value={
              data.system_design_exercises.filter(
                (t) => t.date_attempted || t.status !== "Not started",
              ).length
            }
            total={data.system_design_exercises.length}
          />
        </section>
        <section className="panel">
          <h2>Behavioral stories</h2>
          <p>{data.behavioral_stories.length} stories in your bank</p>
          <ProgressBar
            label="Interview-ready"
            value={
              data.behavioral_stories.filter(
                (s) => s.status === "interview-ready",
              ).length
            }
            total={data.behavioral_stories.length}
          />
        </section>
        <section className="panel">
          <h2>Achievers experience</h2>
          <p>{data.achievers_projects.length} projects documented</p>
          <ProgressBar
            label="Interview-ready"
            value={
              data.achievers_projects.filter((p) => p.interview_ready).length
            }
            total={data.achievers_projects.length}
          />
        </section>
      </div>
    </>
  );
}
