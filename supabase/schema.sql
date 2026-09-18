-- Apoyos Digitales - Facultad de Ingeniería Mochis
create extension if not exists pgcrypto;

create type public.user_role as enum ('admin','respondent');
create type public.form_status as enum ('draft','published','closed','archived');
create type public.submission_status as enum ('draft','submitted','in_review','resolved','closed');
create type public.validation_status as enum ('incomplete','pending','validated','rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  role public.user_role not null default 'respondent',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.forms (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  status public.form_status not null default 'draft',
  created_by uuid not null references public.profiles(id) on delete restrict,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  type text not null check (type in ('text','textarea','number','decimal','email','phone','date','time','datetime','select_one','select_multiple','boolean','rating','range','file','image','signature','consent','note','section','matrix')),
  label text not null,
  description text not null default '',
  required boolean not null default false,
  position integer not null default 0 check(position >= 0),
  options jsonb not null default '[]'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  conditional_logic jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  folio text unique,
  form_id uuid not null references public.forms(id) on delete restrict,
  respondent_id uuid not null references public.profiles(id) on delete restrict,
  status public.submission_status not null default 'draft',
  validation_status public.validation_status not null default 'pending',
  validation_score integer not null default 0 check(validation_score between 0 and 100),
  admin_notes text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  validated_at timestamptz,
  validated_by uuid references public.profiles(id) on delete set null
);

create table public.submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  field_id uuid not null references public.form_fields(id) on delete cascade,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(submission_id, field_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index forms_status_idx on public.forms(status);
create index forms_created_by_idx on public.forms(created_by);
create index form_fields_form_position_idx on public.form_fields(form_id, position);
create index submissions_form_idx on public.submissions(form_id);
create index submissions_respondent_idx on public.submissions(respondent_id);
create index submissions_validation_idx on public.submissions(validation_status);
create index submissions_submitted_idx on public.submissions(submitted_at desc);
create index answers_submission_idx on public.submission_answers(submission_id);
create index answers_field_idx on public.submission_answers(field_id);
create index audit_entity_idx on public.audit_logs(entity_type, entity_id);
create index audit_created_idx on public.audit_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger forms_updated before update on public.forms for each row execute function public.set_updated_at();
create trigger form_fields_updated before update on public.form_fields for each row execute function public.set_updated_at();
create trigger submissions_updated before update on public.submissions for each row execute function public.set_updated_at();
create trigger submission_answers_updated before update on public.submission_answers for each row execute function public.set_updated_at();

create sequence if not exists public.submission_folio_seq start 1;
create or replace function public.assign_submission_folio()
returns trigger language plpgsql as $$
begin
  if new.folio is null then
    new.folio := 'FIM-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.submission_folio_seq')::text, 6, '0');
  end if;
  return new;
end; $$;
create trigger submissions_folio before insert on public.submissions for each row execute function public.assign_submission_folio();

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id,full_name,email,role)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.email,''), 'respondent')
  on conflict(id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;

alter table public.profiles enable row level security;
alter table public.forms enable row level security;
alter table public.form_fields enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_answers enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles
create policy "profiles own select" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "admins profiles all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- Forms
create policy "published forms readable" on public.forms for select using (status='published' or public.is_admin());
create policy "admins forms insert" on public.forms for insert with check (public.is_admin() and created_by=auth.uid());
create policy "admins forms update" on public.forms for update using (public.is_admin()) with check (public.is_admin());
create policy "admins forms delete" on public.forms for delete using (public.is_admin());

-- Fields
create policy "published fields readable" on public.form_fields for select using (
  public.is_admin() or exists(select 1 from public.forms f where f.id=form_id and f.status='published')
);
create policy "admins fields insert" on public.form_fields for insert with check (public.is_admin());
create policy "admins fields update" on public.form_fields for update using (public.is_admin()) with check (public.is_admin());
create policy "admins fields delete" on public.form_fields for delete using (public.is_admin());

-- Submissions
create policy "own submissions readable" on public.submissions for select using (respondent_id=auth.uid() or public.is_admin());
create policy "respondent submission insert" on public.submissions for insert with check (
  respondent_id=auth.uid() and exists(select 1 from public.forms f where f.id=form_id and f.status='published')
);
create policy "admin submissions update" on public.submissions for update using (public.is_admin()) with check (public.is_admin());
create policy "admin submissions delete" on public.submissions for delete using (public.is_admin());

-- Answers
create policy "own answers readable" on public.submission_answers for select using (
  public.is_admin() or exists(select 1 from public.submissions s where s.id=submission_id and s.respondent_id=auth.uid())
);
create policy "own answers insert" on public.submission_answers for insert with check (
  exists(select 1 from public.submissions s where s.id=submission_id and s.respondent_id=auth.uid())
);
create policy "admin answers update" on public.submission_answers for update using (public.is_admin()) with check(public.is_admin());
create policy "admin answers delete" on public.submission_answers for delete using(public.is_admin());

-- Audit
create policy "admin audit read" on public.audit_logs for select using(public.is_admin());
create policy "admin audit insert" on public.audit_logs for insert with check(public.is_admin());

-- Storage bucket: private, signed URLs only
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('form-uploads','form-uploads',false,10485760,array[
  'image/jpeg','image/png','application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]) on conflict(id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

-- Storage path convention: <userId>/<formId>/<uuid>-filename
create policy "authenticated upload own prefix" on storage.objects for insert to authenticated
with check(bucket_id='form-uploads' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "authenticated read own prefix" on storage.objects for select to authenticated
using(bucket_id='form-uploads' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));
create policy "authenticated delete own prefix" on storage.objects for delete to authenticated
using(bucket_id='form-uploads' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));
