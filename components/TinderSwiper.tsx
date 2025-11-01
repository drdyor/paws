// components/TinderSwiper.tsx
// Enhanced swiper using react-native-deck-swiper library
import React, { useRef, useState } from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import Swiper from "react-native-deck-swiper";
import * as Haptics from "expo-haptics";
import SwipeCard from "./SwipeCard";
import { COLORS, SPACING } from "../theme";
import type { Pet } from "../types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type TinderSwiperProps = {
  pets: Pet[];
  onSwipeLeft?: (petId: string) => void;
  onSwipeRight?: (petId: string) => void;
  onSwipeTop?: (petId: string) => void;
  showMatchPercent?: boolean;
  showDistance?: boolean;
  calculateMatchPercent?: (pet: Pet) => number;
  calculateDistance?: (pet: Pet) => number;
};

export default function TinderSwiper({
  pets,
  onSwipeLeft,
  onSwipeRight,
  onSwipeTop,
  showMatchPercent = true,
  showDistance = true,
  calculateMatchPercent,
  calculateDistance,
}: TinderSwiperProps) {
  const swiperRef = useRef<Swiper<Pet>>(null);
  const [cardIndex, setCardIndex] = useState(0);

  const handleSwipedLeft = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onSwipeLeft && pets[index]) {
      onSwipeLeft(pets[index].id);
    }
  };

  const handleSwipedRight = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (onSwipeRight && pets[index]) {
      onSwipeRight(pets[index].id);
    }
  };

  const handleSwipedTop = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onSwipeTop && pets[index]) {
      onSwipeTop(pets[index].id);
    }
  };

  const renderCard = (pet: Pet) => {
    const matchPercent = calculateMatchPercent ? calculateMatchPercent(pet) : undefined;
    const distance = calculateDistance ? calculateDistance(pet) : undefined;

    return (
      <SwipeCard
        pet={pet}
        showActions={true}
        matchPercent={showMatchPercent ? matchPercent : undefined}
        distance={showDistance ? distance : undefined}
        onPressLike={() => swiperRef.current?.swipeRight()}
        onPressDislike={() => swiperRef.current?.swipeLeft()}
        onPressStar={() => swiperRef.current?.swipeTop()}
      />
    );
  };

  const renderNoMoreCards = () => {
    return (
      <View style={styles.noMoreCards}>
        <Text style={styles.noMoreText}>??</Text>
        <Text style={styles.noMoreTitle}>No more pets!</Text>
        <Text style={styles.noMoreSubtitle}>
          Check back later for more adorable friends
        </Text>
      </View>
    );
  };

  if (pets.length === 0) {
    return renderNoMoreCards();
  }

  return (
    <View style={styles.container}>
      <Swiper
        ref={swiperRef}
        cards={pets}
        renderCard={renderCard}
        onSwipedLeft={handleSwipedLeft}
        onSwipedRight={handleSwipedRight}
        onSwipedTop={handleSwipedTop}
        onSwiped={(index) => setCardIndex(index + 1)}
        cardIndex={cardIndex}
        backgroundColor="transparent"
        stackSize={2}
        stackScale={5}
        stackSeparation={14}
        infinite={false}
        showSecondCard={true}
        animateOverlayLabelsOpacity
        animateCardOpacity
        disableBottomSwipe={true}
        overlayLabels={{
          left: {
            title: "NOPE",
            style: {
              label: {
                backgroundColor: "#FF3B30",
                borderColor: "#FF3B30",
                color: "#fff",
                borderWidth: 2,
                fontSize: 20,
                fontWeight: "bold",
                padding: 10,
                borderRadius: 10,
              },
              wrapper: {
                flexDirection: "column",
                alignItems: "flex-end",
                justifyContent: "flex-start",
                marginTop: 30,
                marginLeft: -30,
              },
            },
          },
          right: {
            title: "LIKE",
            style: {
              label: {
                backgroundColor: "#4CD964",
                borderColor: "#4CD964",
                color: "#fff",
                borderWidth: 2,
                fontSize: 20,
                fontWeight: "bold",
                padding: 10,
                borderRadius: 10,
              },
              wrapper: {
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                marginTop: 30,
                marginLeft: 30,
              },
            },
          },
          top: {
            title: "SUPER LIKE",
            style: {
              label: {
                backgroundColor: COLORS.secondary,
                borderColor: COLORS.secondary,
                color: "#fff",
                borderWidth: 2,
                fontSize: 16,
                fontWeight: "bold",
                padding: 8,
                borderRadius: 10,
              },
              wrapper: {
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              },
            },
          },
        }}
      />
      
      {/* Card counter */}
      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {cardIndex + 1} / {pets.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SPACING.m,
  },
  noMoreCards: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  noMoreText: {
    fontSize: 64,
    marginBottom: SPACING.m,
  },
  noMoreTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  noMoreSubtitle: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: "center",
  },
  counter: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  counterText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
});
