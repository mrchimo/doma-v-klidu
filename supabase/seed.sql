insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  phone_change_token,
  email_change_token_current,
  reauthentication_token,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@domavklidu.cz', crypt('password123', gen_salt('bf')), now(), '', '', '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Doma v klidu","role":"admin"}'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'eva@demo.cz', crypt('password123', gen_salt('bf')), now(), '', '', '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Eva Novotná","role":"owner"}'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'petr@demo.cz', crypt('password123', gen_salt('bf')), now(), '', '', '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Petr Svoboda","role":"owner"}'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lucie@demo.cz', crypt('password123', gen_salt('bf')), now(), '', '', '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lucie Horáková","role":"owner"}'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'anna@demo.cz', crypt('password123', gen_salt('bf')), now(), '', '', '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Anna Dvořáková","role":"sitter"}'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marek@demo.cz', crypt('password123', gen_salt('bf')), now(), '', '', '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marek Procházka","role":"sitter"}'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tereza@demo.cz', crypt('password123', gen_salt('bf')), now(), '', '', '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tereza Malá","role":"sitter"}'),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jakub@demo.cz', crypt('password123', gen_salt('bf')), now(), '', '', '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jakub Král","role":"sitter"}'),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sara@demo.cz', crypt('password123', gen_salt('bf')), now(), '', '', '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sára Fialová","role":"professional"}')
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(),
  u.id,
  u.id::text,
  'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  now(),
  now(),
  now()
from auth.users u
where u.email in (
  'admin@domavklidu.cz',
  'eva@demo.cz',
  'petr@demo.cz',
  'lucie@demo.cz',
  'anna@demo.cz',
  'marek@demo.cz',
  'tereza@demo.cz',
  'jakub@demo.cz',
  'sara@demo.cz'
)
on conflict (provider_id, provider) do nothing;

insert into public.profiles (id, full_name, role, email, phone, city, neighborhood)
values
  ('00000000-0000-0000-0000-000000000001','Admin Doma v klidu','admin','admin@domavklidu.cz','+420 700 000 001','Praha','Letná'),
  ('00000000-0000-0000-0000-000000000101','Eva Novotná','owner','eva@demo.cz','+420 700 100 101','Praha 7','Letná'),
  ('00000000-0000-0000-0000-000000000102','Petr Svoboda','owner','petr@demo.cz','+420 700 100 102','Praha 3','Vinohrady'),
  ('00000000-0000-0000-0000-000000000103','Lucie Horáková','owner','lucie@demo.cz','+420 700 100 103','Brno-střed','Veveří'),
  ('00000000-0000-0000-0000-000000000201','Anna Dvořáková','sitter','anna@demo.cz','+420 700 200 201','Praha 7','Letná'),
  ('00000000-0000-0000-0000-000000000202','Marek Procházka','sitter','marek@demo.cz','+420 700 200 202','Praha 3','Vinohrady'),
  ('00000000-0000-0000-0000-000000000203','Tereza Malá','sitter','tereza@demo.cz','+420 700 200 203','Olomouc','centrum'),
  ('00000000-0000-0000-0000-000000000204','Jakub Král','sitter','jakub@demo.cz','+420 700 200 204','Zlín','centrum'),
  ('00000000-0000-0000-0000-000000000205','Sára Fialová','professional','sara@demo.cz','+420 700 200 205','Brno-střed','Veveří')
on conflict (id) do update set full_name = excluded.full_name, email = excluded.email;

insert into public.sitter_profiles (user_id, bio, motivation, animal_experience, accepts_dogs, accepts_cats, accepts_small_animals, overnight_stays, daily_visits, dog_walking, emergency_help, medication_experience, senior_pet_experience, puppy_experience, reactive_dog_experience, multiple_pet_experience, rate_range, availability_notes, available_weekends, available_weekday_evenings, available_mornings, available_short_notice, unavailable_until, reference_contact, video_intro_url, phone_verified, reference_checked, video_intro_reviewed, admin_public_note, admin_private_note, approval_status, is_featured)
values
  ('00000000-0000-0000-0000-000000000201','Klidná sitterka z Letné, zvyklá na byty i starší kočky.','Chci pomáhat lidem cestovat bez stresu.','10 let péče o kočky a menší psy, zkušenost s léky.', true, true, false, true, true, true, false, true, true, false, false, true, '700-1100 Kč / den', 'Víkendy a všední večery.', true, true, false, false, null, 'Jana P., Praha 7', null, true, true, false, 'Profil a reference zkontrolovány administrátorem.', null, 'approved', true),
  ('00000000-0000-0000-0000-000000000202','Spolehlivý sitter pro Vinohrady a okolí, vhodný i na přespání.','Mám rád jasné instrukce a klidný režim zvířat.','Zkušenosti s venčením, reaktivnějšími psy a kontrolou domácnosti.', true, true, false, true, true, true, true, false, false, false, true, true, '800-1300 Kč / den', 'Po domluvě i urgentně.', true, true, true, true, null, 'Klára S., Praha 3', null, true, true, false, 'Ověřený profil se zkušeností s přespáním a citlivějšími psy.', null, 'approved', false),
  ('00000000-0000-0000-0000-000000000203','Pečlivá sitterka v Olomouci.','Hlídání beru jako důvěru, ne jen úkol.','Kočky, drobná zvířata, rostliny a pošta.', false, true, true, false, true, false, false, false, true, false, false, false, '500-800 Kč / den', 'Odpoledne a víkendy.', true, false, false, false, null, null, null, false, false, false, null, 'Čeká na reference.', 'pending_approval', false),
  ('00000000-0000-0000-0000-000000000204','Student ve Zlíně, dostupný na venčení.','Chci získat další reference.','Psi v rodině, základní venčení.', true, false, false, false, true, true, false, false, false, true, false, false, '300-600 Kč / den', 'Všední dny po 16:00.', false, true, false, false, null, null, null, false, false, false, null, null, 'pending_approval', false),
  ('00000000-0000-0000-0000-000000000205','Profesionální pečovatelka v Brně.','Specializuji se na náročnější péči.','Senioři, léky, více zvířat, citlivější psi.', true, true, true, true, true, true, true, true, true, false, true, true, '1200-1800 Kč / den', 'Dle kapacity.', false, false, true, true, '2026-06-15', 'Veterinární klinika Brno', null, true, true, false, null, 'Zamítnuto pro MVP seed kvůli ukázce administrátorského stavu.', 'rejected', false)
