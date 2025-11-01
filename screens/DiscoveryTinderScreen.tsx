// DiscoveryTinderScreen.tsx
// Alternative Discovery Screen using the Tinder-style swiper library
import React, { useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import TinderSwiper from "../components/TinderSwiper";
import FiltersBar from "../components/FiltersBar";
import { COLORS, SPACING } from "../theme";
import type { Pet, DiscoveryFilters } from "../types";

// Demo user location (Valletta coords)
const USER_COORDS = { lat: 35.8989, lon: 14.5146 };

// Calculate distance in km
function distKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const dx = (a.lat - b.lat) * 111;
  const dy = (a.lon - b.lon) * 85;
  return Math.max(0, Math.round(Math.sqrt(dx * dx + dy * dy)));
}

// Calculate match percentage
function matchPercent(p: Pet): number {
  let score = 50;
  if (p.forAdoption) score += 20;
  if (p.isUrgent) score += 15;
  if ((p.breed || "").toLowerCase().includes("malt")) score += 10;
  return Math.max(5, Math.min(98, score));
}

// Mock data
const MOCK_PETS: Pet[] = [
  {
    id: "1",
    name: "Luna",
    species: "dog",
    breed: "Maltese",
    ageMonths: 10,
    sex: "female",
    forAdoption: true,
    images: [
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=2000&auto=format&fit=crop",
    ],
    health: ["Vet checked", "Dewormed"],
    location: "Valletta",
    coords: { lat: 35.899, lon: 14.515 },
  },
  {
    id: "2",
    name: "Max",
    species: "dog",
    breed: "German Shepherd",
    ageMonths: 20,
    sex: "male",
    forSale: true,
    priceEUR: 700,
    images: [
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=2000&auto=format&fit=crop",
    ],
    health: ["Hip score OK"],
    location: "Sliema",
    coords: { lat: 35.912, lon: 14.504 },
  },
  {
    id: "3",
    name: "Misha",
    species: "cat",
    breed: "Mix",
    ageMonths: 8,
    sex: "female",
    forAdoption: true,
    isUrgent: true,
    images: [
      "https://images.unsplash.com/photo-1511300636408-a63a89df3482?q=80&w=2000&auto=format&fit=crop",
    ],
    location: "Birkirkara",
    coords: { lat: 35.896, lon: 14.468 },
  },
  {
    id: "4",
    name: "Buddy",
    species: "dog",
    breed: "Golden Retriever",
    ageMonths: 36,
    sex: "male",
    forSale: true,
    priceEUR: 850,
    images: [
      "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?q=80&w=2000&auto=format&fit=crop",
    ],
    health: ["Vaccinated", "Neutered"],
    location: "Mdina",
    coords: { lat: 35.887, lon: 14.403 },
  },
  {
    id: "5",
    name: "Whiskers",
    species: "cat",
    breed: "Persian",
    ageMonths: 18,
    sex: "male",
    forAdoption: true,
    images: [
      "https://images.unsplash.com/photo-1501820434261-5bb046afcf6b?q=80&w=2000&auto=format&fit=crop",
    ],
    health: ["Vet checked"],
    location: "Sliema",
    coords: { lat: 35.912, lon: 14.504 },
  },
  {
    id: "6",
    name: "Bella",
    species: "dog",
    breed: "Beagle",
    ageMonths: 14,
    sex: "female",
    forSale: true,
    priceEUR: 600,
    images: [
      "https://images.unsplash.com/photo-1505628346881-b72b27e84530?q=80&w=2000&auto=format&fit=crop",
    ],
    health: ["Vaccinated", "Microchipped"],
    location: "Valletta",
    coords: { lat: 35.899, lon: 14.515 },
  },
  {
    id: "7",
    name: "Shadow",
    species: "cat",
    breed: "Black Mix",
    ageMonths: 6,
    sex: "male",
    forAdoption: true,
    isUrgent: true,
    images: [
      "https://images.unsplash.com/photo-1529257414772-1960b7bea4eb?q=80&w=2000&auto=format&fit=crop",
    ],
    location: "Birkirkara",
    coords: { lat: 35.896, lon: 14.468 },
  },
  {
    id: "8",
    name: "Charlie",
    species: "dog",
    breed: "Labrador",
    ageMonths: 24,
    sex: "male",
    forSale: true,
    priceEUR: 800,
    images: [
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=2000&auto=format&fit=crop",
    ],
    health: ["Vet checked", "Trained"],
    location: "St. Julian's",
    coords: { lat: 35.918, lon: 14.489 },
  },
];

export default function DiscoveryTinderScreen() {
  const [filters, setFilters] = useState<DiscoveryFilters>({
    species: "both",
    adoptSale: "any",
    urgentOnly: false,
  });

  const [likedPets, setLikedPets] = useState<string[]>([]);
  const [dislikedPets, setDislikedPets] = useState<string[]>([]);
  const [superLikedPets, setSuperLikedPets] = useState<string[]>([]);

  // Filter pets based on selected filters
  const filteredPets = useMemo(() => {
    return MOCK_PETS.filter((pet) => {
      if (filters.species !== "both" && pet.species !== filters.species) return false;
      if (filters.adoptSale === "adopt" && !pet.forAdoption) return false;
      if (filters.adoptSale === "sale" && !pet.forSale) return false;
      if (filters.urgentOnly && !pet.isUrgent) return false;
      return true;
    });
  }, [filters]);

  const handleSwipeLeft = (petId: string) => {
    setDislikedPets((prev) => [...prev, petId]);
    console.log("Disliked:", petId);
  };

  const handleSwipeRight = (petId: string) => {
    setLikedPets((prev) => [...prev, petId]);
    console.log("Liked:", petId);
    // Here you would typically save to database or trigger a match notification
  };

  const handleSwipeTop = (petId: string) => {
    setSuperLikedPets((prev) => [...prev, petId]);
    console.log("Super Liked:", petId);
    // Here you would typically trigger a super like notification
  };

  const calculateDistance = (pet: Pet) => {
    return pet.coords ? distKm(USER_COORDS, pet.coords) : 2;
  };

  return (
    <View style={styles.container}>
      {/* Filters Bar */}
      <FiltersBar value={filters} onChange={setFilters} />

      {/* Tinder-style Swiper */}
      <TinderSwiper
        pets={filteredPets}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onSwipeTop={handleSwipeTop}
        showMatchPercent={true}
        showDistance={true}
        calculateMatchPercent={matchPercent}
        calculateDistance={calculateDistance}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.l,
  },
});
