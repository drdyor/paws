// screens/DiscoveryScreen.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
} from "react-native";
import * as Haptics from "expo-haptics";
import Card from "../components/Card";
import Button from "../components/Button";
import FiltersBar from "../components/FiltersBar";
import { COLORS, SPACING } from "../theme";
import type { Pet, DiscoveryFilters } from "../types";

const W = Dimensions.get("window").width;
const H = Dimensions.get("window").height;
const SWIPE_THRESHOLD = W * 0.28;

// ——— demo location (Valletta coords)
const USER_COORDS = { lat: 35.8989, lon: 14.5146 };

// crude distance km (flat Earth ok for UI demo)
function distKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const dx = (a.lat - b.lat) * 111;
  const dy = (a.lon - b.lon) * 85;
  return Math.max(0, Math.round(Math.hypot(dx, dy)));
}

function matchPercent(p: Pet): number {
  // playful mock: adoption gets +20, urgent +15, Malta breeds +10
  let s = 50;
  if (p.forAdoption) s += 20;
  if (p.isUrgent) s += 15;
  if ((p.breed || "").toLowerCase().includes("malt")) s += 10;
  return Math.max(5, Math.min(98, s));
}

const MOCK: Pet[] = [
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
];

// Header counters component (moved outside to avoid recreation on every render)
type HeaderCountersProps = Readonly<{
  current: Pet | undefined;
  filtered: Pet[];
  index: number;
}>;

