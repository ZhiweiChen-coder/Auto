-- Credit ledger for the open (hosted) deployment.
-- Run this once in the Supabase SQL editor (or via `supabase db` migrations).
--
-- The app talks to these via the service-role key from the server only, so RLS
-- is left disabled here; if you expose the table to anon/auth roles, enable RLS
-- and add policies first.

create table if not exists public.credits (
  user_id    text primary key,
  remaining  integer not null default 30,
  updated_at timestamptz not null default now()
);

-- Ensure a row exists (granting the free allowance on first touch) and return
-- the current balance. Atomic via INSERT ... ON CONFLICT.
create or replace function public.ensure_credits(p_user_id text, p_grant integer)
returns integer
language plpgsql
as $$
declare
  r integer;
begin
  insert into public.credits (user_id, remaining)
    values (p_user_id, p_grant)
    on conflict (user_id) do nothing;
  select remaining into r from public.credits where user_id = p_user_id;
  return r;
end;
$$;

-- Deduct credits atomically and return the new balance. Returns NULL when the
-- user has fewer than p_cost credits, so the app can fail closed instead of
-- silently flooring the account after an under-funded request.
-- Upserts the free grant first so a brand-new user is handled in one call.
create or replace function public.consume_credits(
  p_user_id text,
  p_cost integer,
  p_grant integer
)
returns integer
language plpgsql
as $$
declare
  r integer;
begin
  insert into public.credits (user_id, remaining)
    values (p_user_id, p_grant)
    on conflict (user_id) do nothing;
  update public.credits
    set remaining = remaining - p_cost,
        updated_at = now()
    where user_id = p_user_id
      and remaining >= p_cost
    returning remaining into r;
  return r;
end;
$$;

-- Stripe top-up (used later by the payment webhook): add credits atomically.
create or replace function public.add_credits(p_user_id text, p_amount integer)
returns integer
language plpgsql
as $$
declare
  r integer;
begin
  insert into public.credits (user_id, remaining)
    values (p_user_id, p_amount)
    on conflict (user_id)
    do update set remaining = public.credits.remaining + p_amount,
                  updated_at = now()
    returning remaining into r;
  return r;
end;
$$;
