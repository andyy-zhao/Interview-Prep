-- Separate exact interview answers from reusable factual experiences.
create table public.behavioral_questions (
 id uuid primary key default gen_random_uuid(),
 question_text text not null check(length(trim(question_text)) > 0),
 company text, category text,
 linked_story_id uuid references public.behavioral_stories(id) on delete set null,
 response text, situation text, task text, action text, result text, learnings text,
 leadership_principles text, notes text,
 status text not null default 'idea' check(status in ('idea','rough','refined','interview-ready')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index behavioral_questions_story_idx on public.behavioral_questions(linked_story_id);
alter table public.behavioral_questions enable row level security;
revoke all on public.behavioral_questions from anon, authenticated;
grant all on public.behavioral_questions to service_role;
create trigger touch_behavioral_questions before update on public.behavioral_questions for each row execute function public.touch_updated_at();

-- Move question-shaped legacy records, preserving original IDs and all authored content.
insert into public.behavioral_questions(id,question_text,company,category,response,situation,task,action,result,learnings,leadership_principles,notes,status,created_at,updated_at)
select id,title,company,themes,null,situation,task,action,result,lessons,leadership_principles,
concat_ws(E'\n\n',notes,case when short_summary is not null then 'Original summary: '||short_summary end,case when project_name is not null then 'Project: '||project_name end,case when confidence is not null then 'Original confidence: '||confidence end),status,created_at,updated_at
from public.behavioral_stories where title ~* '^(can you |tell me |describe a |give me an example|how did you |have you ever )';
delete from public.behavioral_stories s where exists(select 1 from public.behavioral_questions q where q.id=s.id);

alter table public.behavioral_stories rename column situation to context;
alter table public.behavioral_stories rename column task to my_ownership;
alter table public.behavioral_stories rename column action to important_actions;
alter table public.behavioral_stories rename column result to impact;
alter table public.behavioral_stories rename column lessons to learnings;
alter table public.behavioral_stories rename column themes to useful_angles;
alter table public.behavioral_stories add column technical_details text, add column challenges text;
alter table public.behavioral_stories drop constraint behavioral_stories_status_check;
update public.behavioral_stories set status=case status when 'rough' then 'developed' when 'refined' then 'strong' when 'interview-ready' then 'strong' else 'idea' end;
alter table public.behavioral_stories add constraint behavioral_stories_status_check check(status in ('idea','developed','strong'));

-- Reuse the existing core story rather than seeding another copy.
update public.behavioral_stories set title='Reusable Batch Processing Platform — Build, Adoption, and Migration'
where title='duplogo-batch-processor' and not exists(select 1 from public.behavioral_stories where title='Reusable Batch Processing Platform — Build, Adoption, and Migration');
-- Canonicalize a migrated version of the requested question if present.
update public.behavioral_questions set question_text='Can you tell me about a time you implemented a new idea or technology to solve a problem? What impact did it have?', status='rough',
linked_story_id=(select id from public.behavioral_stories where title='Reusable Batch Processing Platform — Build, Adoption, and Migration' limit 1)
where question_text in ('Tell me about a time you implemented a new idea or technology to solve a problem. What impact did it have?','Can you tell me about a time you implemented a new idea or technology to solve a problem? What impact did it have?');
-- The live question record was removed before restructuring. Preserve its surviving Situation context once.
insert into public.behavioral_questions(question_text,linked_story_id,status,situation)
select 'Can you tell me about a time you implemented a new idea or technology to solve a problem? What impact did it have?',
(select id from public.behavioral_stories where title='Reusable Batch Processing Platform — Build, Adoption, and Migration' limit 1),'rough',
(select context from public.behavioral_stories where title='Reusable Batch Processing Platform — Build, Adoption, and Migration' limit 1)
where not exists(select 1 from public.behavioral_questions where question_text='Can you tell me about a time you implemented a new idea or technology to solve a problem? What impact did it have?');
