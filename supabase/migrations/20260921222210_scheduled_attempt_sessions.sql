begin;
alter table public.leetcode_attempts
  add column task_id uuid references public.tasks(id) on delete set null,
  add column time_complexity text,
  add column space_complexity text,
  add column average_case_complexity text,
  add column worst_case_complexity text,
  add column complexity_explanation text,
  add column review_action text not null default 'normal' check (review_action in ('normal','easy','stuck','later','mastered')),
  add column next_review_date date;
-- NULL task IDs permit unlimited standalone attempts. A scheduled session has one result.
create unique index leetcode_attempts_task_unique on public.leetcode_attempts(task_id) where task_id is not null;

create function public.record_attempt_session(p_attempt jsonb, p_today date)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  task_row public.tasks;
  existing public.leetcode_attempts;
  problem_uuid uuid := (p_attempt->>'problem_id')::uuid;
  task_uuid uuid := nullif(p_attempt->>'task_id','')::uuid;
  attempt_uuid uuid := (p_attempt->>'id')::uuid;
  action text := coalesce(p_attempt->>'review_action','normal');
  review_date date;
  selected_mastery text := p_attempt->>'mastery_after';
begin
  if attempt_uuid is null or problem_uuid is null or p_today is null then raise exception 'Attempt, problem, and current date are required'; end if;
  if action not in ('normal','easy','stuck','later','mastered') then raise exception 'Invalid review action'; end if;
  if action in ('easy','mastered') and selected_mastery <> 'GREEN' then raise exception 'This action requires GREEN mastery'; end if;
  if action='stuck' and selected_mastery <> 'RED' then raise exception 'Got Stuck requires RED mastery'; end if;
  -- Serialize requests for this task, including retries with different request IDs.
  if task_uuid is not null then
    select * into task_row from public.tasks where id=task_uuid for update;
    if not found then raise exception 'Scheduled task no longer exists'; end if;
    if task_row.category <> 'LeetCode' or task_row.problem_id is distinct from problem_uuid then raise exception 'Task does not match the linked LeetCode problem'; end if;
  end if;
  -- Same lock order for all new attempt callers; also serializes standalone retries.
  perform 1 from public.leetcode_problems where id=problem_uuid for update;
  if not found then raise exception 'Problem no longer exists'; end if;
  select * into existing from public.leetcode_attempts where id=attempt_uuid;
  if found then
    if existing.problem_id is distinct from problem_uuid or existing.task_id is distinct from task_uuid then raise exception 'Attempt ID belongs to another session'; end if;
    return jsonb_build_object('attempt_id',existing.id,'already_recorded',true);
  end if;
  if task_uuid is not null then
    select * into existing from public.leetcode_attempts where task_id=task_uuid;
    if found then return jsonb_build_object('attempt_id',existing.id,'already_recorded',true); end if;
  end if;
  -- Existing practice function inserts history and updates mastery/review dates.
  -- Everything here is one database transaction, including task completion.
  perform public.record_practice(problem_uuid,p_today,p_attempt);
  select next_review_date into review_date from public.leetcode_problems where id=problem_uuid;
  if action='easy' then review_date:=null;
  elsif action='stuck' then review_date:=p_today;
  elsif action='later' then review_date:=p_today+1;
  elsif action='mastered' then review_date:=p_today+14;
  end if;
  if action<>'easy' and nullif(p_attempt->>'next_review_date','') is not null then
    review_date:=(p_attempt->>'next_review_date')::date;
    if review_date<p_today then raise exception 'Next review cannot be in the past'; end if;
  end if;
  update public.leetcode_attempts set task_id=task_uuid,
    time_complexity=p_attempt->>'time_complexity', space_complexity=p_attempt->>'space_complexity',
    average_case_complexity=p_attempt->>'average_case_complexity', worst_case_complexity=p_attempt->>'worst_case_complexity',
    complexity_explanation=p_attempt->>'complexity_explanation', review_action=action, next_review_date=review_date
    where id=attempt_uuid;
  if not found then raise exception 'Update 002_attempt_retry_safety.sql before installing session completion'; end if;
  update public.leetcode_problems set next_review_date=review_date,
    active=case when action='easy' then false when selected_mastery in ('RED','ORANGE') then true else active end,
    review_stage=case when action='stuck' then 0 else review_stage end
    where id=problem_uuid;
  update public.leetcode_reviews set next_review_date=review_date where attempt_id=attempt_uuid;
  if task_uuid is not null then update public.tasks set completed=true where id=task_uuid; end if;
  return jsonb_build_object('attempt_id',attempt_uuid,'already_recorded',false);
end $$;
revoke all on function public.record_attempt_session(jsonb,date) from public,anon,authenticated;
grant execute on function public.record_attempt_session(jsonb,date) to service_role;
commit;
