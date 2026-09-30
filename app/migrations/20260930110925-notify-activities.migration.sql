-- notify activities
--
-- A stage change is logged from inside the deals update handler, a plain sql()
-- write that no view broadcasts. This trigger makes every activity write live,
-- whatever its source, on the deal's own timeline and on the dashboard feed.

create or replace function activitiesNotify() returns trigger
language plpgsql as $$
declare
  r record;
  payload text;
begin
  r := coalesce(new, old);

  payload := json_build_object(
    'op', lower(tg_op),
    'data', json_build_object(
      'id', r.id,
      'dealId', r.dealId,
      'userId', r.userId,
      'kind', r.kind,
      'body', r.body,
      'fromStage', r.fromStage,
      'toStage', r.toStage,
      'createdAt', json_build_object('$type', 'Date', '$value', (extract(epoch from r.createdAt) * 1000)::bigint),
      'authorName', (select name from users where id = r.userId),
      'dealName', (select name from deals where id = r.dealId)
    )
  )::text;

  if octet_length(payload) >= 8000 then
    payload := json_build_object('op', lower(tg_op), 'id', r.id)::text;
  end if;

  perform pg_notify(channel_name('activities'), payload);

  return r;
end;
$$;

create trigger activitiesNotifyTrigger
  after insert or update or delete on activities
  for each row execute function activitiesNotify();
