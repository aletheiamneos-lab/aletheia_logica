create extension if not exists pgcrypto;

create table if not exists public.allowed_students (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    name text not null,
    is_blocked boolean not null default false,
    force_logout boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.allowed_students
    add column if not exists force_logout boolean not null default false;

create unique index if not exists allowed_students_email_lower_unique
    on public.allowed_students (lower(email));

alter table public.allowed_students enable row level security;

-- Tabelul ramane inaccesibil cheii anon. Backend-ul foloseste exclusiv cheia
-- server-side (service role), care nu este expusa niciodata in browser.
