// components/SwipeCard.tsx
// Inspired by tinder-react-native CardItem component
import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { COLORS } from "../theme";
import type { Pet } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type SwipeCardProps = {
  pet: Pet;
  variant?: boolean;
  showActions?: boolean;
  onPressLike?: () => void;
  onPressDislike?: () => void;
  onPressStar?: () => void;
  matchPercent?: number;
  distance?: number;
};

export default function SwipeCard({
  pet,
  variant = false,
  showActions = false,
  onPressLike,
  onPressDislike,
  onPressStar,
  matchPercent,
  distance,
}: SwipeCardProps) {
  const imageStyle = {
    borderRadius: 8,
    width: variant ? SCREEN_WIDTH / 2 - 30 : SCREEN_WIDTH - 40,
    height: variant ? 170 : 400,
    marginBottom: 10,
  };

  const nameStyle = {
    paddingTop: variant ? 10 : 15,
    paddingBottom: variant ? 5 : 7,
    color: COLORS.text,
    fontSize: variant ? 15 : 28,
    fontWeight: "700" as const,
  };

  const getAge = () => {
    if (!pet.ageMonths) return "Age n/a";
    const years = Math.floor(pet.ageMonths / 12);
    const months = pet.ageMonths % 12;
    if (years === 0) return `${months}m`;
    if (months === 0) return `${years}y`;
    return `${years}y ${months}m`;
  };

  const description = [
    pet.sex ? pet.sex.charAt(0).toUpperCase() + pet.sex.slice(1) : "",
    getAge(),
    pet.location || "Malta",
  ]
    .filter(Boolean)
    .join(" ? ");

  return (
    <View style={styles.container}>
      {/* Image */}
      <Image source={{ uri: pet.images[0] }} style={imageStyle} />

      {/* Match Percentage Badge */}
      {matchPercent !== undefined && (
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>?? {matchPercent}% Match!</Text>
        </View>
      )}

      {/* Distance Badge */}
      {distance !== undefined && (
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>?? {distance} km away</Text>
        </View>
      )}

      {/* Pet Name & Breed */}
      <Text style={nameStyle}>
        {pet.name} ? {pet.breed || pet.species.toUpperCase()}
      </Text>

      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {/* Urgent Badge */}
      {pet.isUrgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>?? Urgent (72h window)</Text>
        </View>
      )}

      {/* Price */}
      {pet.forSale && pet.priceEUR && (
        <Text style={styles.price}>?{pet.priceEUR}</Text>
      )}

      {/* Health Info */}
      {pet.health && pet.health.length > 0 && (
        <Text style={styles.health}>? {pet.health.join(", ")}</Text>
      )}

      {/* Action Buttons */}
      {showActions && (
        <View style={styles.actions}>
          {onPressStar && (
            <TouchableOpacity style={styles.miniButton} onPress={onPressStar}>
              <Text style={styles.starIcon}>?</Text>
            </TouchableOpacity>
          )}

          {onPressDislike && (
            <TouchableOpacity style={styles.button} onPress={onPressDislike}>
              <Text style={styles.dislikeIcon}>??</Text>
            </TouchableOpacity>
          )}

          {onPressLike && (
            <TouchableOpacity style={styles.button} onPress={onPressLike}>
              <Text style={styles.likeIcon}>??</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.miniButton}>
            <Text style={styles.flashIcon}>?</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    padding: 16,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowColor: "#000",
    shadowOffset: { height: 0, width: 0 },
    elevation: 5,
  },
  matchBadge: {
    marginTop: -35,
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  matchText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  distanceBadge: {
    marginTop: 8,
    backgroundColor: "#F2F3F5",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  distanceText: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 12,
  },
  description: {
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 14,
    marginTop: 4,
  },
  urgentBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#FFE5E5",
  },
  urgentText: {
    color: "#D00",
    fontWeight: "700",
    fontSize: 13,
  },
  price: {
    marginTop: 8,
    fontWeight: "700",
    color: COLORS.secondary,
    fontSize: 18,
  },
  health: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowColor: "#000",
    shadowOffset: { height: 8, width: 0 },
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  miniButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowColor: "#000",
    shadowOffset: { height: 5, width: 0 },
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  starIcon: {
    fontSize: 20,
  },
  likeIcon: {
    fontSize: 28,
  },
  dislikeIcon: {
    fontSize: 24,
  },
  flashIcon: {
    fontSize: 20,
  },
});
