-- =============================
-- PawMatch Master Schema v1
-- Production-Ready PostgreSQL Schema
-- =============================

BEGIN;

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ENUM TYPES (create safely if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('breeder_registered','breeder_independent','buyer','shelter','vet');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'species') THEN
    CREATE TYPE species AS ENUM ('dog','cat','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pet_size') THEN
    CREATE TYPE pet_size AS ENUM ('small','medium','large');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pet_status') THEN
    CREATE TYPE pet_status AS ENUM ('available','reserved','adopted','stud_available','in_heat','at_risk');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_type') THEN
    CREATE TYPE listing_type AS ENUM ('adoption','stud','litter_announcement');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
    CREATE TYPE listing_status AS ENUM ('draft','live','reserved','closed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
    CREATE TYPE message_type AS ENUM ('text','image','system');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
    CREATE TYPE contract_status AS ENUM ('draft','sent','signed','completed','cancelled','refunded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'litter_status') THEN
    CREATE TYPE litter_status AS ENUM ('planned','confirmed','whelped','cancelled');
  END IF;
END
$$;

-- PROFILES (auth.users mirror)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role DEFAULT 'buyer',
  phone_number text,
  city text,
  country text DEFAULT 'Malta',
  kennel_name text,
  shelter_name text,
  clinic_name text,
  is_first_time_breeder boolean DEFAULT false,
  profile_photo text,
  preferred_species species,
  preferred_dog_size pet_size,
  preferred_age text CHECK (preferred_age IN ('young','adult','senior','any')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- BREEDS (normalized)
CREATE TABLE IF NOT EXISTS public.breeds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  species species NOT NULL,
  name text NOT NULL,
  alt_names text[] DEFAULT '{}',
  kc_recognized boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_species_name_lower ON public.breeds (species, lower(name));
CREATE INDEX IF NOT EXISTS idx_breeds_name_trgm ON public.breeds USING gin (name gin_trgm_ops);

-- Seed common breeds
INSERT INTO public.breeds (species, name) VALUES
  ('dog','Border Collie'),
  ('dog','Labrador'),
  ('dog','Golden Retriever'),
  ('dog','German Shepherd'),
  ('dog','French Bulldog'),
  ('dog','Maltese'),
  ('cat','Bengal'),
  ('cat','Maine Coon'),
  ('cat','British Shorthair'),
  ('cat','Siamese')
ON CONFLICT DO NOTHING;

-- LITTERS
CREATE TABLE IF NOT EXISTS public.litters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dam_id uuid,
  sire_id uuid,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  expected_birth_date date,
  due_window daterange,
  ultrasound_confirmed boolean DEFAULT false,
  expected_pups_min int CHECK (expected_pups_min IS NULL OR expected_pups_min >= 0),
  expected_pups_max int CHECK (expected_pups_max IS NULL OR expected_pups_max >= expected_pups_min),
  status litter_status DEFAULT 'planned',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PETS (core)
CREATE TABLE IF NOT EXISTS public.pets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_role user_role NOT NULL,
  name text NOT NULL,
  species species NOT NULL,
  breed text,
  breed_id uuid REFERENCES public.breeds(id),
  sex text CHECK (sex IN ('male','female')),
  date_of_birth date CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE),
  weight numeric(5,2),
  size pet_size,
  status pet_status DEFAULT 'available',
  photos text[] DEFAULT '{}',
  city text,
  country text DEFAULT 'Malta',
  description text,
  adopted_at timestamptz,
  geo geography(Point,4326),
  at_risk_until date,
  litter_id uuid REFERENCES public.litters(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add circular foreign keys on litters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'litters_dam_id_fkey' AND table_name = 'litters'
  ) THEN
    ALTER TABLE public.litters ADD CONSTRAINT litters_dam_id_fkey 
      FOREIGN KEY (dam_id) REFERENCES public.pets(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'litters_sire_id_fkey' AND table_name = 'litters'
  ) THEN
    ALTER TABLE public.litters ADD CONSTRAINT litters_sire_id_fkey 
      FOREIGN KEY (sire_id) REFERENCES public.pets(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add litters -> pets FKs: %', SQLERRM;
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pets_owner ON public.pets(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_pets_status ON public.pets(status);
CREATE INDEX IF NOT EXISTS idx_pets_species ON public.pets(species);
CREATE INDEX IF NOT EXISTS idx_pets_size ON public.pets(size);
CREATE INDEX IF NOT EXISTS idx_pets_geo ON public.pets USING gist (geo);
CREATE INDEX IF NOT EXISTS idx_pets_at_risk_until ON public.pets(at_risk_until) WHERE status = 'at_risk';

CREATE INDEX IF NOT EXISTS idx_litters_owner ON public.litters(owner_id);
CREATE INDEX IF NOT EXISTS idx_litters_status ON public.litters(status);
CREATE INDEX IF NOT EXISTS idx_litters_expected ON public.litters(expected_birth_date);

-- PET IMAGES
CREATE TABLE IF NOT EXISTS public.pet_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (pet_id, sort_order)
);
CREATE INDEX IF NOT EXISTS idx_pet_images_pet_sort ON public.pet_images(pet_id, sort_order);

-- PET_BREEDS (M2M for mixes)
CREATE TABLE IF NOT EXISTS public.pet_breeds (
  pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE,
  breed_id uuid REFERENCES public.breeds(id) ON DELETE RESTRICT,
  confidence_pct int CHECK (confidence_pct BETWEEN 1 AND 100),
  is_primary boolean DEFAULT false,
  PRIMARY KEY (pet_id, breed_id)
);
CREATE INDEX IF NOT EXISTS idx_pet_breeds_pet ON public.pet_breeds(pet_id);

-- HEALTH RECORDS
CREATE TABLE IF NOT EXISTS public.health_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  type text CHECK (type IN ('vaccination','test','certificate','checkup')),
  title text NOT NULL,
  date date NOT NULL,
  vet_name text,
  notes text,
  file_url text,
  created_at timestamptz DEFAULT now()
);

-- BADGES
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  label text NOT NULL,
  color text DEFAULT '#34C759'
);

CREATE TABLE IF NOT EXISTS public.badge_grants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE,
  pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE,
  granted_by_vet uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  evidence_url text,
  notes text,
  granted_at timestamptz DEFAULT now(),
  UNIQUE (badge_id, pet_id)
);

