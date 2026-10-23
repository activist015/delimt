-- The public landing page needs totals, not customer email addresses.
lock table public.waitlist in share row exclusive mode;

create table if not exists public.waitlist_stats (
  singleton boolean primary key default true check (singleton),
  total bigint not null default 0 check (total >= 0),
  founding bigint not null default 0 check (founding >= 0 and founding <= total)
);
insert into public.waitlist_stats (singleton,total,founding)
select true,count(*),count(*) filter (where tier='founding') from public.waitlist
on conflict (singleton) do update set total=excluded.total,founding=excluded.founding;

alter table public.waitlist_stats enable row level security;
revoke all privileges on table public.waitlist_stats from public,anon,authenticated;
revoke all privileges (singleton,total,founding) on table public.waitlist_stats from public,anon,authenticated;
grant select on table public.waitlist_stats to anon,authenticated;
drop policy if exists delimt_public_waitlist_totals on public.waitlist_stats;
create policy delimt_public_waitlist_totals on public.waitlist_stats
for select to anon,authenticated using (true);

create or replace function delimt_private.update_waitlist_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  total_delta integer := 0;
  founding_delta integer := 0;
begin
  if tg_op='INSERT' then
    total_delta:=1;
    founding_delta:=case when new.tier='founding' then 1 else 0 end;
  elsif tg_op='DELETE' then
    total_delta:=-1;
    founding_delta:=case when old.tier='founding' then -1 else 0 end;
  else
    founding_delta:=(case when new.tier='founding' then 1 else 0 end)
                   -(case when old.tier='founding' then 1 else 0 end);
  end if;
  update public.waitlist_stats
  set total=total+total_delta,founding=founding+founding_delta
  where singleton=true;
  if not found then
    raise exception 'The public signup totals row is missing';
  end if;
  return null;
end;
$function$;
revoke all on function delimt_private.update_waitlist_stats() from public,anon,authenticated,service_role;
drop trigger if exists delimt_update_waitlist_stats on public.waitlist;
create trigger delimt_update_waitlist_stats
after insert or update of tier or delete on public.waitlist
for each row execute function delimt_private.update_waitlist_stats();

create or replace function delimt_private.reset_waitlist_stats()
returns trigger language plpgsql security definer set search_path='' as $function$
begin
  update public.waitlist_stats set total=0,founding=0 where singleton=true;
  return null;
end;
$function$;
revoke all on function delimt_private.reset_waitlist_stats() from public,anon,authenticated,service_role;
drop trigger if exists delimt_reset_waitlist_stats on public.waitlist;
create trigger delimt_reset_waitlist_stats after truncate on public.waitlist
for each statement execute function delimt_private.reset_waitlist_stats();

do $policies$
begin
  if exists(select 1 from pg_policies
    where schemaname='public' and tablename='waitlist'
    and policyname not in ('Allow public insert','Allow public select','Allow public update','delimt_waitlist_submit')) then
    raise exception 'Unexpected waitlist policy; review it before applying this migration';
  end if;
end
$policies$;

alter table public.waitlist enable row level security;
drop policy if exists "Allow public insert" on public.waitlist;
drop policy if exists "Allow public select" on public.waitlist;
drop policy if exists "Allow public update" on public.waitlist;
drop policy if exists delimt_waitlist_submit on public.waitlist;
revoke all privileges on table public.waitlist from public,anon,authenticated;
revoke all privileges (id,email,referral_code,referred_by,referral_count,tier,position,created_at,email_day3_sent,email_day7_sent)
on table public.waitlist from public,anon,authenticated;

-- Preserve the deployed landing page's INSERT-only checkout record. These
-- entries are leads/records, never proof of payment or access entitlements.
grant insert (email,referral_code,referred_by,tier,position) on table public.waitlist to anon,authenticated;
create policy delimt_waitlist_submit on public.waitlist
for insert to anon,authenticated
with check (
  email is not null and char_length(email) <= 320
  and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  and char_length(referral_code) between 1 and 256
  and referral_code !~ '[[:cntrl:]]'
  and tier in ('free','founding')
  and coalesce(referral_count,0)=0
  and coalesce(position,0)>=0
  and email_day3_sent is not true and email_day7_sent is not true
);
comment on table public.waitlist_stats is
'Public aggregate signup totals only. Customer rows remain private in waitlist; private database triggers maintain these counters.';
notify pgrst,'reload schema';

