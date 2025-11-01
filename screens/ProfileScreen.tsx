// screens/ProfileScreen.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Card from "../components/Card";
import Button from "../components/Button";
import { COLORS, SPACING } from "../theme";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <Card>
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>Your Account</Text>
        <Text style={{ color: COLORS.muted }}>Email: demo@pawmatch.mt</Text>
        <Text style={{ color: COLORS.muted }}>Role: (current stack)</Text>
        <View style={{ height: 8 }} />
        <Button title="Log out (stub)" onPress={() => {}} tone="secondary" />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.l, backgroundColor: COLORS.bg },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.text }
});