INSERT INTO public.badges (code, label, color) VALUES
  ('vet_checked', 'Vet Verified', '#34C759'),
  ('vaccinated', 'Vaccinated', '#007AFF'),
  ('dna_clear', 'DNA Clear', '#FF9500'),
  ('hip_ok', 'Hip Score OK', '#5856D6')
ON CONFLICT DO NOTHING;

-- LISTINGS
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE,
  litter_id uuid REFERENCES public.litters(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_role user_role NOT NULL,
  type listing_type NOT NULL,
  title text NOT NULL,
  description text,
  price int DEFAULT 0 CHECK (price >= 0),
  deposit int CHECK (deposit IS NULL OR (deposit >= 0 AND deposit <= price)),
  status listing_status DEFAULT 'draft',
  city text,
  country text DEFAULT 'Malta',
  photos text[],
  available_date date,
  pups_available int,
  location geography(Point,4326),
  currency text DEFAULT 'EUR',
  is_urgent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_owner ON public.listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_type_status_created ON public.listings(type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_geo ON public.listings USING gist (location);
CREATE INDEX IF NOT EXISTS idx_listings_live ON public.listings(status) WHERE status = 'live';

-- LISTING VIEWS
CREATE TABLE IF NOT EXISTS public.listing_views (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now()
);

-- FAVORITES / SAVED SEARCHES / WAITLISTS
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  criteria jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saved_searches_criteria ON public.saved_searches USING gin (criteria);

CREATE TABLE IF NOT EXISTS public.waitlists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (listing_id, user_id)
);

-- HEAT CYCLES
CREATE TABLE IF NOT EXISTS public.heat_cycles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  heat_start_date date NOT NULL,
  estimated_ovulation date,
  fertile_window_start date,
  fertile_window_end date,
  next_heat_estimate date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_heat_cycles_pet ON public.heat_cycles(pet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_heat_cycles_window ON public.heat_cycles(fertile_window_start, fertile_window_end);

-- STUD INTERESTS
CREATE TABLE IF NOT EXISTS public.stud_interests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  heat_cycle_id uuid REFERENCES public.heat_cycles(id) ON DELETE CASCADE,
  female_pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE,
  stud_pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE,
  stud_owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending','interested','declined')) DEFAULT 'pending',
  message text,
  created_at timestamptz DEFAULT now()
);

-- PAYMENTS & CONTRACTS
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  breeder_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  kind text CHECK (kind IN ('deposit','balance','refund')),
  amount_cents int NOT NULL CHECK (amount_cents > 0),
  currency text DEFAULT 'EUR',
  provider text DEFAULT 'stripe',
  provider_payment_id text,
  status text CHECK (status IN ('requires_action','succeeded','refunded','failed')) DEFAULT 'requires_action',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  litter_id uuid NOT NULL REFERENCES public.litters(id) ON DELETE CASCADE,
  breeder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status contract_status DEFAULT 'draft',
  price_eur int NOT NULL CHECK (price_eur >= 0),
  deposit_eur int NOT NULL CHECK (deposit_eur >= 0 AND deposit_eur <= price_eur),
  health_guarantee_days int DEFAULT 14,
  delivery_city text,
  pdf_url text,
  breeder_signature_name text,
  breeder_signature_date timestamptz,
  buyer_signature_name text,
  buyer_signature_date timestamptz,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contracts_litter ON public.contracts(litter_id);

-- INTERACTIONS & MATCHES
CREATE TABLE IF NOT EXISTS public.pet_interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('favorite','super_like','pass')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, pet_id)
);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON public.pet_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_pet ON public.pet_interactions(pet_id);
CREATE INDEX IF NOT EXISTS idx_interactions_dir ON public.pet_interactions(direction);

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  seeker_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (pet_id, seeker_user_id)
);
CREATE INDEX IF NOT EXISTS idx_matches_seeker ON public.matches(seeker_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_owner ON public.matches(owner_user_id);

-- COMMUNITY VOTING
CREATE TABLE IF NOT EXISTS public.pet_votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('upvote','downvote')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (voter_id, pet_id)
);
CREATE INDEX IF NOT EXISTS idx_pet_votes_pet ON public.pet_votes(pet_id);

