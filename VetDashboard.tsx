// screens/VetDashboard.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList } from "react-native";
import Card from "../components/Card";
import Button from "../components/Button";
import { COLORS, SPACING } from "../theme";

type Cert = { id: string; petName: string; badge: string; date: string };

export default function VetDashboard() {
  const [petName, setPetName] = useState("");
  const [badge, setBadge] = useState("Vet checked");
  const [certs, setCerts] = useState<Cert[]>([]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Issue Vet Certificates</Text>

      <Card>
        <Text style={styles.sectionTitle}>New Certificate</Text>
        <TextInput placeholder="Pet Name" value={petName} onChangeText={setPetName} style={styles.input} />
        <TextInput placeholder="Badge (e.g., Vet checked, DNA clear)" value={badge} onChangeText={setBadge} style={styles.input} />
        <Button
          title="Issue"
          onPress={() => {
            if (!petName.trim()) return;
            setCerts((c) => [
              ...c,
              { id: Math.random().toString(36).slice(2), petName: petName.trim(), badge: badge.trim() || "Vet checked", date: new Date().toISOString().slice(0, 10) }
            ]);
            setPetName("");
          }}
        />
      </Card>

      <FlatList
        data={certs}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 12, paddingTop: 12 }}
        renderItem={({ item }) => (
          <Card>
            <Text style={{ fontWeight: "700" }}>{item.petName}</Text>
            <Text style={{ color: COLORS.muted }}>{item.badge}</Text>
            <Text style={{ color: COLORS.muted }}>{item.date}</Text>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.l, backgroundColor: COLORS.bg },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  sectionTitle: { fontWeight: "700", marginBottom: 8, color: COLORS.text },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 8 }
});