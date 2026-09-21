-- Safe to run on the existing database. Preserves all records.
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
 next_day:=p_today+(array[1,2,4,7,14])[least(new_stage,4)+1];
 insert into public.leetcode_reviews(problem_id,scheduled_for,next_review_date,attempt_id) values(p.id,p.next_review_date,next_day,a_id);
 update public.leetcode_problems set next_review_date=next_day,review_stage=least(new_stage+1,4),
 mastery=coalesce(p_attempt->>'mastery_after',p.mastery),
 first_attempted_date=case when p_attempt is not null then coalesce(p.first_attempted_date,(p_attempt->>'attempted_at')::timestamptz::date) else p.first_attempted_date end,
 last_attempted_date=case when p_attempt is not null then greatest(p.last_attempted_date,(p_attempt->>'attempted_at')::timestamptz::date) else p.last_attempted_date end where id=p.id;
end $$;