CREATE TABLE IF NOT EXISTS public.mating_pair_votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bitch_pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  stag_pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('upvote','downvote')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (voter_id, bitch_pet_id, stag_pet_id)
);
CREATE INDEX IF NOT EXISTS idx_pair_votes ON public.mating_pair_votes(bitch_pet_id, stag_pet_id);

CREATE TABLE IF NOT EXISTS public.breeding_suggestions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  female_pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE,
  stud_pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE,
  suggested_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (female_pet_id, stud_pet_id)
);

CREATE TABLE IF NOT EXISTS public.suggestion_votes (
  suggestion_id uuid REFERENCES public.breeding_suggestions(id) ON DELETE CASCADE,
  voter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote int CHECK (vote IN (-1,1)) NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (suggestion_id, voter_id)
);

-- CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conv_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  msg_type message_type DEFAULT 'text',
  content text,
  image_url text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT messages_nonempty_text CHECK (msg_type <> 'text' OR (content IS NOT NULL AND length(btrim(content)) > 0))
);
CREATE INDEX IF NOT EXISTS idx_messages_conv_time ON public.messages(conv_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_inbox ON public.messages(receiver_id, read, created_at DESC);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text CHECK (type IN ('litter_alert','price_alert','shelter_urgent','vet_reminder','message','match','heat_notification')),
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read = false;

-- REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type text CHECK (target_type IN ('user','listing','pet','message')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- TRIGGERS & FUNCTIONS
-- =============================================================================

-- touch updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- Attach touch triggers
DROP TRIGGER IF EXISTS trg_profiles_touch ON public.profiles;
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_pets_touch ON public.pets;
CREATE TRIGGER trg_pets_touch BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_litters_touch ON public.litters;
CREATE TRIGGER trg_litters_touch BEFORE UPDATE ON public.litters FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_listings_touch ON public.listings;
CREATE TRIGGER trg_listings_touch BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_heat_touch ON public.heat_cycles;
CREATE TRIGGER trg_heat_touch BEFORE UPDATE ON public.heat_cycles FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

-- Adopted timestamp
CREATE OR REPLACE FUNCTION public.set_adopted_timestamp() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'adopted' AND (OLD.status IS DISTINCT FROM 'adopted') THEN
    NEW.adopted_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pets_adopted_trigger ON public.pets;
CREATE TRIGGER pets_adopted_trigger BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE PROCEDURE public.set_adopted_timestamp();

-- Heat estimate helper
CREATE OR REPLACE FUNCTION public.estimate_heat_fields(p_species text, p_start_date date)
RETURNS TABLE(est_ovulation date, win_start date, win_end date, next_heat date)
LANGUAGE sql STABLE AS $$
  SELECT
    CASE WHEN p_species = 'dog' THEN p_start_date + 12 ELSE p_start_date + 3 END AS est_ovulation,
    CASE WHEN p_species = 'dog' THEN p_start_date + 10 ELSE p_start_date + 2 END AS win_start,
    CASE WHEN p_species = 'dog' THEN p_start_date + 14 ELSE p_start_date + 5 END AS win_end,
    CASE WHEN p_species = 'dog' THEN p_start_date + 180 ELSE p_start_date + 21 END AS next_heat;
$$;

-- recompute_fertile_window trigger
CREATE OR REPLACE FUNCTION public.recompute_fertile_window() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  est record;
BEGIN
  SELECT * INTO est FROM public.estimate_heat_fields( (SELECT species::text FROM public.pets WHERE id = NEW.pet_id), NEW.heat_start_date );
  IF est IS NOT NULL THEN
    NEW.estimated_ovulation := est.est_ovulation;
    NEW.fertile_window_start := est.win_start;
    NEW.fertile_window_end := est.win_end;
    NEW.next_heat_estimate := est.next_heat;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_heat_compute ON public.heat_cycles;
CREATE TRIGGER trg_heat_compute BEFORE INSERT OR UPDATE ON public.heat_cycles FOR EACH ROW EXECUTE PROCEDURE public.recompute_fertile_window();

-- Super-like => match
CREATE OR REPLACE FUNCTION public.handle_super_like() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  owner uuid;
BEGIN
  IF NEW.direction <> 'super_like' THEN
    RETURN NEW;
  END IF;

  SELECT owner_user_id INTO owner FROM public.pets WHERE id = NEW.pet_id;
  IF owner IS NULL OR owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.matches (pet_id, seeker_user_id, owner_user_id)
  VALUES (NEW.pet_id, NEW.user_id, owner)
  ON CONFLICT (pet_id, seeker_user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_super_like ON public.pet_interactions;
CREATE TRIGGER trg_handle_super_like AFTER INSERT ON public.pet_interactions FOR EACH ROW EXECUTE PROCEDURE public.handle_super_like();

-- Ensure message sender is a participant
CREATE OR REPLACE FUNCTION public.ensure_participant_message() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = NEW.conv_id AND cp.user_id = NEW.sender_id
  ) THEN
    RAISE EXCEPTION 'Sender is not a participant of this conversation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_participant_only ON public.messages;
CREATE TRIGGER trg_messages_participant_only BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE PROCEDURE public.ensure_participant_message();

-- Auto-profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger SECURITY DEFINER SET search_path = public LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'buyer'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- VIEWS & RPCs
-- =============================================================================

CREATE OR REPLACE VIEW public.v_pets_fertile_today AS
SELECT p.id AS pet_id, p.name, p.species, p.breed, p.sex, p.city, hc.fertile_window_start, hc.fertile_window_end
FROM public.heat_cycles hc
JOIN public.pets p ON p.id = hc.pet_id
WHERE CURRENT_DATE BETWEEN hc.fertile_window_start AND hc.fertile_window_end;

CREATE OR REPLACE FUNCTION public.pet_vote_counts(p_pet_id uuid) RETURNS TABLE (upvotes int, downvotes int)
LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*) FILTER (WHERE vote_type = 'upvote')::int AS upvotes,
    COUNT(*) FILTER (WHERE vote_type = 'downvote')::int AS downvotes
  FROM public.pet_votes
  WHERE pet_id = p_pet_id;
$$;

CREATE OR REPLACE FUNCTION public.pair_vote_counts(p_bitch_id uuid, p_stag_id uuid) RETURNS TABLE (upvotes int, downvotes int)
LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*) FILTER (WHERE vote_type = 'upvote')::int AS upvotes,
    COUNT(*) FILTER (WHERE vote_type = 'downvote')::int AS downvotes
  FROM public.mating_pair_votes
  WHERE bitch_pet_id = p_bitch_id AND stag_pet_id = p_stag_id;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_breeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.litters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heat_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stud_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mating_pair_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeding_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS profiles_read_public ON public.profiles;