-- Verify the effective roles in the same transaction. Test fixtures roll back.
do $test$
declare
  first_code text := 'security-'||gen_random_uuid()::text;
  second_code text := 'security-'||gen_random_uuid()::text;
  original_total bigint;
  original_founding bigint;
  observed_total bigint;
  observed_founding bigint;
  checks integer:=0;
begin
  select total,founding into original_total,original_founding from public.waitlist_stats where singleton;
  begin
    execute 'set local role anon';
    select total,founding into observed_total,observed_founding from public.waitlist_stats where singleton;
    if observed_total<>original_total or observed_founding<>original_founding then
      raise exception 'Public signup totals are unavailable';
    end if;
    checks:=checks+1;
    begin
      perform email from public.waitlist;
      raise exception 'Anonymous clients can read customer addresses';
    exception when insufficient_privilege then checks:=checks+1; end;
    begin
      update public.waitlist set referral_count=9999;
      raise exception 'Anonymous clients can change waitlist records';
    exception when insufficient_privilege then checks:=checks+1; end;
    begin
      delete from public.waitlist;
      raise exception 'Anonymous clients can delete waitlist records';
    exception when insufficient_privilege then checks:=checks+1; end;
    begin
      update public.waitlist_stats set founding=0;
      raise exception 'Anonymous clients can forge signup totals';
    exception when insufficient_privilege then checks:=checks+1; end;
    insert into public.waitlist(email,referral_code,tier,position)
    values(first_code||'@example.invalid',first_code,'founding',0);
    checks:=checks+1;
    select total,founding into observed_total,observed_founding from public.waitlist_stats where singleton;
    if observed_total<>original_total+1 or observed_founding<>original_founding+1 then
      raise exception 'An existing INSERT-only checkout record did not update public totals';
    end if;
    checks:=checks+1;
    begin
      insert into public.waitlist(email,referral_code,tier,position)
      values(second_code||'@example.invalid',second_code,'lifetime',0);
      raise exception 'A client granted itself a reward tier';
    exception when insufficient_privilege then checks:=checks+1; end;
    begin
      insert into public.waitlist(email,referral_code,tier,position,referral_count)
      values(second_code||'@example.invalid',second_code,'free',0,9999);
      raise exception 'A client inserted an arbitrary referral count';
    exception when insufficient_privilege then checks:=checks+1; end;
    begin
      insert into public.waitlist(email,referral_code,tier,position)
      values('invalid-address',second_code,'free',0);
      raise exception 'A malformed address passed validation';
    exception when insufficient_privilege then checks:=checks+1; end;
    execute 'reset role';
    execute 'set local role authenticated';
    begin
      perform email from public.waitlist;
      raise exception 'A signed-in client can read customer addresses';
    exception when insufficient_privilege then checks:=checks+1; end;
    begin
      update public.waitlist set tier='lifetime';
      raise exception 'A signed-in client can edit customer rows';
    exception when insufficient_privilege then checks:=checks+1; end;
    insert into public.waitlist(email,referral_code,tier,position)
    values(second_code||'@example.invalid',second_code,'free',1);
    checks:=checks+1;
    execute 'reset role';
    update public.waitlist set tier='free' where referral_code=first_code;
    select total,founding into observed_total,observed_founding from public.waitlist_stats where singleton;
    if observed_total<>original_total+2 or observed_founding<>original_founding then
      raise exception 'A server tier update did not adjust public totals';
    end if;
    checks:=checks+1;
    delete from public.waitlist where referral_code=first_code;
    select total into observed_total from public.waitlist_stats where singleton;
    if observed_total<>original_total+1 then raise exception 'A server deletion did not adjust totals'; end if;
    checks:=checks+1;
    raise sqlstate 'ZX002' using message='Rollback only synthetic waitlist fixtures';
  exception when sqlstate 'ZX002' then null;
  end;
  if exists(select 1 from public.waitlist where referral_code in(first_code,second_code)) then
    raise exception 'A synthetic waitlist row was not rolled back';
  end if;
  select total,founding into observed_total,observed_founding from public.waitlist_stats where singleton;
  if observed_total<>original_total or observed_founding<>original_founding then
    raise exception 'Test signup counts were not rolled back';
  end if;
  checks:=checks+1;
  perform set_config('delimt.waitlist_security_checks',checks::text,true);
end
$test$;
select current_setting('delimt.waitlist_security_checks')::integer as passed_waitlist_security_checks;
