-- ===========================================================
-- ?? PawMatch Master Seed v1 ? Production Safe & Idempotent
-- ===========================================================
-- Requires:
--   1?? Migration file (tables/enums/extensions) applied.
--   2?? auth.users table contains the 3 UUIDs below.
-- Safe to re-run (uses deterministic IDs + guards).
-- ===========================================================

DO $$
DECLARE
  -- ? Real Supabase Auth UUIDs
  u_breeder uuid := 'c5f922f8-6c50-40a2-912d-a011e5725ce6';
  u_seeker  uuid := '78de48d9-0638-4a98-9e97-a863cbd41d28';
  u_shelter uuid := '0ded84ca-caae-4851-82bb-77bdaf25e1b9';

  -- Deterministic UUID namespace
  ns uuid := '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

  -- Entity IDs
  pet_luna  uuid := '9a1e1111-aaaa-4bbb-8ccc-111111111111';
  pet_max   uuid := '9a1e2222-bbbb-4ccc-8ddd-222222222222';
  pet_misty uuid := '9a1e3333-cccc-4ddd-8eee-333333333333';

  img_luna_1  uuid := '7f111111-1111-4111-8111-111111111111';
  img_max_1   uuid := '7f222222-2222-4222-8222-222222222222';
  img_misty_1 uuid := '7f333333-3333-4333-8333-333333333333';

  lst_luna_live    uuid := '6a111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  lst_misty_urgent uuid := '6a222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  heat_luna uuid := '5a111111-aaaa-4aaa-8a1a-aaaaaaaa0001';
  inter_superlike uuid := '4a111111-aaaa-4aaa-8a2a-aaaaaaaa0001';

  conv_1 uuid := '8a111111-aaaa-4aaa-8a3a-aaaaaaaa0001';
  msg_1  uuid := '8b111111-aaaa-4aaa-8a5a-aaaaaaaa0001';
  msg_2  uuid := '8b222222-bbbb-4bbb-8b5b-bbbbbbbb0002';

  breed_border_collie uuid;
  breed_golden_retriever uuid;
  breed_british_shorthair uuid;

  saved_search_id uuid;
  hr_max_rabies   uuid;
  hr_luna_check   uuid;
