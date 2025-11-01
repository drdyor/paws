import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { COLORS } from "../theme";

type Props = Readonly<{
  title: string;
  onPress: () => void;
  tone?: "primary" | "secondary";
  style?: ViewStyle | ViewStyle[];
}>;

export default function Button({ title, onPress, tone = "primary", style }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: tone === "primary" ? COLORS.primary : "#EEE" },
        style
      ]}
    >
      <Text
        style={{
          color: tone === "primary" ? "#000" : COLORS.text,
          fontWeight: "600"
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8
  }
});