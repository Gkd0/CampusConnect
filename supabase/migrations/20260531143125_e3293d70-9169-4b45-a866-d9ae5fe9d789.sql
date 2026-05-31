
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_conversation_last_message() from public, anon, authenticated;
revoke execute on function public.is_conversation_participant(uuid, uuid) from public, anon;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
