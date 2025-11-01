# ??? Supabase Setup Guide

Your PawMatch app is now **directly wired** to your Supabase database!

## ? What's Already Done

1. ? **Supabase Client** configured with your credentials
2. ? **Complete API layer** (`services/pawmatch.ts`)
3. ? **All operations** ready: Discovery, Favorites, Voting, Heat Tracker

---

## ?? Your Credentials (Already Configured)

```
URL: https://bdpbjsciaekgcdpvqomr.supabase.co
Key: eyJhbGc...IO4A (configured)
```

These are already set in `/workspace/services/supabase.ts`.

---

## ?? Database Setup Required

### Step 1: Run SQL Helpers

Open **Supabase SQL Editor** and paste the contents of `SQL_HELPERS.sql`:

```bash
# This file contains:
1. pet_vote_counts() - RPC for vote tallies
2. pair_vote_counts() - RPC for pair vote tallies
3. handle_super_like() - Trigger to auto-create matches
4. recompute_fertile_window() - Heat cycle calculations
5. RLS policies - Security rules (CRITICAL!)
```

**Why?** These enable:
- ? Community voting counts
- ? Auto-match creation on super-like
- ? Heat tracker calculations
- ? Row-level security (users can only access their own data)

### Step 2: Create Tables

If you haven't created the tables yet, here's the schema:

```sql
-- Core tables
CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  species text CHECK (species IN ('dog', 'cat')),
  breed text,
  sex text CHECK (sex IN ('male', 'female')),
  for_mating boolean DEFAULT false,
  for_stud boolean DEFAULT false,
  location_city text,
  status text DEFAULT 'available' CHECK (status IN ('available', 'unavailable')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.pet_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.pet_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  pet_id uuid NOT NULL REFERENCES public.pets(id),
  direction text CHECK (direction IN ('favorite', 'super_like', 'pass')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, pet_id)
);

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id),
  seeker_user_id uuid NOT NULL REFERENCES auth.users(id),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id),
  status text DEFAULT 'new' CHECK (status IN ('new', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(pet_id, seeker_user_id)
);

CREATE TABLE public.pet_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id uuid NOT NULL REFERENCES auth.users(id),
  pet_id uuid NOT NULL REFERENCES public.pets(id),
  vote_type text CHECK (vote_type IN ('upvote', 'downvote')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(voter_id, pet_id)
);

CREATE TABLE public.mating_pair_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id uuid NOT NULL REFERENCES auth.users(id),
  bitch_pet_id uuid NOT NULL REFERENCES public.pets(id),
  stag_pet_id uuid NOT NULL REFERENCES public.pets(id),
  vote_type text CHECK (vote_type IN ('upvote', 'downvote')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(voter_id, bitch_pet_id, stag_pet_id)
);

CREATE TABLE public.heat_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id),
  heat_start_date date NOT NULL,
  est_ovulation date,
  window_start date,
  window_end date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(pet_id) -- One active cycle per pet
);
```

---

## ?? How to Use the API

### Discovery Feed

```typescript
import { getDiscoveryFeed } from '../services/pawmatch';

// Get all available pets
const pets = await getDiscoveryFeed();

// Filter by species
const dogs = await getDiscoveryFeed({ species: 'dog' });

// Filter by city
const vallettaPets = await getDiscoveryFeed({ city: 'Valletta' });
```

### Interactions (Swipe Actions)

```typescript
import { upsertInteraction } from '../services/pawmatch';

// Favorite a pet
await upsertInteraction(pet.id, 'favorite');

// Super-like (creates match!)
await upsertInteraction(pet.id, 'super_like');

// Pass
await upsertInteraction(pet.id, 'pass');
```

### My Favorites

```typescript
import { getMyFavorites } from '../services/pawmatch';

const favorites = await getMyFavorites();
```

### Community Voting

```typescript
import { votePet, getPetVoteCounts } from '../services/pawmatch';

// Vote on a pet
await votePet(pet.id, 'up');
await votePet(pet.id, 'down');

// Get vote counts
const { upvotes, downvotes } = await getPetVoteCounts(pet.id);
```

### Heat Tracker

```typescript
import { saveHeatStart, getHeatCycle } from '../services/pawmatch';

// Save heat start date
await saveHeatStart(pet.id, '2025-11-01');

// Get heat cycle info
const cycle = await getHeatCycle(pet.id);
// cycle.est_ovulation, cycle.window_start, cycle.window_end
```

### Authentication

```typescript
import { signInWithEmail, getCurrentUser } from '../services/pawmatch';

// Send magic link
await signInWithEmail('user@example.com');

// Get current user
const user = await getCurrentUser();
```

---

## ?? Troubleshooting

### Error: "Authentication required"

```typescript
// User needs to sign in first
await signInWithEmail('your@email.com');
// Check email for magic link
```

### Error: "new row violates row-level security policy"

- Run the RLS policies from `SQL_HELPERS.sql`
- Make sure user is authenticated

### Error: "function pet_vote_counts does not exist"

- Run the RPC functions from `SQL_HELPERS.sql`

### Error: "relation pets does not exist"

- Create the tables (see Step 2 above)

---

## ?? Quick Test

To verify everything works, add this to any screen:

```typescript
import { useEffect, useState } from 'react';
import { getDiscoveryFeed } from '../services/pawmatch';

export default function TestScreen() {
  const [pets, setPets] = useState([]);

  useEffect(() => {
    getDiscoveryFeed()
      .then(setPets)
      .catch(err => console.error(err));
  }, []);

  return (
    <View>
      <Text>Pets loaded: {pets.length}</Text>
      {pets.map(pet => (
        <Text key={pet.id}>{pet.name}</Text>
      ))}
    </View>
  );
}
```

---

## ?? You're Ready!

Your app is now fully wired to Supabase. Every button press, every swipe, every vote goes directly to your database!

**Next steps:**
1. Run `SQL_HELPERS.sql` in Supabase SQL Editor
2. Add some test pets to your database
3. Run `npm start` and test the flows!

---

## ?? Supabase Dashboard

Access your database at:
https://supabase.com/dashboard/project/bdpbjsciaekgcdpvqomr

**Useful pages:**
- Table Editor: View/edit data
- SQL Editor: Run queries
- Auth: Manage users
- Storage: Upload pet images (optional)
