-- Run once in the Supabase SQL editor. No anonymous access is granted.

begin;

create extension if not exists pgcrypto;

create table public.leetcode_problems (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  url text,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')) not null,
  topics text,
  pattern text,
  mastery text check (mastery in ('RED', 'ORANGE', 'YELLOW', 'GREEN')) not null,
  active boolean not null default true,
  notes text,
  first_attempted_date date,
  last_attempted_date date,
  next_review_date date,
  review_stage integer not null default 0 check (review_stage between 0 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  category text check (category in ('LeetCode', 'System Design', 'Behavioral', 'Achievers', 'Other')) not null,
  scheduled_date date not null,
  start_time time not null,
  end_time time not null,
  block text,
  notes text,
  problem_id uuid references public.leetcode_problems(id) on delete set null,
  completed boolean not null default false,
  check (end_time > start_time),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leetcode_attempts (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid references public.leetcode_problems(id) on delete cascade not null,
  attempted_at timestamptz not null default now(),
  solved boolean not null default false,
  time_spent integer not null default 0 check (time_spent between 0 and 100000),
  hints_used integer not null default 0 check (hints_used between 0 and 100000),
  perceived_difficulty text check (perceived_difficulty in ('Easy', 'Medium', 'Hard')),
  mastery_after text check (mastery_after in ('RED', 'ORANGE', 'YELLOW', 'GREEN')) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.system_design_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  status text check (status in ('Not started', 'Learning', 'Learned')) not null,
  confidence integer check (confidence between 1 and 5),
  notes text,
  last_reviewed date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.system_design_exercises (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  status text check (status in ('Not started', 'In progress', 'Completed')) not null,
  date_attempted date,
  confidence integer check (confidence between 1 and 5),
  notes text,
  weaknesses text,
  revisit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.behavioral_stories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  themes text,
  status text check (status in ('idea', 'rough', 'refined', 'interview-ready')) not null,
  situation text,
  task text,
  action text,
  result text,
  lessons text,
  confidence integer check (confidence between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.achievers_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  summary text,
  business_problem text,
  ownership text,
  technologies text,
  architecture text,
  implementation text,
  challenges text,
  tradeoffs text,
  rollout text,
  testing text,
  reliability text,
  impact text,
  questions text,
  confidence integer check (confidence between 1 and 5),
  interview_ready boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leetcode_reviews (
 id uuid primary key default gen_random_uuid(),
 problem_id uuid not null references public.leetcode_problems(id) on delete cascade,
 reviewed_at timestamptz not null default now(),
 scheduled_for date,
 next_review_date date,
 attempt_id uuid references public.leetcode_attempts(id) on delete set null,
 created_at timestamptz not null default now()
);
create function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end $$;

alter table public.leetcode_problems enable row level security;
revoke all on public.leetcode_problems from anon, authenticated;
grant all on public.leetcode_problems to service_role;

create trigger touch_leetcode_problems before update on public.leetcode_problems for each row execute function public.touch_updated_at();

alter table public.tasks enable row level security;
revoke all on public.tasks from anon, authenticated;
grant all on public.tasks to service_role;

create trigger touch_tasks before update on public.tasks for each row execute function public.touch_updated_at();

alter table public.leetcode_attempts enable row level security;
revoke all on public.leetcode_attempts from anon, authenticated;
grant all on public.leetcode_attempts to service_role;

create trigger touch_leetcode_attempts before update on public.leetcode_attempts for each row execute function public.touch_updated_at();

alter table public.system_design_topics enable row level security;
revoke all on public.system_design_topics from anon, authenticated;
grant all on public.system_design_topics to service_role;

create trigger touch_system_design_topics before update on public.system_design_topics for each row execute function public.touch_updated_at();

alter table public.system_design_exercises enable row level security;
revoke all on public.system_design_exercises from anon, authenticated;
grant all on public.system_design_exercises to service_role;

create trigger touch_system_design_exercises before update on public.system_design_exercises for each row execute function public.touch_updated_at();

alter table public.behavioral_stories enable row level security;
revoke all on public.behavioral_stories from anon, authenticated;
grant all on public.behavioral_stories to service_role;

create trigger touch_behavioral_stories before update on public.behavioral_stories for each row execute function public.touch_updated_at();

alter table public.achievers_projects enable row level security;
revoke all on public.achievers_projects from anon, authenticated;
grant all on public.achievers_projects to service_role;

create trigger touch_achievers_projects before update on public.achievers_projects for each row execute function public.touch_updated_at();

alter table public.leetcode_reviews enable row level security;
revoke all on public.leetcode_reviews from anon, authenticated;
grant all on public.leetcode_reviews to service_role;

create index tasks_date_idx on public.tasks(scheduled_date, start_time);

create index problems_review_idx on public.leetcode_problems(next_review_date) where active;

create index attempts_problem_idx on public.leetcode_attempts(problem_id, attempted_at desc);

create index reviews_problem_idx on public.leetcode_reviews(problem_id, reviewed_at desc);

-- Atomically record an attempt/review and move the review schedule.
create function public.record_practice(p_problem_id uuid, p_today date, p_attempt jsonb default null) returns void language plpgsql set search_path = public as $$
declare p public.leetcode_problems; a_id uuid; next_day date; new_stage integer;
begin
 select * into p from public.leetcode_problems where id=p_problem_id for update;
 if not found then raise exception 'Problem not found'; end if;
 if p_attempt is null and (not p.active or p.next_review_date is null or p.next_review_date>p_today) then raise exception 'This review is not due'; end if;
 if p_attempt is not null then
 if exists(select 1 from public.leetcode_attempts where id=(p_attempt->>'id')::uuid and problem_id=p_problem_id) then return; end if;
 insert into public.leetcode_attempts(id,problem_id,attempted_at,solved,time_spent,hints_used,perceived_difficulty,mastery_after,notes)
 values((p_attempt->>'id')::uuid,p_problem_id,(p_attempt->>'attempted_at')::timestamptz,coalesce((p_attempt->>'solved')::boolean,false),(p_attempt->>'time_spent')::integer,coalesce((p_attempt->>'hints_used')::integer,0),p_attempt->>'perceived_difficulty',p_attempt->>'mastery_after',p_attempt->>'notes') returning id into a_id;
 end if;
 new_stage:=case when p_attempt->>'mastery_after' in ('RED','ORANGE') then 0 else coalesce(p.review_stage,0) end;
 next_day:=p_today+(array[1,2,4,7,14])[least(new_stage,4)+1];
 insert into public.leetcode_reviews(problem_id,scheduled_for,next_review_date,attempt_id) values(p.id,p.next_review_date,next_day,a_id);
 update public.leetcode_problems set next_review_date=next_day,review_stage=least(new_stage+1,4),
 mastery=coalesce(p_attempt->>'mastery_after',p.mastery),
 first_attempted_date=case when p_attempt is not null then coalesce(p.first_attempted_date,(p_attempt->>'attempted_at')::timestamptz::date) else p.first_attempted_date end,
 last_attempted_date=case when p_attempt is not null then greatest(p.last_attempted_date,(p_attempt->>'attempted_at')::timestamptz::date) else p.last_attempted_date end where id=p.id;
end $$;
revoke all on function public.record_practice(uuid,date,jsonb) from public,anon,authenticated;
grant execute on function public.record_practice(uuid,date,jsonb) to service_role;
commit;