function HeaderCounters({ current, filtered, index }: HeaderCountersProps) {
  if (!current) return null;
  const km = current.coords ? distKm(USER_COORDS, current.coords) : 2;
  const mp = matchPercent(current);
  
  return (
    <View style={styles.headerRow}>
      <View style={styles.badgeSoft}>
        <Text style={styles.badgeSoftText}>📍 {km} km</Text>
      </View>
      <View style={styles.badgeSoft}>
        <Text style={styles.badgeSoftText}>✨ {mp}% match</Text>
      </View>
      <View style={{ flex: 1 }} />
      {/* dot pagination */}
      <View style={styles.dots}>
        {filtered.slice(index, index + 3).map((pet, i) => (
          <View
            key={`${pet.id}-dot-${i}`}
            style={[
              styles.dot,
              { opacity: i === 0 ? 1 : 0.35, transform: [{ scale: i === 0 ? 1.1 : 1 }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function DiscoveryScreen() {
  const [filters, setFilters] = useState<DiscoveryFilters>({
    species: "both",
    adoptSale: "any",
    urgentOnly: false,
  });

  const filtered = useMemo(() => {
    return MOCK.filter((p) => {
      if (filters.species !== "both" && p.species !== filters.species) return false;
      if (filters.adoptSale === "adopt" && !p.forAdoption) return false;
      if (filters.adoptSale === "sale" && !p.forSale) return false;
      if (filters.urgentOnly && !p.isUrgent) return false;
      return true;
    });
  }, [filters]);

  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const position = useRef(new Animated.ValueXY()).current;

  const current = filtered[index];
  const next = filtered[index + 1];

  // rotate + badges
  const rotate = position.x.interpolate({
    inputRange: [-W / 2, 0, W / 2],
    outputRange: ["-14deg", "0deg", "14deg"],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const nextScale = position.x.interpolate({
    inputRange: [-W, 0, W],
    outputRange: [0.95, 0.98, 0.95],
    extrapolate: "clamp",
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          fling("right");
        } else if (g.dx < -SWIPE_THRESHOLD) {
          fling("left");
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 7,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  function fling(dir: "left" | "right") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(position, {
      toValue: { x: dir === "right" ? W * 1.2 : -W * 1.2, y: 0 },
      duration: 180,
      useNativeDriver: false,
    }).start(() => {
      if (dir === "right" && current) setLiked((l) => [...l, current.id]);
      position.setValue({ x: 0, y: 0 });
      setIndex((i) => i + 1);
    });
  }

  function resetDeck() {
    setIndex(0);
    setLiked([]);
  }

  if (!current) {
    return (
      <View style={styles.empty}>
        <Text style={styles.doneTitle}>No pets match your filters</Text>
        <Text style={styles.doneSub}>Adjust filters or restart the deck.</Text>
        <View style={{ height: 12 }} />
        <Button title="Reset Deck" onPress={resetDeck} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <FiltersBar value={filters} onChange={setFilters} />

      {/* Counters + dots */}
      <HeaderCounters current={current} filtered={filtered} index={index} />

      {/* Next card (peeking) */}
      {next && (
        <Animated.View pointerEvents="none" style={[styles.cardWrap, { transform: [{ scale: nextScale }] }, { zIndex: 0 }]}>
          <Card style={{ padding: 0 }}>
            <Image source={{ uri: next.images[0] }} style={styles.image} />
          </Card>
        </Animated.View>
      )}

      {/* Top card */}
      <Animated.View
        style={[
          styles.cardWrap,
          { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
          { zIndex: 1 },
        ]}
        {...panResponder.panHandlers}
      >
        <Card style={{ padding: 0 }}>
          <Image source={{ uri: current.images[0] }} style={styles.image} />

          {/* LIKE / NOPE badges */}
          <Animated.View style={[styles.badgeLike, { opacity: likeOpacity }]}>
            <Text style={styles.badgeText}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.badgeNope, { opacity: nopeOpacity }]}>
            <Text style={styles.badgeText}>NOPE</Text>
          </Animated.View>

          <View style={{ padding: 14 }}>
            <Text style={styles.nameRow}>
              {current.name} · {current.breed ?? current.species.toUpperCase()}
            </Text>
            <Text style={styles.metaRow}>
              {current.sex ? current.sex[0].toUpperCase() + current.sex.slice(1) : "—"} ·{" "}
              {current.ageMonths ? Math.round(current.ageMonths / 12) + "y" : "Age n/a"} ·{" "}
              {current.location || "Malta"}
            </Text>
            {current.isUrgent && <Text style={styles.urgent}>🚨 Urgent (72h window)</Text>}
            {current.forSale && current.priceEUR && <Text style={styles.price}>€{current.priceEUR}</Text>}
          </View>
        </Card>
      </Animated.View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => fling("left")} style={[styles.pill, { backgroundColor: "#eee" }]}>
          <Text style={{ fontWeight: "700" }}>✖️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => fling("right")} style={[styles.pill, { backgroundColor: COLORS.primary }]}>
          <Text style={{ fontWeight: "700" }}>💛</Text>
        </TouchableOpacity>
      </View>

      {/* liked ids (debug) */}
      <View style={styles.likedRow}>
        <Text style={{ color: COLORS.muted }}>Liked: {liked.length ? liked.join(", ") : "—"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.l, gap: SPACING.m },
  cardWrap: { position: "absolute", top: 120, width: W - SPACING.l * 2, alignSelf: "center" },
  image: { width: "100%", height: H * 0.45, borderTopLeftRadius: 16, borderTopRightRadius: 16 },

  // header chips + dots
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  badgeSoft: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F2F3F5",
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeSoftText: { color: COLORS.text, fontWeight: "600" },
  dots: { flexDirection: "row", gap: 6, marginRight: 2 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.secondary,
  },

  // action buttons
  actions: {
    position: "absolute",
    bottom: 60,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  pill: {
    width: 72,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // labels
  likedRow: { position: "absolute", top: 86, right: 16 },
  nameRow: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  metaRow: { color: COLORS.muted, marginTop: 4 },
  urgent: { color: "#D00", marginTop: 8, fontWeight: "700" },
  price: { marginTop: 8, fontWeight: "700", color: COLORS.secondary },

  // Tinder badges
  badgeText: { fontSize: 16, fontWeight: "900", letterSpacing: 2, color: COLORS.text },
  badgeLike: {
    position: "absolute", top: 16, left: 16,
    paddingVertical: 6, paddingHorizontal: 10,
    borderWidth: 3, borderRadius: 10, borderColor: "#4CD964",
    transform: [{ rotate: "-18deg" }], backgroundColor: "rgba(76,217,100,0.1)",
  },
  badgeNope: {
    position: "absolute", top: 16, right: 16,
    paddingVertical: 6, paddingHorizontal: 10,
    borderWidth: 3, borderRadius: 10, borderColor: "#FF3B30",
    transform: [{ rotate: "18deg" }], backgroundColor: "rgba(255,59,48,0.1)",
  },

  // empty state
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  doneTitle: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  doneSub: { color: COLORS.muted, marginTop: 6 },
});