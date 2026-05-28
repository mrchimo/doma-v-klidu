update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
where email in (
  'admin@domavklidu.cz',
  'eva@demo.cz',
  'petr@demo.cz',
  'lucie@demo.cz',
  'anna@demo.cz',
  'marek@demo.cz',
  'tereza@demo.cz',
  'jakub@demo.cz',
  'sara@demo.cz'
);
