# ?? PawMatch Testing Guide

## ?? Prerequisites Checklist

Before you start, make sure you've completed:

- [x] ? Ran `PRODUCTION_SCHEMA.sql` in Supabase
- [x] ? Created 3 users in Supabase Auth
- [x] ? Ran `SEED_DATA.sql` in Supabase (with real UUIDs)
- [ ] ? Clone repo to local machine
- [ ] ? Install dependencies
- [ ] ? Test the app

---

## ?? Step-by-Step Testing Instructions

### Step 1: Get Code on Your Local Machine (2 methods)

#### Method A: If this is already a Git repo
```bash
# In your terminal (not in Cursor yet):
cd ~/Desktop  # or wherever you want the project
git clone YOUR_REPO_URL
cd paws  # or your repo name
code .  # Opens in Cursor
```

#### Method B: If not a Git repo yet (download files)
```bash
# You can download the workspace folder directly
# Or copy files from /workspace to a local folder
```

---

### Step 2: Open in Cursor Desktop

```bash
# Navigate to project folder
cd ~/Desktop/paws  # adjust path

# Open in Cursor
cursor .
# OR
code .  # if Cursor is aliased to 'code'
```

---

### Step 3: Install Dependencies (5 minutes)

```bash
# Make sure you have Node.js installed (v18 or higher)
node --version

# Install dependencies
npm install

# This will install:
# - Expo & React Native
# - React Navigation
# - Supabase client
# - All other dependencies from package.json
```

**Expected output:**
```
added 1234 packages in 2m
```

---

### Step 4: Verify Supabase Connection (1 minute)

Check that `services/supabase.ts` has your credentials:

```typescript
// Should have these:
const supabaseUrl = 'https://bdpbjsciaekgcdpvqomr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

? Already configured!

---

### Step 5: Start Expo Development Server

```bash
npm start
# OR
npx expo start
```

**Expected output:**
```
? Metro waiting on exp://192.168.1.xxx:8081
? Scan the QR code above with Expo Go (Android) or Camera app (iOS)
```

---

### Step 6: Test on Your Phone (3 minutes)

#### For iOS:
1. Open **Camera** app
2. Point at QR code
3. Tap notification ? Opens Expo Go
4. App loads!

#### For Android:
1. Install **Expo Go** from Play Store
2. Open Expo Go
3. Tap "Scan QR Code"
4. Point at QR code
5. App loads!

---

## ?? What to Test

### Test 1: Onboarding Screen
- ? Should see 4 role buttons
- ? Tap "Seeker" ? Should navigate to Discovery

### Test 2: Discovery Screen (Seeker Flow)
- ? Should see pet cards (Luna, Max, or Misty)
- ? Swipe right ? "LIKE" overlay
- ? Swipe left ? "NOPE" overlay
- ? Cards have images
- ? Filters work (dog/cat/both)
- ? Dot pagination shows

### Test 3: Check Real Data
If seed data was loaded correctly, you should see:

**Luna (Border Collie)**
- Name: Luna
- Breed: Border Collie
- Status: Available
- Badge: Vet Verified ?
- Image: Unsplash dog photo

**Max (Golden Retriever)**
- Name: Max
- Breed: Golden Retriever
- Status: Stud Available
- Badge: Vaccinated ?

**Misty (British Shorthair)**
- Name: Misty
- Breed: British Shorthair
- Status: At Risk ??
- Urgent flag

---

## ?? Troubleshooting

### Issue: "npm: command not found"
**Solution:** Install Node.js
```bash
# Mac:
brew install node

