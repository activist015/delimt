-- Profiles are private account data. A referral claim is a request to credit
-- an existing invitation, never permission to read or edit that inviter.
create schema if not exists delimt_private;
revoke all on schema delimt_private from public, anon, authenticated;

-- Moving the trigger function preserves the existing auth.users trigger's OID
-- dependency. There is no public RPC for creating or updating other profiles.
do $migration$
begin
  if to_regprocedure('public.handle_new_user()') is not null then
    if to_regprocedure('delimt_private.handle_new_user()') is not null then
      raise exception 'Both old and private signup trigger functions exist; review before proceeding';
    end if;
    alter function public.handle_new_user() set schema delimt_private;
  end if;
end
$migration$;

create or replace function delimt_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, email, name, created_at, referral_code, referred_by)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''), 60),
    coalesce(new.created_at, now()),
    substring(new.id::text, 1, 8),
    nullif(btrim(new.raw_user_meta_data ->> 'referred_by'), '')
  );
  return new;
end;
$function$;
revoke all on function delimt_private.handle_new_user() from public, anon, authenticated, service_role;

create or replace function delimt_private.credit_profile_referral()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  inviter_id uuid;
begin
  if tg_op = 'UPDATE' then
    -- RLS also checks this. Keep an explicit owner check inside the privileged
    -- trigger when the originating request is a browser/mobile client.
    if current_setting('role', true) in ('anon', 'authenticated')
       and (select auth.uid()) is distinct from new.id then
      raise exception using errcode = '42501', message = 'A referral can only be claimed for your own profile';
    end if;
    if new.referred_by is not distinct from old.referred_by then
      return new;
    end if;
    if nullif(btrim(old.referred_by), '') is not null then
      raise exception using errcode = '23514', message = 'A referral has already been assigned to this account';
    end if;
  end if;

  new.referred_by := nullif(btrim(new.referred_by), '');
  if new.referred_by is null then
    return new;
  end if;

  if new.referred_by ~ '^[A-Za-z0-9_-]{1,128}$' then
    -- UPDATE ... + 1 is atomic under concurrent claims. The outer profile row
    -- lock and immutable referred_by prevent the same account being counted
    -- twice. Inviter accounts must predate the joining account.
    update public.profiles as inviter
       set referral_count = coalesce(inviter.referral_count, 0) + 1
     where inviter.referral_code = new.referred_by
       and inviter.id <> new.id
       and coalesce(inviter.created_at, '-infinity'::timestamp) <= coalesce(new.created_at, now()::timestamp)
    returning inviter.id into inviter_id;
    if found then
      return new;
    end if;
  end if;

  if tg_op = 'INSERT' then
    -- Untrusted signup metadata must never prevent account creation.
    new.referred_by := null;
    return new;
  end if;
  raise exception using errcode = '22023', message = 'This invitation cannot be assigned to your account';
end;
$function$;
revoke all on function delimt_private.credit_profile_referral() from public, anon, authenticated, service_role;

drop trigger if exists delimt_credit_profile_referral on public.profiles;
create trigger delimt_credit_profile_referral
before insert or update of referred_by on public.profiles
for each row execute function delimt_private.credit_profile_referral();

-- Avoid silently retaining an unrelated permissive policy added meanwhile.
do $policies$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname not in (
        'Users can view own profile', 'Users can update own profile',
        'Anyone can read referral codes', 'Allow referral count updates',
        'delimt_profiles_select_own', 'delimt_profiles_update_own'
      )
  ) then
    raise exception 'Unexpected profiles policy; review it before applying this migration';
  end if;
end
$policies$;

alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Anyone can read referral codes" on public.profiles;
drop policy if exists "Allow referral count updates" on public.profiles;
drop policy if exists delimt_profiles_select_own on public.profiles;
drop policy if exists delimt_profiles_update_own on public.profiles;
create policy delimt_profiles_select_own on public.profiles
for select to authenticated
using ((select auth.uid()) = id);
create policy delimt_profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Table grants and any independent column grants must both be removed.
revoke all privileges on table public.profiles from public, anon, authenticated;
revoke all privileges (id, email, name, created_at, referral_code, referred_by, referral_count, welcome_email_sent)
on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (name, referred_by, welcome_email_sent) on table public.profiles to authenticated;

