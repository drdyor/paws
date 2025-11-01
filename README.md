# 🐾 PawMatch - Pet Finder App

A React Native pet finder matching app similar to Tinder, built with Expo and TypeScript.

## ✨ Features

- **Tinder-style Discovery**: Swipe through pets with smooth animations and haptic feedback
- **Role-based Access**: Different interfaces for Seeker, Breeder, Shelter, and Vet users
- **Advanced Filters**: Filter by species, adoption/sale type, and urgency
- **Real-time Metrics**: Distance counters and match percentages
- **Responsive Design**: Malta-inspired color scheme with modern UI

## 🚀 Quick Start

### Prerequisites
- Node.js (14.x or higher)
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd pawmatch
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on your device:**
   - Scan the QR code with the Expo Go app
   - Or press `i` for iOS simulator
   - Or press `a` for Android emulator

## 📱 User Roles

### 👤 Seeker
- Browse pets with Tinder-style swipe interface
- Filter by species, adoption/sale type, urgency
- View distance and match percentage
- Like pets to create matches

### 🏠 Breeder
- Manage breeding animals and litters
- Add new animals with details
- Track male/female breeding stock

### 🏥 Shelter
- Manage animal intake
- Mark animals as urgent (72h window)
- Track dogs and cats separately

### 🩺 Vet
- Issue health certificates
- Create vet verification badges
- Track certificate history

## 🛠 Technical Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **State Management**: React Hooks
- **Database**: Supabase (configured)
- **Styling**: Custom theme with responsive design
- **Animations**: React Native Animated API
- **Haptics**: Expo Haptics for tactile feedback

## 📁 Project Structure

```
pawmatch/
├── App.tsx                    # Main app component
├── theme.ts                   # Design system (colors, spacing)
├── types.ts                   # TypeScript type definitions
├── services/
│   └── supabase.ts           # Database client configuration
├── components/
│   ├── Card.tsx              # Reusable card container
│   ├── Button.tsx            # Consistent button component
│   └── FiltersBar.tsx        # Discovery filter controls
├── navigation/
│   ├── AppNavigator.tsx      # Main navigation logic
│   └── [Role]Stack.tsx       # Role-specific navigation stacks
└── screens/
    ├── OnboardingScreen.tsx  # Role selection
    ├── DiscoveryScreen.tsx   # Tinder-style pet discovery
    ├── [Role]Dashboard.tsx   # Role-specific dashboards
    └── ProfileScreen.tsx     # User profile
```

## 🎨 Design System

### Colors
- **Primary**: `#FFC700` (Yellow)
- **Secondary**: `#2F80ED` (Malta Blue)
- **Text**: `#1C1E21`
- **Background**: `#FFFFFF`
- **Border**: `#E5E7EB`
- **Muted**: `#888888`

### Spacing
- **s**: 8px
- **m**: 14px
- **l**: 20px

## 🔧 Configuration

The app comes pre-configured with:
- ✅ Expo SDK 51
- ✅ React Navigation 6
- ✅ TypeScript support
- ✅ Supabase integration
- ✅ Haptic feedback
- ✅ Responsive design

## 🚦 Getting Started Flow

1. **Onboarding**: Select your role (Seeker, Breeder, Shelter, Vet)
2. **Role-specific Interface**: Navigate to your dedicated dashboard
3. **Discovery** (Seekers): Swipe through pets with filters
4. **Management** (Others): Add and manage your pets/animals

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   expo start -c
   ```

2. **Dependency conflicts**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript errors**:
   ```bash
   npx tsc --noEmit
   ```

### Supabase Setup

The app includes a pre-configured Supabase client. To use your own instance:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Update the credentials in `services/supabase.ts`
3. Set up your database tables matching the Pet type in `types.ts`

## 📝 License

This project is created for educational purposes. Feel free to modify and extend for your own use.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Happy pet matching! 🐕🐱**