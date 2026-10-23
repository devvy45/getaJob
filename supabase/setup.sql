-- GetAJob: POW profiles
-- Run this whole file once in Supabase Dashboard → SQL Editor → New query.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  full_name text not null,
  headline text,
  location text,
  status text not null default 'Open to work',
  positioning text,
  linkedin_url text,
  x_url text,
  telegram_url text,
  email text,
  photo_path text,
  is_published boolean not null default false,
  is_discoverable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists is_discoverable boolean not null default false;

-- Safe to run on an existing project too: the first version of the table may
-- already exist without this opt-in field.
create table if not exists public.profile_proof_points (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  position smallint not null check (position between 1 and 4),
  content text not null,
  unique (profile_id, position)
);

create table if not exists public.profile_projects (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  position smallint not null check (position between 1 and 5),
  name text not null,
  story text,
  unique (profile_id, position)
);

alter table public.profiles enable row level security;
alter table public.profile_proof_points enable row level security;
alter table public.profile_projects enable row level security;

create policy "published profiles are visible to everyone"
  on public.profiles for select using ((is_published = true and is_discoverable = true) or auth.uid() = id);
create policy "people can create their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "people can update their own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "published proof is visible to everyone"
  on public.profile_proof_points for select using (
    exists (select 1 from public.profiles where id = profile_id and ((is_published = true and is_discoverable = true) or id = auth.uid()))
  );
create policy "people can manage their own proof"
  on public.profile_proof_points for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "published projects are visible to everyone"
  on public.profile_projects for select using (
    exists (select 1 from public.profiles where id = profile_id and ((is_published = true and is_discoverable = true) or id = auth.uid()))
  );

alter policy "published profiles are visible to everyone" on public.profiles
  using ((is_published = true and is_discoverable = true) or auth.uid() = id);

alter policy "published proof is visible to everyone" on public.profile_proof_points
  using (exists (select 1 from public.profiles where id = profile_id and ((is_published = true and is_discoverable = true) or id = auth.uid())));

alter policy "published projects are visible to everyone" on public.profile_projects
  using (exists (select 1 from public.profiles where id = profile_id and ((is_published = true and is_discoverable = true) or id = auth.uid())));
create policy "people can manage their own projects"
  on public.profile_projects for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "profile photos are publicly visible"
  on storage.objects for select using (bucket_id = 'profile-photos');
create policy "people can upload their own photo"
  on storage.objects for insert with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "people can update their own photo"
  on storage.objects for update using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "people can delete their own photo"
  on storage.objects for delete using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Allow up to 5 projects per profile (safe to re-run).
alter table public.profile_projects drop constraint if exists profile_projects_position_check;
alter table public.profile_projects add constraint profile_projects_position_check check (position between 1 and 5);
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