comment on function delimt_private.credit_profile_referral() is
'Private trigger: validate one self-owned referral claim and atomically credit its inviter; clients cannot write counters.';

-- Verify the effective roles in the same transaction. Test fixtures roll back.
-- Synthetic users and their rows are rolled back in a subtransaction.
-- No Auth API requests, real accounts, tokens, or email sends are involved.
do $test$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  c uuid := gen_random_uuid();
  d uuid := gen_random_uuid();
  e uuid := gen_random_uuid();
  acode text := substring(a::text,1,8);
  ccode text := substring(c::text,1,8);
  rows_seen integer;
  changed integer;
  checks integer := 0;
begin
  begin
    insert into auth.users (id,email,created_at,raw_user_meta_data) values
      (a,'security-'||a::text||'@example.invalid',now()-interval '5 days','{"name":"Test inviter"}'::jsonb),
      (c,'security-'||c::text||'@example.invalid',now()-interval '4 days','{}'::jsonb),
      (b,'security-'||b::text||'@example.invalid',now()-interval '3 days','{}'::jsonb);
    if (select name from public.profiles where id=a) <> 'Test inviter' then
      raise exception 'Signup metadata name was not preserved';
    end if;
    checks := checks+1;
    if to_regprocedure('public.handle_new_user()') is not null then
      raise exception 'Signup trigger function remains in the public API schema';
    end if;
    checks := checks+1;
    if has_schema_privilege('anon','delimt_private','USAGE')
       or has_function_privilege('anon','delimt_private.handle_new_user()','EXECUTE')
       or has_function_privilege('authenticated','delimt_private.credit_profile_referral()','EXECUTE') then
      raise exception 'A client can execute a private privileged trigger function';
    end if;
    checks := checks+1;

    perform set_config('request.jwt.claim.sub',a::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    select count(*) into rows_seen from public.profiles where id in (a,b,c);
    if rows_seen<>1 then raise exception 'User A can read another user profile'; end if;
    checks := checks+1;
    update public.profiles set name='My own edit' where id=a;
    get diagnostics changed=row_count;
    if changed<>1 then raise exception 'User A cannot edit their own name'; end if;
    checks := checks+1;
    update public.profiles set name='Unauthorized edit' where id=b;
    get diagnostics changed=row_count;
    if changed<>0 then raise exception 'User A edited User B'; end if;
    checks := checks+1;
    begin
      update public.profiles set referral_count=9999 where id=a;
      raise exception 'Client counter changes were accepted';
    exception when insufficient_privilege then checks:=checks+1; end;
    begin
      update public.profiles set id=gen_random_uuid() where id=a;
      raise exception 'Client ownership changes were accepted';
    exception when insufficient_privilege then checks:=checks+1; end;
    begin
      update public.profiles set referral_code='replacement' where id=a;
      raise exception 'Client referral-code changes were accepted';
    exception when insufficient_privilege then checks:=checks+1; end;
    begin
      update public.profiles set email='replacement@example.invalid' where id=a;
      raise exception 'Client email changes were accepted';
    exception when insufficient_privilege then checks:=checks+1; end;
    begin
      delete from public.profiles where id=a;
      raise exception 'Direct client profile deletion was accepted';
    exception when insufficient_privilege then checks:=checks+1; end;
    begin
      insert into public.profiles(id) values(gen_random_uuid());
      raise exception 'Direct client profile insertion was accepted';
    exception when insufficient_privilege then checks:=checks+1; end;
    update public.profiles set welcome_email_sent=true where id=a;
    if not (select welcome_email_sent from public.profiles where id=a) then
      raise exception 'Existing owner welcome marker no longer works';
    end if;
    checks := checks+1;
    execute 'reset role';

    perform set_config('request.jwt.claim.sub',b::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    select count(*) into rows_seen from public.profiles where id in(a,b,c);
    if rows_seen<>1 then raise exception 'User B can read another user profile'; end if;
    checks:=checks+1;
    update public.profiles set referred_by=acode where id=b;
    update public.profiles set referred_by=acode where id=b;
    checks:=checks+1;
    -- The deployed legacy web code tries this lookup after setting its own
    -- claim. It must see no foreign profile; the trigger already credited A.
    select count(*) into rows_seen from public.profiles where referral_code=acode;
    if rows_seen<>0 then raise exception 'Legacy referral lookup exposed the inviter'; end if;
    checks:=checks+1;
    begin
      update public.profiles set referred_by=ccode where id=b;
      raise exception 'An account was reassigned to another inviter';
    exception when check_violation then checks:=checks+1; end;
    begin
      update public.profiles set referred_by=null where id=b;
      raise exception 'An account cleared its referral to claim another';
    exception when check_violation then checks:=checks+1; end;
    execute 'reset role';
    if (select referral_count from public.profiles where id=a)<>1 then
      raise exception 'A repeated claim was not credited exactly once';
    end if;
    checks:=checks+1;

    perform set_config('request.jwt.claim.sub',c::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',c,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    begin
      update public.profiles set referred_by=ccode where id=c;
      raise exception 'Self-referral was accepted';
    exception when invalid_parameter_value then checks:=checks+1; end;
    begin
      update public.profiles set referred_by='not-a-real-invitation' where id=c;
      raise exception 'An unknown invitation was accepted';
    exception when invalid_parameter_value then checks:=checks+1; end;
    execute 'reset role';

    -- Metadata attribution survives email confirmation: the profile trigger
    -- sees signup metadata without requiring a browser session.
    insert into auth.users(id,email,created_at,raw_user_meta_data) values
      (d,'security-'||d::text||'@example.invalid',now(),jsonb_build_object('name','New signup','referred_by',acode)),
      (e,'security-'||e::text||'@example.invalid',now(),'{"referred_by":"invalid-code"}'::jsonb);
    if (select referred_by from public.profiles where id=d) is distinct from acode
       or (select referral_count from public.profiles where id=a)<>2 then
      raise exception 'Signup metadata did not credit its inviter once';
    end if;
    checks:=checks+1;
    if not exists(select 1 from public.profiles where id=e and referred_by is null) then
      raise exception 'An invalid signup invitation prevented profile creation';
    end if;
    checks:=checks+1;

    perform set_config('request.jwt.claim.sub','',true);
    perform set_config('request.jwt.claims','{}',true);
    execute 'set local role authenticated';
    select count(*) into rows_seen from public.profiles where id in(a,b,c,d,e);
    if rows_seen<>0 then raise exception 'An authenticated role without a user ID can read profiles'; end if;
    checks:=checks+1;
    execute 'reset role';
    execute 'set local role anon';
    begin
      perform 1 from public.profiles;
      raise exception 'Anonymous profile reads were accepted';
    exception when insufficient_privilege then checks:=checks+1; end;
    begin
      update public.profiles set name='Anonymous edit' where id=a;
      raise exception 'Anonymous profile writes were accepted';
    exception when insufficient_privilege then checks:=checks+1; end;
    execute 'reset role';
    raise sqlstate 'ZX001' using message='Rollback only the synthetic test fixtures';
  exception when sqlstate 'ZX001' then
    null;
  end;
  if exists(select 1 from auth.users where id in(a,b,c,d,e))
     or exists(select 1 from public.profiles where id in(a,b,c,d,e)) then
    raise exception 'A test account or profile was not rolled back';
  end if;
  checks:=checks+1;
  perform set_config('delimt.profile_security_checks',checks::text,true);
end
$test$;
select current_setting('delimt.profile_security_checks')::integer as passed_profile_security_checks;
