// screens/OnboardingScreen.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Button from "../components/Button";
import Card from "../components/Card";
import { COLORS, SPACING } from "../theme";
import type { Role } from "../types";
import { useNavigation } from "@react-navigation/native";

const ROLES: { key: Role; title: string; subtitle: string }[] = [
  { key: "breeder", title: "Breeder", subtitle: "Manage pets & litters" },
  { key: "seeker", title: "Seeker", subtitle: "Find & favorite pets" },
  { key: "shelter", title: "Shelter", subtitle: "List & manage animals" },
  { key: "vet", title: "Vet", subtitle: "Verify health & issue certs" }
];

export default function OnboardingScreen() {
  const [selected, setSelected] = useState<Role | null>(null);
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PawMatch Malta</Text>
      <Text style={styles.subtitle}>Choose your role to get started</Text>

      <View style={{ gap: SPACING.m, width: "100%" }}>
        {ROLES.map((r) => (
          <Pressable key={r.key} onPress={() => setSelected(r.key)}>
            <Card
              style={[
                styles.roleCard,
                selected === r.key && { borderColor: COLORS.secondary, borderWidth: 2 }
              ]}
            >
              <Text style={styles.roleTitle}>{r.title}</Text>
              <Text style={styles.roleSubtitle}>{r.subtitle}</Text>
            </Card>
          </Pressable>
        ))}
      </View>

      <Button
        title={selected ? "Continue" : "Select a role"}
        onPress={() => selected && navigation.navigate("AppNavigator", { role: selected })}
        tone="primary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.l, paddingTop: 80, gap: SPACING.l },
  title: { fontSize: 28, fontWeight: "700", color: COLORS.text },
  subtitle: { color: COLORS.muted, marginBottom: 6 },
  roleCard: { padding: 16 },
  roleTitle: { fontSize: 18, fontWeight: "600", color: COLORS.text },
  roleSubtitle: { color: COLORS.muted, marginTop: 4 }
});