-- SQL_HELPERS.sql
-- Paste these into Supabase SQL Editor to enable RPC functions and triggers

-- ============================================================================
-- 1. RPC: Count votes for a single pet
-- ============================================================================
CREATE OR REPLACE FUNCTION public.pet_vote_counts(p_pet_id uuid)
RETURNS TABLE (upvotes int, downvotes int)
LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*) FILTER (WHERE vote_type = 'upvote')::int AS upvotes,
    COUNT(*) FILTER (WHERE vote_type = 'downvote')::int AS downvotes
  FROM public.pet_votes
  WHERE pet_id = p_pet_id
$$;

-- ============================================================================
-- 2. RPC: Count votes for a breeding pair
-- ============================================================================
CREATE OR REPLACE FUNCTION public.pair_vote_counts(p_bitch_id uuid, p_stag_id uuid)
RETURNS TABLE (upvotes int, downvotes int)
LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*) FILTER (WHERE vote_type = 'upvote')::int AS upvotes,
    COUNT(*) FILTER (WHERE vote_type = 'downvote')::int AS downvotes
  FROM public.mating_pair_votes
  WHERE bitch_pet_id = p_bitch_id AND stag_pet_id = p_stag_id
$$;

-- ============================================================================
-- 3. TRIGGER: Auto-create match on super_like
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_super_like()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_owner uuid;
BEGIN
  -- Only act on super_like
  IF NEW.direction <> 'super_like' THEN
    RETURN NEW;
  END IF;

  -- Get pet owner
  SELECT owner_user_id INTO v_owner
  FROM public.pets
  WHERE id = NEW.pet_id;

  -- Don't match if no owner or self-match
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Create match (ignore duplicates)
  INSERT INTO public.matches (pet_id, seeker_user_id, owner_user_id)
  VALUES (NEW.pet_id, NEW.user_id, v_owner)
  ON CONFLICT (pet_id, seeker_user_id) DO NOTHING;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_handle_super_like ON public.pet_interactions;
CREATE TRIGGER trg_handle_super_like
AFTER INSERT ON public.pet_interactions
FOR EACH ROW
EXECUTE PROCEDURE public.handle_super_like();

-- ============================================================================
-- 4. RPC: Recompute fertile window for heat cycle
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recompute_fertile_window(cycle_uuid uuid)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_start date;
BEGIN
  -- Get heat start date
  SELECT heat_start_date INTO v_start
  FROM public.heat_cycles
  WHERE id = cycle_uuid;

  IF v_start IS NULL THEN
    RETURN;
  END IF;

  -- Simple canine heuristic:
  -- Ovulation ~day 12, fertile window day 10-14
  UPDATE public.heat_cycles
  SET
    est_ovulation = v_start + INTERVAL '12 days',
    window_start = v_start + INTERVAL '10 days',
    window_end = v_start + INTERVAL '14 days',
    updated_at = now()
  WHERE id = cycle_uuid;
END $$;

-- ============================================================================
-- 5. Optional: Trigger to auto-recompute on heat_start_date change
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_recompute_fertile_window()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.heat_start_date IS NOT NULL THEN
    NEW.est_ovulation := NEW.heat_start_date + INTERVAL '12 days';
    NEW.window_start := NEW.heat_start_date + INTERVAL '10 days';
    NEW.window_end := NEW.heat_start_date + INTERVAL '14 days';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_auto_recompute_fertile ON public.heat_cycles;
CREATE TRIGGER trg_auto_recompute_fertile
BEFORE INSERT OR UPDATE OF heat_start_date ON public.heat_cycles
FOR EACH ROW
EXECUTE PROCEDURE public.auto_recompute_fertile_window();

-- ============================================================================
-- 6. Row Level Security (RLS) Policies - CRITICAL FOR SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mating_pair_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heat_cycles ENABLE ROW LEVEL SECURITY;

-- Pets: Everyone can read available pets, owners can manage their own
CREATE POLICY "pets_read_public" ON public.pets
FOR SELECT USING (status = 'available' OR owner_user_id = auth.uid());

CREATE POLICY "pets_write_owner" ON public.pets
FOR ALL USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

-- Pet Interactions: Users can only see/manage their own
CREATE POLICY "interactions_read_owner" ON public.pet_interactions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "interactions_write_owner" ON public.pet_interactions
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Matches: Users can see matches where they're seeker or owner
CREATE POLICY "matches_read_involved" ON public.matches
FOR SELECT USING (
  seeker_user_id = auth.uid() OR
  owner_user_id = auth.uid()
);

CREATE POLICY "matches_update_involved" ON public.matches
FOR UPDATE USING (
  seeker_user_id = auth.uid() OR
  owner_user_id = auth.uid()
);

-- Pet Votes: Users can vote and see all votes
CREATE POLICY "pet_votes_read_all" ON public.pet_votes
FOR SELECT USING (true);

CREATE POLICY "pet_votes_write_owner" ON public.pet_votes
FOR ALL USING (voter_id = auth.uid())
WITH CHECK (voter_id = auth.uid());

-- Pair Votes: Users can vote and see all votes
CREATE POLICY "pair_votes_read_all" ON public.mating_pair_votes
FOR SELECT USING (true);

CREATE POLICY "pair_votes_write_owner" ON public.mating_pair_votes
FOR ALL USING (voter_id = auth.uid())
WITH CHECK (voter_id = auth.uid());

-- Heat Cycles: Pet owners can manage their own pet's cycles
CREATE POLICY "heat_cycles_read_owner" ON public.heat_cycles
FOR SELECT USING (
  pet_id IN (
    SELECT id FROM public.pets WHERE owner_user_id = auth.uid()
  )
);

CREATE POLICY "heat_cycles_write_owner" ON public.heat_cycles
FOR ALL USING (
  pet_id IN (
    SELECT id FROM public.pets WHERE owner_user_id = auth.uid()
  )
);

-- ============================================================================
-- 7. Sample Data (optional - for testing)
-- ============================================================================

-- Uncomment below to insert sample pets (update owner_user_id with your user ID)

/*
INSERT INTO public.pets (owner_user_id, name, species, breed, sex, for_mating, for_stud, location_city, status)
VALUES
  ('YOUR_USER_ID_HERE', 'Luna', 'dog', 'Maltese', 'female', true, false, 'Valletta', 'available'),
  ('YOUR_USER_ID_HERE', 'Max', 'dog', 'German Shepherd', 'male', false, true, 'Sliema', 'available'),
  ('YOUR_USER_ID_HERE', 'Miso', 'cat', 'Siamese', 'female', true, false, 'Birkirkara', 'available');

-- Add some images
INSERT INTO public.pet_images (pet_id, url, sort_order)
SELECT 
  id,
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop',
  0
FROM public.pets
WHERE name = 'Luna';
*/
