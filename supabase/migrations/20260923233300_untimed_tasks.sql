alter table public.tasks alter column start_time drop not null, alter column end_time drop not null;
alter table public.tasks add constraint tasks_time_pair_check check ((start_time is null and end_time is null) or (start_time is not null and end_time is not null and end_time > start_time));
