# ? SEED DATA READY TO RUN!

## ?? Real User UUIDs Applied

| Role | UUID |
|------|------|
| **Breeder** | `c5f922f8-6c50-40a2-912d-a011e5725ce6` |
| **Seeker** | `78de48d9-0638-4a98-9e97-a863cbd41d28` |
| **Shelter** | `0ded84ca-caae-4851-82bb-77bdaf25e1b9` |

---

## ?? Run Seed Data Now (2 minutes)

### Step 1: Open Supabase SQL Editor
```
https://supabase.com/dashboard/project/bdpbjsciaekgcdpvqomr/sql
```

### Step 2: Copy SEED_DATA.sql
Copy the **entire contents** of `/workspace/SEED_DATA.sql`

### Step 3: Paste & Run
1. Paste into SQL Editor
2. Click **"Run"** button
3. Wait for success message (should take 2-3 seconds)

---

## ?? What This Creates

### Profiles (3)
- ? **Indy Breeder** (breeder@demo.dev) - Independent breeder in Valletta
- ? **Pet Seeker** (seeker@demo.dev) - Looking for pets in Malta
- ? **Valletta Shelter** (shelter@demo.dev) - Animal shelter

### Pets (3)
1. **Luna** ??
   - Border Collie, female, in heat
   - Owner: Breeder
   - Status: Available for breeding
   - Has health check badge ?
   - Has active heat cycle

2. **Max** ??
   - Golden Retriever, male, stud
   - Owner: Breeder
   - Status: Stud available
   - Has vaccination badge ?
   - Health records on file

3. **Misty** ??
   - British Shorthair, female
   - Owner: Shelter
   - Status: **At risk** (urgent placement needed!)
   - At-risk until: 14 days from today

### Listings (2)
1. **Luna ? Border Collie** - ?350, Live listing
2. **URGENT: Misty (British Shorthair)** - Free adoption, Urgent flag ??

### Health Records (2)
- Max: Rabies booster (30 days ago)
- Luna: Annual health check (60 days ago)

### Heat Cycle (1)
- **Luna's heat cycle** started 2 days ago
- Auto-computed fertile window: Days 10-14
- Auto-computed estimated ovulation: Day 12
- Next heat estimate: 180 days from start

### Community Interaction (2)
- Seeker upvoted Luna ??
- Seeker downvoted Misty ??

### Match (1)
- **Seeker ? Luna** (auto-created by trigger!)
- Created when seeker super-liked Luna
- Status: New

### Conversation (1)
**Between Breeder & Seeker:**
- **Seeker**: "Hi! Super liked Luna ? is she available to meet this week?"
- **Breeder**: "Yes! Wednesday evening in Valletta works. I'll share the vet papers."

---

## ? Triggers That Auto-Fire

When you run the seed data, these triggers will automatically execute:

### 1. `handle_super_like()`
- When seeker super-likes Luna
- **Auto-creates** match record
- Links seeker ? breeder

### 2. `recompute_fertile_window()`
- When Luna's heat cycle is inserted
- **Auto-calculates**:
  - Estimated ovulation: `heat_start_date + 12 days`
  - Fertile window: Days 10-14
  - Next heat estimate: `heat_start_date + 180 days`

### 3. `touch_updated_at()`
- On every update
- **Auto-updates** `updated_at` timestamp

---

## ?? Verify in Table Editor

After running, check these tables in Supabase Dashboard ? **Table Editor**:

| Table | Expected Rows | What to Check |
|-------|---------------|---------------|
| `profiles` | 3 | Names: "Indy Breeder", "Pet Seeker", "Valletta Shelter" |
| `pets` | 3 | Names: Luna, Max, Misty |
| `pet_images` | 3 | All have Unsplash image URLs |
| `listings` | 2 | 1 normal, 1 urgent |
| `heat_cycles` | 1 | Luna's cycle with auto-computed dates |
| `matches` | 1 | Seeker ? Luna (auto-created!) |
| `pet_interactions` | 1 | Seeker super-liked Luna |
| `pet_votes` | 2 | 1 upvote, 1 downvote |
| `messages` | 2 | Conversation between breeder & seeker |
| `conversation_participants` | 2 | Breeder and seeker in conversation |
| `badge_grants` | 2 | Luna (vet_checked), Max (vaccinated) |
| `health_records` | 2 | Max (rabies), Luna (checkup) |

---

## ?? Test Discovery Feed

After seed data is loaded, test the app:

```bash
cd /workspace
npm install
npm start
```

Scan QR code with Expo Go, then:

1. **Login as seeker** (seeker@demo.dev)
2. Open Discovery screen
3. You should see:
   - **Luna** (Border Collie, ?350, in heat)
   - **Misty** (British Shorthair, FREE, URGENT flag!)
4. Swipe right ? Creates interaction
5. Super-like ? Auto-creates match!

---

## ?? Sample Queries to Try

After seed data loads, try these in SQL Editor:

### See all pets with images
```sql
SELECT 
  p.name, 
  p.species, 
  p.breed, 
  p.status,
  pi.url as first_image
FROM pets p
LEFT JOIN pet_images pi ON pi.pet_id = p.id AND pi.sort_order = 0
WHERE p.deleted_at IS NULL;
```

### See fertile pets today
```sql
SELECT * FROM v_pets_fertile_today;
```

### See all matches
```sql
SELECT 
  m.status,
  p.name as pet_name,
  seeker.full_name as seeker_name,
  owner.full_name as owner_name
FROM matches m
JOIN pets p ON p.id = m.pet_id
JOIN profiles seeker ON seeker.id = m.seeker_user_id
JOIN profiles owner ON owner.id = m.owner_user_id;
```

### Get vote counts for Luna
```sql
SELECT * FROM pet_vote_counts('9a1e1111-aaaa-4bbb-cccc-111111111111');
```

### See conversation messages
```sql
SELECT 
  sender.full_name as sender,
  receiver.full_name as receiver,
  content,
  created_at
FROM messages m
JOIN profiles sender ON sender.id = m.sender_id
JOIN profiles receiver ON receiver.id = m.receiver_id
ORDER BY created_at;
```

---

## ? Success Indicators

You'll know it worked if:

- ? No SQL errors
- ? 3 rows in `profiles` table
- ? 3 rows in `pets` table
- ? 1 row in `matches` (auto-created by trigger!)
- ? Heat cycle has `fertile_window_start` populated (auto-computed!)
- ? Messages exist in conversation

---

## ?? You're Done!

After running seed data, you have:

- ? Complete test dataset
- ? All relationships connected
- ? Triggers tested
- ? Ready for app testing

**Next:** Test the app with `npm start` and login as any of the 3 users! ??

---

## ?? Troubleshooting

### Error: "violates foreign key constraint"
**Solution:** Make sure you ran `PRODUCTION_SCHEMA.sql` first!

### Error: "duplicate key value violates unique constraint"
**Solution:** Seed data already loaded! Safe to ignore or delete existing data first.

### No errors but tables empty
**Solution:** Check you're looking at the correct database project in Supabase dashboard.

### Triggers didn't fire
**Solution:** Verify triggers exist:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%super%' OR tgname LIKE '%heat%';
```

---

## ?? Files Reference

- **`PRODUCTION_SCHEMA.sql`** - Run this first (creates all tables)
- **`SEED_DATA.sql`** - Run this second (with real UUIDs ?)
- **`services/pawmatch-production.ts`** - API layer for your app
- **`DATABASE_SETUP_COMPLETE.md`** - Full setup guide

---

**Ready to run! Copy `SEED_DATA.sql` to Supabase now!** ??