BEGIN
  -- Breed lookups
  SELECT id INTO breed_border_collie
  FROM public.breeds WHERE species='dog' AND lower(name)='border collie' LIMIT 1;

  SELECT id INTO breed_golden_retriever
  FROM public.breeds WHERE species='dog' AND lower(name)='golden retriever' LIMIT 1;

  SELECT id INTO breed_british_shorthair
  FROM public.breeds WHERE species='cat' AND lower(name)='british shorthair' LIMIT 1;

  saved_search_id := uuid_generate_v5(ns, 'saved-search:dogs-in-malta:seeker:'||u_seeker::text);
  hr_max_rabies   := uuid_generate_v5(ns, 'health:max:rabies');
  hr_luna_check   := uuid_generate_v5(ns, 'health:luna:annual-check');

  -- =========================================================
  -- PROFILES
  -- =========================================================
  INSERT INTO public.profiles (id, email, full_name, role, country, city)
  VALUES
    (u_breeder, 'breeder@demo.dev', 'Indy Breeder', 'breeder_independent', 'Malta', 'Valletta'),
    (u_seeker,  'seeker@demo.dev',  'Pet Seeker',   'buyer',               'Malta', 'Valletta'),
    (u_shelter, 'shelter@demo.dev', 'Valletta Shelter','shelter',          'Malta', 'Valletta')
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================
  -- PETS
  -- =========================================================
  INSERT INTO public.pets (id, owner_user_id, owner_role, name, species, breed, breed_id, sex, status, city, country, description)
  VALUES
    (pet_luna,  u_breeder, 'breeder_independent', 'Luna',  'dog', 'Border Collie',     breed_border_collie,    'female', 'in_heat',        'Valletta',   'Malta', 'Friendly, athletic, great with kids'),
    (pet_max,   u_breeder, 'breeder_independent', 'Max',   'dog', 'Golden Retriever',  breed_golden_retriever, 'male',   'stud_available', 'Valletta',   'Malta', 'Calm temperament, hip scored'),
    (pet_misty, u_shelter, 'shelter',             'Misty', 'cat', 'British Shorthair', breed_british_shorthair,'female', 'at_risk',        'Birkirkara', 'Malta', 'Gentle house cat; urgent placement needed')
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.pets
     SET at_risk_until = (CURRENT_DATE + INTERVAL '14 days')::date
   WHERE id = pet_misty AND (at_risk_until IS NULL OR at_risk_until < CURRENT_DATE);

  -- =========================================================
  -- PET IMAGES
  -- =========================================================
  INSERT INTO public.pet_images (id, pet_id, url, sort_order)
  VALUES
    (img_luna_1,  pet_luna,  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop', 0),
    (img_max_1,   pet_max,   'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200&auto=format&fit=crop', 0),
    (img_misty_1, pet_misty, 'https://images.unsplash.com/photo-1511300636408-a63a89df3482?q=80&w=1200&auto=format&fit=crop', 0)
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================
  -- HEALTH RECORDS
  -- =========================================================
  INSERT INTO public.health_records (id, pet_id, type, title, date, vet_name)
  SELECT hr_max_rabies, pet_max, 'vaccination', 'Rabies Booster', (CURRENT_DATE - INTERVAL '30 days')::date, 'Dr. Galea'
  WHERE NOT EXISTS (SELECT 1 FROM public.health_records WHERE id = hr_max_rabies);

  INSERT INTO public.health_records (id, pet_id, type, title, date, vet_name)
  SELECT hr_luna_check, pet_luna, 'checkup', 'Annual Health Check', (CURRENT_DATE - INTERVAL '60 days')::date, 'Dr. Galea'
  WHERE NOT EXISTS (SELECT 1 FROM public.health_records WHERE id = hr_luna_check);

  -- =========================================================
  -- BADGE GRANTS
  -- =========================================================
  INSERT INTO public.badge_grants (id, badge_id, pet_id, granted_by_vet, granted_at)
  SELECT uuid_generate_v5(ns,'badge:luna:vet_checked'),
         b.id, pet_luna, u_breeder, now()
    FROM public.badges b
   WHERE b.code='vet_checked'
     AND NOT EXISTS (
       SELECT 1 FROM public.badge_grants g WHERE g.badge_id=b.id AND g.pet_id=pet_luna
     );

  INSERT INTO public.badge_grants (id, badge_id, pet_id, granted_by_vet, granted_at)
  SELECT uuid_generate_v5(ns,'badge:max:vaccinated'),
         b.id, pet_max, u_breeder, now()
    FROM public.badges b
   WHERE b.code='vaccinated'
     AND NOT EXISTS (
       SELECT 1 FROM public.badge_grants g WHERE g.badge_id=b.id AND g.pet_id=pet_max
     );

  -- =========================================================
  -- HEAT CYCLE
  -- =========================================================
  INSERT INTO public.heat_cycles (id, pet_id, heat_start_date, notes)
  VALUES (heat_luna, pet_luna, (CURRENT_DATE - INTERVAL '2 days')::date, 'Logged via seed')
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================
  -- LISTINGS
  -- =========================================================
  INSERT INTO public.listings
    (id, pet_id, owner_id, owner_role, type, title, description, price, status, city, country, photos, is_urgent)
  VALUES
    (lst_luna_live,   pet_luna,  u_breeder, 'breeder_independent', 'adoption',
     'Luna ? Border Collie', 'Healthy, trained, ready for active family',
     350, 'live', 'Valletta', 'Malta',
     ARRAY['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop'],
     false),
    (lst_misty_urgent, pet_misty, u_shelter, 'shelter', 'adoption',
     'URGENT: Misty (British Shorthair)', 'At-risk placement; loving indoor home preferred',
     0, 'live', 'Birkirkara', 'Malta',
     ARRAY['https://images.unsplash.com/photo-1511300636408-a63a89df3482?q=80&w=1200&auto=format&fit=crop'],
     true)
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================
  -- SAVED SEARCH
  -- =========================================================
  INSERT INTO public.saved_searches (id, user_id, name, criteria)
  SELECT saved_search_id, u_seeker, 'Dogs in Malta (live)',
         jsonb_build_object('species','dog','status','live','urgentOnly',false)
  WHERE NOT EXISTS (SELECT 1 FROM public.saved_searches WHERE id = saved_search_id);

  -- =========================================================
  -- COMMUNITY VOTES
  -- =========================================================
  INSERT INTO public.pet_votes (id, voter_id, pet_id, vote_type)
  SELECT uuid_generate_v5(ns,'vote:seeker:luna'), u_seeker, pet_luna, 'upvote'
  WHERE NOT EXISTS (SELECT 1 FROM public.pet_votes WHERE voter_id=u_seeker AND pet_id=pet_luna);

  INSERT INTO public.pet_votes (id, voter_id, pet_id, vote_type)
  SELECT uuid_generate_v5(ns,'vote:seeker:misty'), u_seeker, pet_misty, 'downvote'
  WHERE NOT EXISTS (SELECT 1 FROM public.pet_votes WHERE voter_id=u_seeker AND pet_id=pet_misty);

  -- =========================================================
  -- INTERACTION & MATCH (trigger auto-creates match)
  -- =========================================================
  INSERT INTO public.pet_interactions (id, user_id, pet_id, direction)
  VALUES (inter_superlike, u_seeker, pet_luna, 'super_like')
  ON CONFLICT (user_id, pet_id) DO NOTHING;

  -- =========================================================
  -- CONVERSATION + MESSAGES
  -- =========================================================
  INSERT INTO public.conversations (id)
  VALUES (conv_1)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES
    (conv_1, u_breeder, 'breeder_independent'),
    (conv_1, u_seeker,  'buyer')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.messages (id, conv_id, sender_id, receiver_id, msg_type, content, read)
  VALUES
    (msg_1, conv_1, u_seeker,  u_breeder, 'text',
     'Hi! Super liked Luna ? is she available to meet this week?', false),
    (msg_2, conv_1, u_breeder, u_seeker,  'text',
     'Yes! Wednesday evening in Valletta works. I''ll share the vet papers.', false)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '? PawMatch Master Seed completed successfully.';
END $$;
