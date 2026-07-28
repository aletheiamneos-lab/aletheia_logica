create extension if not exists pgcrypto;

create table if not exists public.bac_student_reports (
    id uuid primary key default gen_random_uuid(),
    student_email text not null default '',
    student_name text not null default '',
    submitted_at timestamptz not null default now(),
    score_percent integer not null default 0,
    payload jsonb not null,
    pdf_storage_path text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists bac_student_reports_submitted_idx
    on public.bac_student_reports (submitted_at desc);
create index if not exists bac_student_reports_email_idx
    on public.bac_student_reports (lower(student_email), submitted_at desc);

create table if not exists public.admitere_student_reports (
    id uuid primary key default gen_random_uuid(),
    student_email text not null default '',
    student_name text not null default '',
    submitted_at timestamptz not null default now(),
    score_percent integer not null default 0,
    payload jsonb not null,
    pdf_storage_path text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists admitere_student_reports_submitted_idx
    on public.admitere_student_reports (submitted_at desc);
create index if not exists admitere_student_reports_email_idx
    on public.admitere_student_reports (lower(student_email), submitted_at desc);

alter table public.bac_student_reports enable row level security;
alter table public.admitere_student_reports enable row level security;

grant all on table public.bac_student_reports to service_role;
grant all on table public.admitere_student_reports to service_role;

-- Bucket privat: toate descarcarile trec prin backend si sunt autorizate acolo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'generated-reports',
    'generated-reports',
    false,
    52428800,
    array['application/pdf', 'application/json', 'text/html', 'text/csv']
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
