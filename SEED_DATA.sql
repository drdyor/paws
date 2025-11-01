-- =============================
-- PawMatch Master Seed v1 (idempotent)
-- Requires: PRODUCTION_SCHEMA.sql already applied
-- =============================

-- ?? REPLACE THESE WITH REAL AUTH USER UUIDS
-- Get these from: Supabase Dashboard ? Authentication ? Users
-- Example: '11111111-1111-1111-1111-111111111111'

-- Safety check to prevent running with placeholder UUIDs
DO $$
BEGIN
  IF 'BREEDER_UUID_HERE' = 'BREEDER_UUID_HERE' THEN
    RAISE EXCEPTION 'Replace BREEDER_UUID_HERE/SEEKER_UUID_HERE/SHELTER_UUID_HERE with real auth.users UUIDs before running.';
  END IF;
END$$;

-- Static UUIDs for deterministic upserts (keeps this seed idempotent)
DO $$
DECLARE
  -- User IDs (REPLACE THESE!)
  u_breeder uuid := 'BREEDER_UUID_HERE';
  u_seeker uuid := 'SEEKER_UUID_HERE';
  u_shelter uuid := 'SHELTER_UUID_HERE';

  -- Pet IDs (fixed for idempotency)
  pet_luna uuid := '9a1e1111-aaaa-4bbb-cccc-111111111111';
  pet_max uuid := '9a1e2222-bbbb-4ccc-dddd-222222222222';
  pet_misty uuid := '9a1e3333-cccc-4ddd-eeee-333333333333';

  -- Image IDs
  img_luna_1 uuid := '7f111111-1111-4111-8111-111111111111';
  img_max_1 uuid := '7f222222-2222-4222-8222-222222222222';
  img_misty_1 uuid := '7f333333-3333-4333-8333-333333333333';

  -- Listing IDs
  lst_luna_live uuid := '6a111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  lst_misty_urgent uuid := '6a222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  -- Heat cycle ID
  heat_luna uuid := '5h111111-aaaa-4aaa-8a1a-aaaaaaa00001';

  -- Interaction ID
  inter_superlike uuid := '4i111111-aaaa-4aaa-8a2a-000000000001';

  -- Conversation IDs
  conv_1 uuid := '8c111111-aaaa-4aaa-8a3a-cccccccccc01';
  conv_part_breeder uuid := '8p111111-aaaa-4aaa-8a4a-cccccccccc02';
  conv_part_seeker uuid := '8p222222-bbbb-4bbb-8b4b-cccccccccc03';
  msg_1 uuid := '8m111111-aaaa-4aaa-8a5a-cccccccccc04';
  msg_2 uuid := '8m222222-bbbb-4bbb-8b5b-cccccccccc05';

  -- Breed IDs (look up from breeds table)
  breed_border_collie uuid;
  breed_golden_retriever uuid;
  breed_british_shorthair uuid;

