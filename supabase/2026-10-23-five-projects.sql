-- Run once in Supabase Dashboard → SQL Editor.
-- Lets each POW profile hold up to 5 projects (was 3).
alter table public.profile_projects drop constraint if exists profile_projects_position_check;
alter table public.profile_projects add constraint profile_projects_position_check check (position between 1 and 5);
