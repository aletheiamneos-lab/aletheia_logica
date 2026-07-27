create or replace function public.get_database_usage()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'database_size_bytes',
    pg_database_size(current_database()),
    'public_tables_size_bytes',
    coalesce(
      (
        select sum(pg_total_relation_size(format('%I.%I', schemaname, tablename)::regclass))
        from pg_tables
        where schemaname = 'public'
      ),
      0
    )
  );
$$;

revoke all on function public.get_database_usage() from public;
revoke all on function public.get_database_usage() from anon;
revoke all on function public.get_database_usage() from authenticated;
grant execute on function public.get_database_usage() to service_role;

comment on function public.get_database_usage() is
  'Returns database usage metrics for the backend-only Supabase Free plan dashboard.';
