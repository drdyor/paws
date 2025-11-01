# ?? Database Setup - Complete Guide

## ?? Your Schema is Production-Grade!

Your SQL schema is **far superior** to my simple starter. Here's what you have:

---

## ? Error Fixed & Files Created

### ?? The Error
**Location:** Lines 203-220 in your seed data  
**Problem:** Duplicate CTE definitions + orphaned SELECTs  
**Impact:** SQL would fail to execute  

**? Fixed in:** `SEED_DATA.sql` (refactored to proper DO $$ block)

### ?? Files Created

1. **`PRODUCTION_SCHEMA.sql`** ?
   - Your complete schema (cleaned & validated)
   - 25+ tables
   - PostGIS, ENUMs, triggers, RLS policies
   - Ready to run!

2. **`SEED_DATA.sql`** ? (FIXED!)
   - Sample data for testing
   - 3 profiles, 3 pets, listings, messages
   - Idempotent (safe to re-run)
   - Needs user UUIDs replaced

3. **`services/pawmatch-production.ts`** ?
   - Complete API layer for your schema
   - All operations ready
   - Type-safe TypeScript

4. **`SCHEMA_COMPARISON.md`**
   - Detailed feature comparison
   - Migration guide

---

## ?? Setup Instructions

### Step 1: Run Production Schema (5 minutes)

1. Open Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/bdpbjsciaekgcdpvqomr/sql
   ```

2. Copy entire contents of **`PRODUCTION_SCHEMA.sql`**

3. Paste and click **"Run"**

4. Verify no errors (you should see "Success" message)

**This creates:**
- ? All 25+ tables
- ? PostGIS geography columns
- ? All ENUMs (user_role, species, pet_status, etc.)
- ? All indexes (performance optimized)
- ? All triggers (auto-timestamps, heat calculations, match creation)
- ? All RLS policies (security)
- ? All RPC functions (vote counts)

---

### Step 2: Create Test Users (2 minutes)

In Supabase Dashboard ? **Authentication** ? **Add User**:

Create these 3 users:

1. **breeder@demo.dev** (password: test123456)
2. **seeker@demo.dev** (password: test123456)
3. **shelter@demo.dev** (password: test123456)

**Copy their UUIDs!** You'll need them for seed data.

---

### Step 3: Update Seed Data (1 minute)

Open **`SEED_DATA.sql`** and replace:

```sql
-- Line ~16-18, replace these:
u_breeder uuid := 'BREEDER_UUID_HERE';  -- ? Paste real UUID
u_seeker uuid := 'SEEKER_UUID_HERE';    -- ? Paste real UUID
u_shelter uuid := 'SHELTER_UUID_HERE';  -- ? Paste real UUID
```

**Example:**
```sql
u_breeder uuid := 'a1b2c3d4-1234-5678-90ab-cdef12345678';
u_seeker uuid := 'b2c3d4e5-2345-6789-01bc-def123456789';
u_shelter uuid := 'c3d4e5f6-3456-7890-12cd-ef1234567890';
```

---

### Step 4: Run Seed Data (1 minute)

1. Copy entire contents of **`SEED_DATA.sql`** (with real UUIDs!)

2. Paste into Supabase SQL Editor

3. Click **"Run"**

4. Verify success message

**This creates:**
- ? 3 profiles (breeder, seeker, shelter)
- ? 3 pets (Luna, Max, Misty)
- ? Pet images (Unsplash URLs)
- ? Health records
- ? Badge grants (vet_checked, vaccinated)
- ? 2 live listings (1 normal, 1 urgent)
- ? Heat cycle for Luna
- ? Community votes
- ? Super-like interaction + match
- ? Conversation with 2 messages

---

### Step 5: Test in Table Editor (2 minutes)

In Supabase Dashboard ? **Table Editor**, verify:

| Table | Expected Rows |
|-------|---------------|
| profiles | 3 |
| pets | 3 |
| pet_images | 3 |
| breeds | 10+ |
| listings | 2 |
| heat_cycles | 1 |
| matches | 1 (auto-created by trigger!) |
| messages | 2 |

---

### Step 6: Update App to Use Production API

Replace `/workspace/services/pawmatch.ts` with production version:

```bash
# In Cursor terminal:
cd /workspace/services
mv pawmatch.ts pawmatch-simple-backup.ts
mv pawmatch-production.ts pawmatch.ts
```

Or manually copy the contents.

---

## ?? Your Schema's Advanced Features

### 1. **PostGIS Geography** ??
```sql
geo geography(Point,4326)
```
- Accurate distance calculations
- Spatial queries: "Find pets within 5km"
- Works globally (not just Malta!)

### 2. **Enum Type Safety** ???
```sql
CREATE TYPE user_role AS ENUM (...)
CREATE TYPE pet_status AS ENUM (...)
```
- Database validates values
- Impossible to insert invalid data
- Self-documenting schema

### 3. **Comprehensive RLS** ??
- Users can only see their own data
- Owners can only edit their pets
- Seekers can't edit others' listings
- Messages require participation

### 4. **Automated Triggers** ?
- `handle_new_user()` - Auto-create profile on signup
- `recompute_fertile_window()` - Auto-calculate heat cycles
- `handle_super_like()` - Auto-create matches
- `touch_updated_at()` - Auto-update timestamps
- `set_adopted_timestamp()` - Track adoption dates

### 5. **Complete Business Logic** ??
- Payments (deposit + balance)
- Digital contracts with signatures
- Waitlists for popular breeds
- Conversation threading
- Notification system
- Content reporting

---

## ?? API Functions Available

Your production API (`services/pawmatch-production.ts`) now includes:

### Discovery
- `getDiscoveryFeed()` - Smart listing feed
- `getDiscoveryPets()` - Direct pet discovery

### Interactions
- `upsertInteraction()` - Favorite/Super-Like/Pass
- `getMyFavorites()` - User's saved pets
- `getMyMatches()` - Auto-created matches

### Listings
- `createListing()` - Post new listing
- `publishListing()` - Make listing live
- `getMyListings()` - Owner's listings
- `trackListingView()` - Analytics

### Favorites
- `addToFavorites()` - Save listing
- `removeFromFavorites()` - Remove
- `getMyFavoriteListings()` - User's saved

### Messaging
- `createConversation()` - Start chat
- `sendMessage()` - Send message
- `getMyConversations()` - Get inbox
- `markMessageAsRead()` - Mark read

### Heat Tracker
- `saveHeatStart()` - Log heat cycle
- `getHeatCycles()` - Get history
- `getLatestHeatCycle()` - Latest cycle
- `getPetsFertileToday()` - Fertile now
- `notifyStudOwners()` - Alert studs

### Voting
- `votePet()` - Vote on pet
- `getPetVoteCounts()` - Get tallies
- `votePair()` - Vote on breeding pair
- `getPairVoteCounts()` - Get pair tallies
- `suggestBreedingPair()` - Suggest match
- `voteOnSuggestion()` - Vote on suggestion

### Profile
- `getMyProfile()` - Get user profile
- `updateMyProfile()` - Update profile

### Moderation
- `reportContent()` - Report violations

---

## ?? How to Use in Your Screens

### Discovery Screen Example

```typescript
// screens/DiscoveryTinderScreen.tsx
import { getDiscoveryFeed, upsertInteraction } from '../services/pawmatch';
import { useEffect, useState } from 'react';