CREATE POLICY profiles_read_public ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Breeds
DROP POLICY IF EXISTS breeds_read_all ON public.breeds;
CREATE POLICY breeds_read_all ON public.breeds FOR SELECT USING (true);

-- Pets
DROP POLICY IF EXISTS pets_read_public ON public.pets;
CREATE POLICY pets_read_public ON public.pets FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS pets_owner_manage ON public.pets;
CREATE POLICY pets_owner_manage ON public.pets FOR ALL USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

-- Pet images
DROP POLICY IF EXISTS pet_images_read_public ON public.pet_images;
CREATE POLICY pet_images_read_public ON public.pet_images FOR SELECT USING (true);

DROP POLICY IF EXISTS pet_images_owner_write ON public.pet_images;
CREATE POLICY pet_images_owner_write ON public.pet_images FOR ALL
  USING ( EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_images.pet_id AND p.owner_user_id = auth.uid()) )
  WITH CHECK ( EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_images.pet_id AND p.owner_user_id = auth.uid()) );

-- Pet breeds
DROP POLICY IF EXISTS pet_breeds_read ON public.pet_breeds;
CREATE POLICY pet_breeds_read ON public.pet_breeds FOR SELECT USING (true);

DROP POLICY IF EXISTS pet_breeds_owner_write ON public.pet_breeds;
CREATE POLICY pet_breeds_owner_write ON public.pet_breeds FOR ALL
  USING ( EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_breeds.pet_id AND p.owner_user_id = auth.uid()) )
  WITH CHECK ( EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_breeds.pet_id AND p.owner_user_id = auth.uid()) );

