// screens/DiscoveryTinderScreen.tsx
import React, { useMemo, useState } from "react";
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import Swiper from "react-native-deck-swiper";
import * as Haptics from "expo-haptics";
import Card from "../components/Card";
import Button from "../components/Button";
import FiltersBar from "../components/FiltersBar";
import { COLORS, SPACING } from "../theme";
import type { Pet, DiscoveryFilters } from "../types";

const W = Dimensions.get("window").width;
const H = Dimensions.get("window").height;

const MOCK: Pet[] = [
  {
    id: "1",
    name: "Luna",
    species: "dog",
    breed: "Maltese",
    ageMonths: 10,
    sex: "female",
    forAdoption: true,
    images: ["https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=2000&auto=format&fit=crop"],
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
    images: ["https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=2000&auto=format&fit=crop"],
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
    images: ["https://images.unsplash.com/photo-1511300636408-a63a89df3482?q=80&w=2000&auto=format&fit=crop"],
    location: "Birkirkara",
    coords: { lat: 35.896, lon: 14.468 },
  },
];

// quick demo helpers
const USER_COORDS = { lat: 35.8989, lon: 14.5146 };
function distKm(a: { lat: number; lon: number } | undefined, b: { lat: number; lon: number }) {
  if (!a) return 2;
  const dx = (a.lat - b.lat) * 111;
  const dy = (a.lon - b.lon) * 85;
  return Math.max(0, Math.round(Math.sqrt(dx * dx + dy * dy)));
}
function matchPercent(p: Pet) {
  let s = 50;
  if (p.forAdoption) s += 20;
  if (p.isUrgent) s += 15;
  if ((p.breed || "").toLowerCase().includes("malt")) s += 10;
  return Math.max(5, Math.min(98, s));
}

export default function DiscoveryTinderScreen() {
  const [filters, setFilters] = useState<DiscoveryFilters>({
    species: "both",
    adoptSale: "any",
    urgentOnly: false,
  });

  const deck = useMemo(() => {
    return MOCK.filter((p) => {
      if (filters.species !== "both" && p.species !== filters.species) return false;
      if (filters.adoptSale === "adopt" && !p.forAdoption) return false;
      if (filters.adoptSale === "sale" && !p.forSale) return false;
      if (filters.urgentOnly && !p.isUrgent) return false;
      return true;
    });
  }, [filters]);

  const [index, setIndex] = useState(0);
  const current = deck[index];

  function onSwipedLeft() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIndex((i) => i + 1);
  }
  function onSwipedRight() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: upsert to pet_swipes (direction='like')
    setIndex((i) => i + 1);
  }
  function resetDeck() {
    setIndex(0);
  }

  if (!deck.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.doneTitle}>No pets match your filters</Text>
        <Text style={styles.doneSub}>Adjust filters or reset the deck.</Text>
        <View style={{ height: 12 }} />
        <Button title="Reset Deck" onPress={resetDeck} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* filters */}
      <FiltersBar value={filters} onChange={setFilters} />

      {/* top counters */}
      {current && (
        <View style={styles.headerRow}>
          <View style={styles.badgeSoft}>
            <Text style={styles.badgeSoftText}>?? {distKm(current.coords, USER_COORDS)} km</Text>
          </View>
          <View style={styles.badgeSoft}>
            <Text style={styles.badgeSoftText}>? {matchPercent(current)}% match</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={styles.dots}>
            {deck.slice(index, index + 3).map((_, i) => (
              <View key={i} style={[styles.dot, { opacity: i === 0 ? 1 : 0.35 }]} />
            ))}
          </View>
        </View>
      )}

      {/* swiper deck */}
      <View style={{ flex: 1 }}>
        <Swiper
          cards={deck}
          cardIndex={index}
          renderCard={(p: Pet | undefined) =>
            p ? (
              <Card style={{ padding: 0 }}>
                <Image source={{ uri: p.images[0] }} style={styles.image} />
                <View style={{ padding: 14 }}>
                  <Text style={styles.nameRow}>
                    {p.name} ? {p.breed ?? p.species.toUpperCase()}
                  </Text>
                  <Text style={styles.metaRow}>
                    {p.sex ? p.sex[0].toUpperCase() + p.sex.slice(1) : "?"} ?{" "}
                    {p.ageMonths ? Math.round(p.ageMonths / 12) + "y" : "Age n/a"} ? {p.location || "Malta"}
                  </Text>
                  {p.isUrgent && <Text style={styles.urgent}>?? Urgent (72h window)</Text>}
                  {p.forSale && p.priceEUR && <Text style={styles.price}>?{p.priceEUR}</Text>}
                </View>
              </Card>
            ) : (
              <View style={styles.empty}><Text style={styles.doneTitle}>Loading?</Text></View>
            )
          }
          onSwipedLeft={onSwipedLeft}
          onSwipedRight={onSwipedRight}
          backgroundColor={COLORS.bg}
          stackSize={2}
          stackSeparation={15}
          stackScale={10}
          animateCardOpacity
          animateOverlayLabelsOpacity
          overlayLabels={{
            left: {
              title: "NOPE",
              style: {
                label: styles.badgeText,
                wrapper: { position: "absolute", top: 20, right: 20, borderColor: "#FF3B30", borderWidth: 3, padding: 6, borderRadius: 10, backgroundColor: "rgba(255,59,48,0.1)" }
              }
            },
            right: {
              title: "LIKE",
              style: {
                label: styles.badgeText,
                wrapper: { position: "absolute", top: 20, left: 20, borderColor: "#4CD964", borderWidth: 3, padding: 6, borderRadius: 10, backgroundColor: "rgba(76,217,100,0.1)" }
              }
            }
          }}
          verticalSwipe={false}
        />
      </View>

      {/* action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={onSwipedLeft} style={[styles.pill, { backgroundColor: "#eee" }]}>
          <Text style={{ fontWeight: "700" }}>??</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSwipedRight} style={[styles.pill, { backgroundColor: COLORS.primary }]}>
          <Text style={{ fontWeight: "700" }}>??</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.l },
  image: { width: W - SPACING.l * 2, height: H * 0.45, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  // header
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  badgeSoft: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "#F2F3F5", marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  badgeSoftText: { color: COLORS.text, fontWeight: "600" },
  dots: { flexDirection: "row", gap: 6, marginRight: 2 },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: COLORS.secondary },
  // actions
  actions: { position: "absolute", bottom: 60, width: "100%", flexDirection: "row", justifyContent: "space-evenly", alignItems: "center" },
  pill: { width: 72, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  // text
  nameRow: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  metaRow: { color: COLORS.muted, marginTop: 4 },
  urgent: { color: "#D00", marginTop: 8, fontWeight: "700" },
  price: { marginTop: 8, fontWeight: "700", color: COLORS.secondary },
  badgeText: { fontSize: 16, fontWeight: "900", letterSpacing: 2, color: COLORS.text },
  // empty
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  doneTitle: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  doneSub: { color: COLORS.muted, marginTop: 6 },
});