BEGIN
  -- Get breed IDs
  SELECT id INTO breed_border_collie FROM public.breeds WHERE species='dog' AND lower(name)=lower('Border Collie') LIMIT 1;
  SELECT id INTO breed_golden_retriever FROM public.breeds WHERE species='dog' AND lower(name)=lower('Golden Retriever') LIMIT 1;
  SELECT id INTO breed_british_shorthair FROM public.breeds WHERE species='cat' AND lower(name)=lower('British Shorthair') LIMIT 1;

  -- ========== PROFILES ==========
  INSERT INTO public.profiles (id, email, full_name, role, country, city)
  VALUES
    (u_breeder, 'breeder@demo.dev', 'Indy Breeder', 'breeder_independent', 'Malta', 'Valletta'),
    (u_seeker, 'seeker@demo.dev', 'Pet Seeker', 'buyer', 'Malta', 'Valletta'),
    (u_shelter, 'shelter@demo.dev', 'Valletta Shelter', 'shelter', 'Malta', 'Valletta')
  ON CONFLICT (id) DO NOTHING;

  -- ========== PETS ==========
  INSERT INTO public.pets (id, owner_user_id, owner_role, name, species, breed, breed_id, sex, status, city, country, description)
  VALUES
    (pet_luna, u_breeder, 'breeder_independent', 'Luna', 'dog', 'Border Collie', breed_border_collie, 'female', 'in_heat', 'Valletta', 'Malta', 'Friendly, athletic, great with kids'),
    (pet_max, u_breeder, 'breeder_independent', 'Max', 'dog', 'Golden Retriever', breed_golden_retriever, 'male', 'stud_available', 'Valletta', 'Malta', 'Calm temperament, hip scored'),
    (pet_misty, u_shelter, 'shelter', 'Misty', 'cat', 'British Shorthair', breed_british_shorthair, 'female', 'at_risk', 'Birkirkara', 'Malta', 'Gentle house cat; urgent placement needed')
  ON CONFLICT (id) DO NOTHING;

  -- Update at_risk_until for Misty
  UPDATE public.pets SET at_risk_until = (CURRENT_DATE + INTERVAL '14 days')::date WHERE id = pet_misty;

  -- ========== PET IMAGES ==========
  INSERT INTO public.pet_images (id, pet_id, url, sort_order)
  VALUES
    (img_luna_1, pet_luna, 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop', 0),
    (img_max_1, pet_max, 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200&auto=format&fit=crop', 0),
    (img_misty_1, pet_misty, 'https://images.unsplash.com/photo-1511300636408-a63a89df3482?q=80&w=1200&auto=format&fit=crop', 0)
  ON CONFLICT (id) DO NOTHING;

  -- ========== HEALTH RECORDS ==========
  INSERT INTO public.health_records (id, pet_id, type, title, date, vet_name)
  VALUES 
    (gen_random_uuid(), pet_max, 'vaccination', 'Rabies Booster', CURRENT_DATE - INTERVAL '30 days', 'Dr. Galea'),
    (gen_random_uuid(), pet_luna, 'checkup', 'Annual Health Check', CURRENT_DATE - INTERVAL '60 days', 'Dr. Galea')
  ON CONFLICT DO NOTHING;

  -- ========== BADGE GRANTS ==========
  INSERT INTO public.badge_grants (id, badge_id, pet_id, granted_by_vet, granted_at)
  SELECT
    gen_random_uuid(),
    b.id,
    pet_luna,
    u_breeder,  -- placeholder; in real life would be vet user
    now()
  FROM public.badges b
  WHERE b.code='vet_checked'
  ON CONFLICT DO NOTHING;

  INSERT INTO public.badge_grants (id, badge_id, pet_id, granted_by_vet, granted_at)
  SELECT
    gen_random_uuid(),
    b.id,
    pet_max,
    u_breeder,
    now()
  FROM public.badges b
  WHERE b.code='vaccinated'
  ON CONFLICT DO NOTHING;

  -- ========== HEAT CYCLE (auto-computes fertile window via trigger) ==========
  INSERT INTO public.heat_cycles (id, pet_id, heat_start_date, notes)
  VALUES (heat_luna, pet_luna, (CURRENT_DATE - INTERVAL '2 days')::date, 'Logged via seed')
  ON CONFLICT (id) DO NOTHING;

  -- ========== LISTINGS ==========
  -- Live listing for Luna (breeder)
  INSERT INTO public.listings (id, pet_id, owner_id, owner_role, type, title, description, price, status, city, country, photos, is_urgent)
  VALUES
    (lst_luna_live, pet_luna, u_breeder, 'breeder_independent', 'adoption', 
     'Luna ? Border Collie', 'Healthy, trained, ready for active family', 
     350, 'live', 'Valletta', 'Malta', 
     ARRAY['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop'], 
     false)
  ON CONFLICT (id) DO NOTHING;

  -- Urgent listing for Misty (shelter)
  INSERT INTO public.listings (id, pet_id, owner_id, owner_role, type, title, description, price, status, city, country, photos, is_urgent)
  VALUES
    (lst_misty_urgent, pet_misty, u_shelter, 'shelter', 'adoption',
     'URGENT: Misty (British Shorthair)', 'At-risk placement; loving indoor home preferred',
     0, 'live', 'Birkirkara', 'Malta',
     ARRAY['https://images.unsplash.com/photo-1511300636408-a63a89df3482?q=80&w=1200&auto=format&fit=crop'],
     true)
  ON CONFLICT (id) DO NOTHING;

  -- ========== SAVED SEARCH (seeker) ==========
  INSERT INTO public.saved_searches (id, user_id, name, criteria)
  VALUES (
    gen_random_uuid(),
    u_seeker,
    'Dogs in Malta (live)',
    jsonb_build_object(
      'species', 'dog',
      'status', 'live',
      'urgentOnly', false
    )
  ) ON CONFLICT DO NOTHING;

  -- ========== COMMUNITY VOTES ==========
  INSERT INTO public.pet_votes (id, voter_id, pet_id, vote_type)
  SELECT gen_random_uuid(), u_seeker, pet_luna, 'upvote'
  WHERE NOT EXISTS (SELECT 1 FROM public.pet_votes WHERE voter_id=u_seeker AND pet_id=pet_luna);

  INSERT INTO public.pet_votes (id, voter_id, pet_id, vote_type)
  SELECT gen_random_uuid(), u_seeker, pet_misty, 'downvote'
  WHERE NOT EXISTS (SELECT 1 FROM public.pet_votes WHERE voter_id=u_seeker AND pet_id=pet_misty);

  -- ========== INTERACTION ? MATCH (trigger creates match on super_like) ==========
  INSERT INTO public.pet_interactions (id, user_id, pet_id, direction)
  VALUES (inter_superlike, u_seeker, pet_luna, 'super_like')
  ON CONFLICT (user_id, pet_id) DO NOTHING;

  -- ========== CONVERSATION + MESSAGES ==========
  INSERT INTO public.conversations (id)
  VALUES (conv_1)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES
    (conv_1, u_breeder, 'breeder_independent'),
    (conv_1, u_seeker, 'buyer')
  ON CONFLICT DO NOTHING;

  -- Messages
  INSERT INTO public.messages (id, conv_id, sender_id, receiver_id, msg_type, content, read)
  VALUES
    (msg_1, conv_1, u_seeker, u_breeder, 'text', 'Hi! Super liked Luna ? is she available to meet this week?', false),
    (msg_2, conv_1, u_breeder, u_seeker, 'text', 'Yes! Wednesday evening in Valletta works. I''ll share the vet papers.', false)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Seed data inserted successfully!';
END $$;
