# Tinder React Native Integration

This document describes the integration of Tinder-style swipe functionality from [tinder-react-native](https://github.com/stevenpersia/tinder-react-native.git) into the Paws project.

## What Was Added

### New Dependencies
- **react-native-deck-swiper** (v2.0.17): A modern card swiper library that provides smooth Tinder-style swipe animations

### New Components

#### 1. `components/SwipeCard.tsx`
A reusable card component inspired by the Tinder CardItem. Features:
- Pet information display (name, breed, age, location)
- Match percentage badge
- Distance indicator
- Urgent adoption badges
- Price display for pets for sale
- Health information
- Action buttons (like, dislike, star, flash)
- Responsive sizing with variant support

**Props:**
```typescript
type SwipeCardProps = {
  pet: Pet;
  variant?: boolean;
  showActions?: boolean;
  onPressLike?: () => void;
  onPressDislike?: () => void;
  onPressStar?: () => void;
  matchPercent?: number;
  distance?: number;
}
```

#### 2. `components/TinderSwiper.tsx`
A swiper container that manages card stacks and swipe interactions. Features:
- Smooth card animations
- Overlay labels (LIKE, NOPE, SUPER LIKE)
- Haptic feedback on swipes
- Card counter
- Stack of upcoming cards
- "No more cards" state

**Props:**
```typescript
type TinderSwiperProps = {
  pets: Pet[];
  onSwipeLeft?: (petId: string) => void;
  onSwipeRight?: (petId: string) => void;
  onSwipeTop?: (petId: string) => void;
  showMatchPercent?: boolean;
  showDistance?: boolean;
  calculateMatchPercent?: (pet: Pet) => number;
  calculateDistance?: (pet: Pet) => number;
}
```

#### 3. `DiscoveryTinderScreen.tsx`
A complete alternative discovery screen showcasing the Tinder-style swiper:
- Integrated filters bar
- Mock pet data with 8 sample pets
- Distance calculation
- Match percentage algorithm
- Swipe tracking (liked, disliked, super liked)

### Reorganized Structure
```
/workspace
  /components
    - Button.tsx (moved)
    - Card.tsx (moved)
    - FiltersBar.tsx (moved)
    - SwipeCard.tsx (new)
    - TinderSwiper.tsx (new)
    - index.ts (new - barrel export)
  /screens (recommendation for future organization)
    - DiscoveryScreen.tsx (existing - manual swipe)
    - DiscoveryTinderScreen.tsx (new - library-based swipe)
```

## How to Use

### Basic Usage

```tsx
import { TinderSwiper } from './components';

function MyScreen() {
  const [likedPets, setLikedPets] = useState<string[]>([]);

  const handleSwipeRight = (petId: string) => {
    setLikedPets(prev => [...prev, petId]);
    // Save to database, trigger notifications, etc.
  };

  return (
    <TinderSwiper
      pets={myPets}
      onSwipeRight={handleSwipeRight}
      onSwipeLeft={handleSwipeLeft}
      calculateMatchPercent={(pet) => calculateMatch(pet)}
      calculateDistance={(pet) => getDistance(pet)}
    />
  );
}
```

### Customizing Cards

```tsx
import { SwipeCard } from './components';

function CustomCard({ pet }: { pet: Pet }) {
  return (
    <SwipeCard
      pet={pet}
      showActions={true}
      matchPercent={85}
      distance={5}
      onPressLike={() => console.log('Liked!')}
      onPressDislike={() => console.log('Noped!')}
    />
  );
}
```

## Two Discovery Screen Options

### Option 1: Original DiscoveryScreen (Manual Swipe)
- Uses custom PanResponder implementation
- Full manual control
- Custom animations
- Good for: Complex custom interactions

### Option 2: DiscoveryTinderScreen (Library-based)
- Uses react-native-deck-swiper library
- Pre-built animations and gestures
- Overlay labels
- Stack management
- Good for: Quick implementation, standard Tinder UX

## Key Features from tinder-react-native

? **Card Stack Swiper** - Smooth card animations with stack preview  
? **Overlay Labels** - LIKE/NOPE/SUPER LIKE badges during swipe  
? **Action Buttons** - Like, dislike, star, and flash buttons  
? **Match Badges** - Visual match percentage indicators  
? **Status Indicators** - Distance, urgency, price displays  
? **Haptic Feedback** - Tactile feedback on interactions  
? **Responsive Design** - Adapts to screen sizes  
? **TypeScript Support** - Full type safety throughout  

## Installation

The required dependency has been added to `package.json`. To install:

```bash
npm install
# or
yarn install
```

## Next Steps

1. **Choose Your Implementation**: Decide between manual swipe (DiscoveryScreen) or library-based (DiscoveryTinderScreen)
2. **Add to Navigation**: Include DiscoveryTinderScreen in your stack navigators
3. **Connect to Backend**: Replace mock data with Supabase queries
4. **Implement Matching**: Add logic to save likes/dislikes and create matches
5. **Add Animations**: Consider adding more custom animations
6. **Test on Devices**: Test swipe gestures on physical devices

## Comparison with Original

| Feature | tinder-react-native | Paws Integration |
|---------|-------------------|------------------|
| Language | JavaScript | TypeScript |
| React Native | 0.59.9 (old) | 0.74.3 (modern) |
| Navigation | react-navigation v3 | @react-navigation/native v6 |
| Swiper | react-native-card-stack-swiper | react-native-deck-swiper |
| Icons | Custom font | Emoji + Native icons |
| State | Local state | Can connect to Supabase |
| Pet Data | Mock human data | Real pet profiles |

## Credits

- Original Tinder Clone: [stevenpersia/tinder-react-native](https://github.com/stevenpersia/tinder-react-native)
- Design Inspiration: [Kishore's Dribbble](https://dribbble.com/shots/5631075-Dating-App-Sketch-Freebie-Day-334-365-Project365)
- Swiper Library: [react-native-deck-swiper](https://github.com/alexbrillant/react-native-deck-swiper)

## License

The original tinder-react-native project is MIT licensed. This integration maintains that spirit while adapting for the Paws project needs.
