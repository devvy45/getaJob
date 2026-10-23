-- Run once in Supabase Dashboard → SQL Editor.

-- 1. Every published POW is listed in talent search (the opt-in checkbox is gone).
update public.profiles set is_discoverable = true where is_published = true;
alter table public.profiles alter column is_discoverable set default true;

-- 2. Private data: phone and résumé. Only the owner can read or change it.
create table if not exists public.profile_private (
  profile_id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  resume_path text,
  updated_at timestamptz not null default now()
);
alter table public.profile_private enable row level security;
drop policy if exists "owners manage their private data" on public.profile_private;
create policy "owners manage their private data" on public.profile_private
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- 3. Private résumé storage. Files live under <user id>/ and only the owner can access them.
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false) on conflict (id) do nothing;
drop policy if exists "owners read their resumes" on storage.objects;
drop policy if exists "owners upload their resumes" on storage.objects;
drop policy if exists "owners update their resumes" on storage.objects;
drop policy if exists "owners delete their resumes" on storage.objects;
create policy "owners read their resumes" on storage.objects for select using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners upload their resumes" on storage.objects for insert with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners update their resumes" on storage.objects for update using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners delete their resumes" on storage.objects for delete using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