on conflict (user_id) do nothing;

insert into public.households (id, owner_id, name, city, neighborhood, household_type, has_plants, has_mail_pickup, has_alarm, has_cameras, parking_notes, house_rules, access_notes)
values
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','Byt u Stromovky','Praha 7','Letná','apartment',true,true,false,false,'Modrá zóna, víkend volnější.','Nepouštět kočku na balkon bez dozoru.','Klíče přes keybox po potvrzení.'),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000102','Vinohradský byt','Praha 3','Vinohrady','apartment',true,false,true,false,'Parkování obtížné.','Pes nesmí na gauč.','Předání osobně.'),
  ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000103','Dům u parku','Brno-střed','Veveří','house',true,true,true,true,'Místo před domem.','Zamykat zahradní branku.','Instrukce po výběru sittera.'),
  ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000101','Garsonka rodičů','Olomouc','centrum','apartment',false,true,false,false,'Bez parkování.','Jen kontrola pošty a kočky.','Sousedka má náhradní klíče.')
on conflict (id) do nothing;

insert into public.pets (id, owner_id, household_id, name, species, breed, age, size, temperament, feeding_instructions, medication, allergies, fears, behavior_people, behavior_animals, veterinarian_contact, emergency_contact, never_do)
values
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','10000000-0000-0000-0000-000000000001','Mína','cat','evropská','6 let','malá','klidná, opatrná','Ráno a večer kapsička, granule dosypat.','Ne','Ne','vysavač','potřebuje čas','ostatní zvířata nemusí','Vet Letná +420 222 000 001','Eva +420 700 100 101','Nebrát ven.'),
  ('20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000102','10000000-0000-0000-0000-000000000002','Baryk','dog','kříženec','9 let','střední','citlivý senior','2x denně, po jídle klid.','Tableta večer.','Kuřecí maso','bouřka','lidi má rád','psy vybíravě','Vet Vinohrady +420 222 000 002','Petr +420 700 100 102','Nepouštět z vodítka.'),
  ('20000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000103','10000000-0000-0000-0000-000000000003','Rony','dog','border kolie','4 roky','střední','aktivní','Ráno a večer granule.','Ne','Ne','ohňostroj','přátelský','s fenami ok','Vet Brno +420 222 000 003','Lucie +420 700 100 103','Nenechat běhat u silnice.'),
  ('20000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000103','10000000-0000-0000-0000-000000000003','Lola','cat','britská','3 roky','malá','samostatná','Granule a voda.','Ne','Ne','cizí psi','spíš pozoruje','kočky ok','Vet Brno +420 222 000 003','Lucie +420 700 100 103','Nerušit při spaní.'),
  ('20000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000101','10000000-0000-0000-0000-000000000004','Kocour','cat','mourovatý','11 let','střední','mazlivý senior','Mokré krmivo večer.','Kapky do očí.','Ne','prudké pohyby','mazlivý','neznámá zvířata ne','Vet Olomouc +420 222 000 004','Eva +420 700 100 101','Nedávat mléko.'),
  ('20000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000102','10000000-0000-0000-0000-000000000002','Nora','cat','sibiřská','2 roky','malá','hravá','Granule, voda, toaleta.','Ne','Ne','zavřené dveře','rychle si zvyká','psy ne','Vet Vinohrady +420 222 000 002','Petr +420 700 100 102','Nenechat otevřené okno.')
on conflict (id) do nothing;

