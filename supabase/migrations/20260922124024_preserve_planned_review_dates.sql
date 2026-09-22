begin;
-- Preserve future plans during normal practice. Explicit actions/date edits still take precedence.
create or replace function public.record_practice(p_problem_id uuid, p_today date, p_attempt jsonb default null) returns void language plpgsql set search_path = public as $$
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
 next_day:=case when coalesce(p_attempt->>'mastery_after',p.mastery)='GREEN' then p_today+14
   else p_today+(array[1,2,4,7,14])[least(new_stage,4)+1] end;
 if p_attempt is not null and p.next_review_date > next_day then next_day:=p.next_review_date; end if;
 insert into public.leetcode_reviews(problem_id,scheduled_for,next_review_date,attempt_id) values(p.id,p.next_review_date,next_day,a_id);
 update public.leetcode_problems set next_review_date=next_day,review_stage=least(new_stage+1,4),
 mastery=coalesce(p_attempt->>'mastery_after',p.mastery),
 first_attempted_date=case when p_attempt is not null then coalesce(p.first_attempted_date,(p_attempt->>'attempted_at')::timestamptz::date) else p.first_attempted_date end,
 last_attempted_date=case when p_attempt is not null then greatest(p.last_attempted_date,(p_attempt->>'attempted_at')::timestamptz::date) else p.last_attempted_date end where id=p.id;
end $$;

create or replace function public.record_attempt_session(p_attempt jsonb, p_today date)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  task_row public.tasks;
  existing public.leetcode_attempts;
  problem_uuid uuid := (p_attempt->>'problem_id')::uuid;
  task_uuid uuid := nullif(p_attempt->>'task_id','')::uuid;
  attempt_uuid uuid := (p_attempt->>'id')::uuid;
  action text := coalesce(p_attempt->>'review_action','normal');
  review_date date;
  prior_review_date date;
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
  select next_review_date into prior_review_date from public.leetcode_problems where id=problem_uuid for update;
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
  if coalesce(p_attempt->>'review_mode','custom') not in ('automatic','custom') then raise exception 'Invalid review mode'; end if;
  if action<>'easy' and coalesce(p_attempt->>'review_mode','custom')='custom' and nullif(p_attempt->>'next_review_date','') is not null then
    review_date:=(p_attempt->>'next_review_date')::date;
    if review_date<p_today then raise exception 'Next review cannot be in the past'; end if;
  end if;
  update public.leetcode_attempts set task_id=task_uuid,
    time_spent_seconds=coalesce((p_attempt->>'time_spent_seconds')::integer,0),
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
commit;
