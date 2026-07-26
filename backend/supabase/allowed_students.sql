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

-- Migrare nedistructiva pentru tabelul creat anterior cu denumirea romaneasca.
do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'allowed_students'
          and column_name = 'nume'
    ) and not exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'allowed_students'
          and column_name = 'name'
    ) then
        alter table public.allowed_students rename column nume to name;
    end if;
end
$$;

alter table public.allowed_students
    add column if not exists id uuid default gen_random_uuid(),
    add column if not exists created_at timestamptz default now(),
    add column if not exists updated_at timestamptz default now();

-- Completeaza doar eventualele valori lipsa; randurile existente sunt pastrate.
update public.allowed_students
set id = gen_random_uuid()
where id is null;

update public.allowed_students
set created_at = now()
where created_at is null;

update public.allowed_students
set updated_at = now()
where updated_at is null;

alter table public.allowed_students
    alter column id set default gen_random_uuid(),
    alter column id set not null,
    alter column created_at set default now(),
    alter column created_at set not null,
    alter column updated_at set default now(),
    alter column updated_at set not null;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'public.allowed_students'::regclass
          and contype = 'p'
    ) then
        alter table public.allowed_students
            add constraint allowed_students_pkey primary key (id);
    end if;
end
$$;

create unique index if not exists allowed_students_email_lower_unique
    on public.allowed_students (lower(email));

alter table public.allowed_students enable row level security;

create or replace function public.set_allowed_students_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists allowed_students_set_updated_at
    on public.allowed_students;

create trigger allowed_students_set_updated_at
before update on public.allowed_students
for each row
execute function public.set_allowed_students_updated_at();

-- Tabelul ramane inaccesibil cheii anon. Backend-ul foloseste exclusiv cheia
-- server-side (service role), care nu este expusa niciodata in browser.
