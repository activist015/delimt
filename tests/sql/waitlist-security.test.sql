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