# Windows:
# Download from https://nodejs.org
```

### Issue: "Expo Go can't connect"
**Solution:** Make sure phone and computer are on same WiFi

### Issue: Red error screen: "Supabase URL not configured"
**Solution:** Check `services/supabase.ts` has correct URL and key

### Issue: No pets showing in Discovery
**Solution:** Verify seed data was loaded:
```sql
-- In Supabase SQL Editor:
SELECT * FROM pets;
SELECT * FROM listings;
```

### Issue: "Cannot find module '@react-navigation/native'"
**Solution:** 
```bash
npm install
# OR
rm -rf node_modules package-lock.json
npm install
```

### Issue: App crashes on launch
**Solution:** Check logs:
```bash
# In terminal where npm start is running
# Look for error messages
```

---

## ?? Verify Database Connection

### Quick Test: Check if data loads

Add this to `screens/DiscoveryTinderScreen.tsx`:

```typescript
useEffect(() => {
  async function testConnection() {
    const { data, error } = await supabase.from('pets').select('*').limit(5);
    console.log('Pets from DB:', data);
    console.log('Error:', error);
  }
  testConnection();
}, []);
```

Then check Metro bundler console for output.

---

## ?? Expected App Flow

### 1. Launch App
```
App.tsx ? NavigationContainer ? OnboardingScreen
```

### 2. Select "Seeker"
```
OnboardingScreen ? AppNavigator ? SeekerStack ? DiscoveryTinderScreen
```

### 3. Discovery Screen Loads
```
? Fetches pets from Supabase
? Displays cards with images
? Swipe gestures work
? Filters work
```

---

## ?? What You Should See

### Onboarding Screen
```
???????????????????????
?   PawMatch v3       ?
?                     ?
?   Select Role:      ?
?                     ?
?  [ ?? Breeder ]     ?
?  [ ?? Seeker  ]     ?
?  [ ?? Shelter ]     ?
?  [ ????? Vet     ]     ?
???????????????????????
```

### Discovery Screen (Seeker)
```
???????????????????????
? ?? Luna             ?
? Border Collie ?    ?
?                     ?
?   [Photo Here]      ?
?                     ?
? Valletta, Malta     ?
? ?350                ?
?                     ?
? ? ? ?               ? ? Dots
?                     ?
? [??] [??] [Both]    ? ? Filters
???????????????????????
```

---

## ? Success Criteria

Your app is working if:

- ? No red error screens
- ? Onboarding shows 4 roles
- ? Discovery shows pet cards
- ? Cards have images (from Unsplash)
- ? Swipe gestures work smoothly
- ? Filters change the pet list
- ? Haptic feedback on swipe (phone vibrates slightly)
- ? Dot pagination updates
- ? LIKE/NOPE overlays appear

---

## ?? Quick Start Commands

```bash
# 1. Clone/Open project
cd ~/Desktop/paws

# 2. Install dependencies
npm install

# 3. Start dev server
npm start

# 4. Scan QR with phone

# 5. Test!
```

---

## ?? Testing Checklist

### Basic Functionality
- [ ] App launches without errors
- [ ] Onboarding screen appears
- [ ] Can select a role
- [ ] Discovery screen loads
- [ ] Pets appear in cards
- [ ] Images load from Unsplash
- [ ] Can swipe cards
- [ ] Filters work

### Data Integration
- [ ] Real pets from Supabase appear
- [ ] Luna (Border Collie) shows
- [ ] Max (Golden Retriever) shows
- [ ] Misty (British Shorthair) shows
- [ ] Badges display correctly
- [ ] Urgent flag shows for Misty

### UI/UX
- [ ] Cards look good
- [ ] Images display properly
- [ ] Text is readable
- [ ] Buttons are tappable
- [ ] Navigation works
- [ ] No layout issues

---

## ?? Still Having Issues?

### Check Package.json
Make sure you have these dependencies:

```json
{
  "expo": "~51.0.0",
  "react-native": "0.74.0",
  "@supabase/supabase-js": "^2.39.0",
  "@react-navigation/native": "^6.1.0",
  "expo-haptics": "~13.0.0"
}
```

### Verify File Structure
```
/workspace/
  ??? App.tsx
  ??? package.json
  ??? screens/
  ?   ??? OnboardingScreen.tsx
  ?   ??? DiscoveryTinderScreen.tsx
  ?   ??? ...
  ??? navigation/
  ?   ??? AppNavigator.tsx
  ?   ??? ...
  ??? services/
  ?   ??? supabase.ts
  ?   ??? pawmatch-production.ts
  ??? components/
      ??? Button.tsx
      ??? ...
```

---

## ?? You're Ready!

Once you see pets swiping smoothly with real data from Supabase, you're all set! ??

**Next Steps:**
- Test all 4 role flows
- Try filters
- Test swipe gestures
- Verify haptic feedback
- Check match creation

---

## ?? Pro Tips

1. **Keep Metro bundler running** - Don't close the terminal
2. **Shake phone** - Opens Expo dev menu
3. **Reload app** - Press 'r' in Metro terminal
4. **Clear cache** - Press 'Shift + R' in Metro terminal
5. **Check logs** - Watch Metro terminal for errors

---

**Happy Testing! ??**