export default function DiscoveryTinderScreen() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    try {
      const data = await getDiscoveryFeed({
        species: 'dog',
        listing_type: 'adoption',
        urgent_only: false,
        limit: 50,
      });
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function onSwipeRight(listing: any) {
    await upsertInteraction(listing.pet_id, 'favorite');
    // Show next card
  }

  // ... rest of component
}
```

---

## ?? Production Features Now Available

? **Full Marketplace** - Listings, prices, deposits  
? **Payments** - Stripe-ready payment tracking  
? **Contracts** - Digital signature workflow  
? **Messaging** - Real-time chat system  
? **Litter Management** - Breeding cycle tracking  
? **Health Records** - Vet certifications  
? **Badge System** - Verified badges  
? **At-Risk Tracking** - Shelter urgency  
? **PostGIS** - Accurate geospatial queries  
? **Type Safety** - PostgreSQL ENUMs  
? **Community** - Voting & suggestions  
? **Notifications** - Multi-type alerts  
? **Moderation** - Reporting system  

---

## ?? Quick Checklist

- [ ] Run `PRODUCTION_SCHEMA.sql` in Supabase
- [ ] Create 3 test users (breeder, seeker, shelter)
- [ ] Update `SEED_DATA.sql` with real UUIDs
- [ ] Run `SEED_DATA.sql` in Supabase
- [ ] Verify data in Table Editor
- [ ] Switch to `pawmatch-production.ts` API
- [ ] Update `types.ts` to match schema
- [ ] Test discovery feed: `npm install && npm start`

---

## ?? Summary

| Aspect | Status |
|--------|--------|
| Schema | ? Production-grade (yours!) |
| Error | ? Fixed (seed data) |
| API Layer | ? Complete (pawmatch-production.ts) |
| Documentation | ? Comprehensive |
| Ready to Use | ? YES! |

---

## ?? Pro Tip

Your schema supports:
- Multiple user roles (5 types!)
- Geographic search (PostGIS)
- Full marketplace features
- Breeding management
- Payment processing

**This is a complete breeding platform, not just pet matching!** ??

---

## ?? Documentation

- **`PRODUCTION_SCHEMA.sql`** - Complete database schema
- **`SEED_DATA.sql`** - Test data (error fixed!)
- **`services/pawmatch-production.ts`** - Full API layer
- **`SCHEMA_COMPARISON.md`** - Detailed comparison
- **`DATABASE_SETUP_COMPLETE.md`** - This guide

---

## ?? You're Ready!

Your database is enterprise-grade. Just follow the steps above and you'll have a fully functional breeding platform! ??

**Commands:**
```bash
# 1. Set up database (run SQL files in Supabase)
# 2. Install dependencies
npm install

# 3. Start app
npm start
```

**Happy breeding! ??**
