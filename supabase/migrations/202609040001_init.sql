create extension if not exists pgcrypto;

create type public.user_role as enum ('admin','customer');
create type public.job_status as enum ('open','closed');
create type public.application_stage as enum ('new','screening','interview','offer','hired');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role public.user_role not null default 'customer',
  company_id uuid references public.companies(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint customer_requires_company check (role = 'admin' or company_id is not null)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text not null default '',
  status public.job_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  linkedin_url text,
  location text,
  notes text,
  cv_path text,
  cv_text text,
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  stage public.application_stage not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(candidate_id, job_id)
);

create table public.cv_assessments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  score int not null check (score between 0 and 100),
  summary text not null,
  strengths jsonb not null default '[]'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index jobs_company_idx on public.jobs(company_id);
create index candidates_company_idx on public.candidates(company_id);
create index applications_company_stage_idx on public.applications(company_id,stage);
create index applications_job_idx on public.applications(job_id);
create index assessments_lookup_idx on public.cv_assessments(company_id,candidate_id,job_id,created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

create or replace function public.my_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = (select auth.uid());
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.my_company_id() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_company_id() to authenticated;

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.applications enable row level security;
alter table public.cv_assessments enable row level security;

revoke all on public.companies, public.profiles, public.jobs, public.candidates, public.applications, public.cv_assessments from anon, authenticated;
grant select on public.companies, public.profiles, public.jobs, public.candidates, public.applications, public.cv_assessments to authenticated;
grant insert, update, delete on public.jobs, public.candidates, public.applications to authenticated;
grant all on public.companies, public.profiles, public.jobs, public.candidates, public.applications, public.cv_assessments to service_role;

create policy companies_select on public.companies for select to authenticated
using ((select public.is_admin()) or id = (select public.my_company_id()));

create policy profiles_select on public.profiles for select to authenticated
using ((select public.is_admin()) or id = (select auth.uid()));

create policy jobs_select on public.jobs for select to authenticated
using ((select public.is_admin()) or company_id = (select public.my_company_id()));
create policy jobs_insert on public.jobs for insert to authenticated
with check ((select public.is_admin()) or company_id = (select public.my_company_id()));
create policy jobs_update on public.jobs for update to authenticated
using ((select public.is_admin()) or company_id = (select public.my_company_id()))
with check ((select public.is_admin()) or company_id = (select public.my_company_id()));
create policy jobs_delete on public.jobs for delete to authenticated
using ((select public.is_admin()) or company_id = (select public.my_company_id()));

create policy candidates_select on public.candidates for select to authenticated
using ((select public.is_admin()) or company_id = (select public.my_company_id()));
create policy candidates_insert on public.candidates for insert to authenticated
with check ((select public.is_admin()) or company_id = (select public.my_company_id()));
create policy candidates_update on public.candidates for update to authenticated
using ((select public.is_admin()) or company_id = (select public.my_company_id()))
with check ((select public.is_admin()) or company_id = (select public.my_company_id()));
create policy candidates_delete on public.candidates for delete to authenticated
using ((select public.is_admin()) or company_id = (select public.my_company_id()));

create policy applications_select on public.applications for select to authenticated
using ((select public.is_admin()) or company_id = (select public.my_company_id()));
create policy applications_insert on public.applications for insert to authenticated
with check (
  ((select public.is_admin()) or company_id = (select public.my_company_id()))
  and exists(select 1 from public.candidates c where c.id=candidate_id and c.company_id=applications.company_id)
  and exists(select 1 from public.jobs j where j.id=job_id and j.company_id=applications.company_id)
);
create policy applications_update on public.applications for update to authenticated
using ((select public.is_admin()) or company_id = (select public.my_company_id()))
with check ((select public.is_admin()) or company_id = (select public.my_company_id()));
create policy applications_delete on public.applications for delete to authenticated
using ((select public.is_admin()) or company_id = (select public.my_company_id()));

create policy assessments_select on public.cv_assessments for select to authenticated
using ((select public.is_admin()) or company_id = (select public.my_company_id()));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('cvs','cvs',false,6291456,array['application/pdf','text/plain'])
on conflict (id) do update set public=false, file_size_limit=6291456;

create policy cvs_select on storage.objects for select to authenticated
using (bucket_id='cvs' and ((select public.is_admin()) or (storage.foldername(name))[1] = (select public.my_company_id())::text));
create policy cvs_insert on storage.objects for insert to authenticated
with check (bucket_id='cvs' and ((select public.is_admin()) or (storage.foldername(name))[1] = (select public.my_company_id())::text));
create policy cvs_delete on storage.objects for delete to authenticated
using (bucket_id='cvs' and ((select public.is_admin()) or (storage.foldername(name))[1] = (select public.my_company_id())::text));
