-- Blacklist is retired in favour of one clear administrator-controlled state:
-- Active or Inactive. Preserve every previously restricted account by mapping
-- it to Inactive before the application stops reading blacklist fields.
update public.profiles
set
  is_active = false,
  deactivated_at = coalesce(deactivated_at, blacklisted_at, now())
where is_blacklisted = true
  and is_active = true;
