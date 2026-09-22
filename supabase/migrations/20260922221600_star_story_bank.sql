-- Extend the existing private, single-user story bank. Existing stories and STAR notes remain intact.
alter table public.behavioral_stories
  add column short_summary text,
  add column company text,
  add column project_name text,
  add column leadership_principles text,
  add column notes text;
-- themes remains the existing comma-separated category list; lessons stores Learnings.
-- Preserve existing RLS and service-role-only grants and updated_at trigger.

insert into public.behavioral_stories (title, short_summary, themes, leadership_principles, status, company)
select 'duplogo-batch-processor', 'At Achievers, multiple services needed reliable asynchronous batch processing, but there was no standardized reusable solution. I had significant ownership over building a reusable Go batch-processing library originally driven by duplicate notification problems in system-notification, with capabilities such as dispatcher/worker processing, audit recovery, metrics, circuit breaking, concurrency controls, and observability; it later became useful across other services/teams.', 'Ownership, Invent / New Idea, Technical Challenge, Ambiguity, Impact, Project I''m Proud Of, Think Big, Reliability, System Design, Cross-Team Adoption', 'Invent and Simplify; Ownership; Think Big; Dive Deep; Deliver Results', 'idea', 'Achievers'
where not exists (select 1 from public.behavioral_stories where lower(title) = lower('duplogo-batch-processor'));

insert into public.behavioral_stories (title, short_summary, themes, leadership_principles, status, company)
select 'Sphinx → Elasticsearch Migration', 'I owned major parts of migrating external search traffic from the legacy Sphinx search engine to Achievers'' Elasticsearch-backed system-search service. To preserve search functionality, I had to deeply understand the existing Sphinx query behavior, learn Elasticsearch and search templates, identify behavioral differences, and modify/configure the new implementation so search functionality was preserved or improved.', 'Dive Deep, Technical Challenge, Learning New Technology, Migration, Risk Management, Ownership, Customer Impact, Ambiguity, Cross-Team Collaboration', 'Dive Deep; Ownership; Learn and Be Curious; Deliver Results', 'idea', 'Achievers'
where not exists (select 1 from public.behavioral_stories where lower(title) = lower('Sphinx → Elasticsearch Migration'));

insert into public.behavioral_stories (title, short_summary, themes, leadership_principles, status, company)
select 'PFA Email → system-notification Outbox Migration', 'Migrated transactional email flows from PFA''s older mail-queue approach into the system-notification/outbox pipeline, adding stronger deduplication, retry/status visibility, and reliability across multiple services.', 'Migration, Reliability, Ownership, System Design, Cross-Team Collaboration, Technical Complexity', '', 'idea', 'Achievers'
where not exists (select 1 from public.behavioral_stories where lower(title) = lower('PFA Email → system-notification Outbox Migration'));

insert into public.behavioral_stories (title, short_summary, themes, leadership_principles, status, company)
select 'status-tracker Race Condition', 'Diagnosed a distributed-state race condition where concurrent Pub/Sub events could leave a job in the wrong final status, then fixed the transition behavior and added targeted logging to understand the production event flow.', 'Debugging, Dive Deep, Production Issue, Technical Challenge, Learning, Reliability', '', 'idea', 'Achievers'
where not exists (select 1 from public.behavioral_stories where lower(title) = lower('status-tracker Race Condition'));

insert into public.behavioral_stories (title, short_summary, themes, leadership_principles, status, company)
select 'system-search Batch Processor Migration / Cleanup', 'Integrated the reusable batch processor into system-search, stabilized the new path, and then completed the migration lifecycle by removing the legacy dispatcher/worker implementation, old feature flags, orphaned packages, and unused data structures.', 'Ownership, Simplification, Technical Debt, Migration, Risk Management, Long-Term Thinking', '', 'idea', 'Achievers'
where not exists (select 1 from public.behavioral_stories where lower(title) = lower('system-search Batch Processor Migration / Cleanup'));

insert into public.behavioral_stories (title, short_summary, themes, leadership_principles, status, company)
select 'System Template Management', 'Owned a full vertical feature spanning database schema, Go/gRPC backend, GraphQL/Apollo, and React UI, including writing a design document before implementation.', 'End-to-End Ownership, Ambiguity, Full-Stack, Learning, Project I''m Proud Of, Technical Design', '', 'idea', 'Achievers'
where not exists (select 1 from public.behavioral_stories where lower(title) = lower('System Template Management'));

insert into public.behavioral_stories (title, short_summary, themes, leadership_principles, status, company)
select 'announcement-mgmt Performance Investigation', 'Investigated latency problems in announcement-mgmt, instrumented the cache-rebuild flow, parallelized GCS work, and replaced repeated Redis deletes with bulk operations.', 'Performance, Optimization, Debugging, Dive Deep, Data-Driven Decision Making', '', 'idea', 'Achievers'
where not exists (select 1 from public.behavioral_stories where lower(title) = lower('announcement-mgmt Performance Investigation'));