insert into public.house_sitting_requests (id, owner_id, household_id, title, start_date, end_date, sitting_type, preferred_time_windows, tasks, sitter_requirements, budget_range, notes, urgency, status)
values
  ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','10000000-0000-0000-0000-000000000001','Mína doma během víkendu','2026-06-12','2026-06-14','daily_visits','Ráno 8-10, večer 18-20',array['feeding','litter_box','watering_plants','mail'],array['cats'],'700-900 Kč / den','Klidná kočka, stačí dvě návštěvy denně.','normal','open'),
  ('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000102','10000000-0000-0000-0000-000000000002','Baryk potřebuje přespání','2026-07-03','2026-07-08','overnight',null,array['feeding','walking','medication','safety_check'],array['dogs','medication','overnight','reactive_animals'],'1000-1400 Kč / den','Starší pes, večer lék a krátké procházky.','normal','open'),
  ('30000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000103','10000000-0000-0000-0000-000000000003','Dům v Brně na služební cestu','2026-06-01','2026-06-04','overnight','Večer nutná procházka',array['feeding','walking','watering_plants','safety_check'],array['dogs','cats','overnight'],'1200-1600 Kč / den','Pes a kočka, plus kontrola zahrady.','urgent','open'),
  ('30000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000101','10000000-0000-0000-0000-000000000004','Olomouc kontrola kocoura','2026-08-10','2026-08-17','daily_visits','Večer',array['feeding','litter_box','mail'],array['cats','medication'],'500-800 Kč / den','Kapky do očí obden.','normal','matched')
on conflict (id) do nothing;

insert into public.request_pets (request_id, pet_id)
values
  ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003'),
  ('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000004'),
  ('30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000005')
on conflict do nothing;

insert into public.handover_checklist_items (id, request_id, owner_id, title, details, category, is_required, sort_order)
values
  ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','Krmení Míny ráno a večer','Kapsička ráno a večer, granule dosypat podle misky.','pet_care',true,10),
  ('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','Vyčistit kočičí toaletu','Jednou denně vybrat hrudky a zkontrolovat, že je kolem čisto.','pet_care',true,20),
  ('40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','Zkontrolovat balkon a okna','Mínu nepouštět na balkon bez dozoru. Před odchodem zavřít okna.','safety',true,30),
  ('40000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000102','Večerní tableta pro Baryka','Tabletu podat po krmení, potom nechat klidový režim.','pet_care',true,10),
  ('40000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000102','Krátké procházky pouze na vodítku','Baryka nepouštět z vodítka a vyhnout se rušným psím místům.','pet_care',true,20),
  ('40000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000102','Zamknout a zapnout alarm','Před spaním a při odchodu zkontrolovat dveře a alarm.','safety',true,30),
  ('40000000-0000-0000-0000-000000000007','30000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000103','Večerní procházka Ronyho','Delší procházka kolem parku, mimo rušnou silnici.','pet_care',true,10),
  ('40000000-0000-0000-0000-000000000008','30000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000103','Zkontrolovat zahradní branku','Po každém příchodu a odchodu ověřit, že je branka zavřená.','safety',true,20),
  ('40000000-0000-0000-0000-000000000009','30000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000101','Kapky do očí obden','Podat podle instrukcí u léků, po aplikaci dát odměnu.','pet_care',true,10),
  ('40000000-0000-0000-0000-000000000010','30000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000101','Vybrat poštu','Schránka je u vstupu, poštu položit na kuchyňský stůl.','plants_mail',false,20)
on conflict (id) do nothing;

insert into public.sitter_requests (request_id, owner_id, sitter_id, message, status, sitter_response)
values
  ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000201','Hodilo by se vám přijít dvakrát denně?', 'accepted', 'Ano, jsem kousek od vás a časově to zvládnu.'),
  ('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000202','Baryk potřebuje klidný režim a lék večer.', 'sent', null),
  ('30000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000103','00000000-0000-0000-0000-000000000201','Je to urgentní, zvládnete přespání?', 'declined', 'Bohužel jsem ten termín mimo Prahu.'),
  ('30000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000203','Olomouc, večerní návštěvy.', 'sent', null)
on conflict do nothing;

insert into public.sitting_agreements (id, request_id, sitter_request_id, owner_id, sitter_id, owner_note, status)
select
  '50000000-0000-0000-0000-000000000001',
  sr.request_id,
  sr.id,
  sr.owner_id,
  sr.sitter_id,
  'Domluveno na dvě denní návštěvy. Klíče předáme osobně den před odjezdem.',
  'confirmed'
from public.sitter_requests sr
where sr.request_id = '30000000-0000-0000-0000-000000000001'
and sr.sitter_id = '00000000-0000-0000-0000-000000000201'
on conflict do nothing;

update public.house_sitting_requests
set status = 'matched'
where id = '30000000-0000-0000-0000-000000000001'
and exists (
  select 1
  from public.sitting_agreements sa
  where sa.request_id = public.house_sitting_requests.id
);

insert into public.trust_badges (sitter_id, badge_type, label, verified_at)
values
  ('00000000-0000-0000-0000-000000000201','email','ověřený e-mail', now()),
  ('00000000-0000-0000-0000-000000000201','admin_approved','schválený sitter', now()),
  ('00000000-0000-0000-0000-000000000202','email','ověřený e-mail', now()),
  ('00000000-0000-0000-0000-000000000202','admin_approved','schválený sitter', now())
on conflict do nothing;