-- Listings
DROP POLICY IF EXISTS listings_read_live_or_owner ON public.listings;
CREATE POLICY listings_read_live_or_owner ON public.listings FOR SELECT USING (status = 'live' OR owner_id = auth.uid());

DROP POLICY IF EXISTS listings_owner_manage ON public.listings;
CREATE POLICY listings_owner_manage ON public.listings FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Favorites / saved searches / waitlists
DROP POLICY IF EXISTS favorites_owner ON public.favorites;
CREATE POLICY favorites_owner ON public.favorites FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS saved_searches_owner ON public.saved_searches;
CREATE POLICY saved_searches_owner ON public.saved_searches FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS waitlists_owner ON public.waitlists;
CREATE POLICY waitlists_owner ON public.waitlists FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Heat cycles
DROP POLICY IF EXISTS heat_cycles_owner ON public.heat_cycles;
CREATE POLICY heat_cycles_owner ON public.heat_cycles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.pets p WHERE p.id = heat_cycles.pet_id AND p.owner_user_id = auth.uid())
);

-- Interactions & matches
DROP POLICY IF EXISTS interactions_owner ON public.pet_interactions;
CREATE POLICY interactions_owner ON public.pet_interactions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS matches_participants ON public.matches;
CREATE POLICY matches_participants ON public.matches FOR SELECT USING (seeker_user_id = auth.uid() OR owner_user_id = auth.uid());

DROP POLICY IF EXISTS matches_participants_update ON public.matches;
CREATE POLICY matches_participants_update ON public.matches FOR UPDATE USING (seeker_user_id = auth.uid() OR owner_user_id = auth.uid()) WITH CHECK (seeker_user_id = auth.uid() OR owner_user_id = auth.uid());

-- Votes
DROP POLICY IF EXISTS pet_votes_owner ON public.pet_votes;
CREATE POLICY pet_votes_owner ON public.pet_votes FOR ALL USING (voter_id = auth.uid()) WITH CHECK (voter_id = auth.uid());

DROP POLICY IF EXISTS pair_votes_owner ON public.mating_pair_votes;
CREATE POLICY pair_votes_owner ON public.mating_pair_votes FOR ALL USING (voter_id = auth.uid()) WITH CHECK (voter_id = auth.uid());

DROP POLICY IF EXISTS suggestions_read ON public.breeding_suggestions;
CREATE POLICY suggestions_read ON public.breeding_suggestions FOR SELECT USING (true);

DROP POLICY IF EXISTS suggestion_votes_owner ON public.suggestion_votes;
CREATE POLICY suggestion_votes_owner ON public.suggestion_votes FOR ALL USING (voter_id = auth.uid()) WITH CHECK (voter_id = auth.uid());

-- Conversations & messages
DROP POLICY IF EXISTS conv_participants_read ON public.conversation_participants;
CREATE POLICY conv_participants_read ON public.conversation_participants FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS conv_participants_write ON public.conversation_participants;
CREATE POLICY conv_participants_write ON public.conversation_participants FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS messages_read_participants ON public.messages;
CREATE POLICY messages_read_participants ON public.messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS messages_insert_sender ON public.messages;
CREATE POLICY messages_insert_sender ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Notifications
DROP POLICY IF EXISTS notifications_read_owner ON public.notifications;
CREATE POLICY notifications_read_owner ON public.notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_owner ON public.notifications;
CREATE POLICY notifications_update_owner ON public.notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Reports
DROP POLICY IF EXISTS reports_insert_any ON public.reports;
CREATE POLICY reports_insert_any ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');

COMMIT;
