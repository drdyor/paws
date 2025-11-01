// components/FiltersBar.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SPACING } from "../theme";
import type { DiscoveryFilters } from "../types";

type Props = {
  value: DiscoveryFilters;
  onChange: (next: DiscoveryFilters) => void;
};

const Chip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.chip,
      { backgroundColor: active ? COLORS.secondary : "#F2F3F5" },
    ]}
  >
    <Text style={{ color: active ? "#fff" : COLORS.text, fontWeight: "600" }}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function FiltersBar({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>Species</Text>
        <View style={styles.group}>
          <Chip
            label="Dogs"
            active={value.species === "dog"}
            onPress={() => onChange({ ...value, species: "dog" })}
          />
          <Chip
            label="Cats"
            active={value.species === "cat"}
            onPress={() => onChange({ ...value, species: "cat" })}
          />
          <Chip
            label="Both"
            active={value.species === "both"}
            onPress={() => onChange({ ...value, species: "both" })}
          />
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.group}>
          <Chip
            label="Any"
            active={value.adoptSale === "any"}
            onPress={() => onChange({ ...value, adoptSale: "any" })}
          />
          <Chip
            label="Adopt"
            active={value.adoptSale === "adopt"}
            onPress={() => onChange({ ...value, adoptSale: "adopt" })}
          />
          <Chip
            label="Sale"
            active={value.adoptSale === "sale"}
            onPress={() => onChange({ ...value, adoptSale: "sale" })}
          />
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Urgent</Text>
        <View style={styles.group}>
          <Chip
            label="Urgent only"
            active={value.urgentOnly}
            onPress={() => onChange({ ...value, urgentOnly: !value.urgentOnly })}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: COLORS.muted, marginRight: 10 },
  group: { flexDirection: "row", gap: SPACING.s },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});