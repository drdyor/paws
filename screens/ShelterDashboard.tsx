// screens/ShelterDashboard.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Switch, FlatList } from "react-native";
import Card from "../components/Card";
import Button from "../components/Button";
import { COLORS, SPACING } from "../theme";

type Intake = { id: string; name: string; species: "dog" | "cat"; urgent: boolean };

export default function ShelterDashboard() {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<"dog" | "cat">("dog");
  const [urgent, setUrgent] = useState(false);
  const [intakes, setIntakes] = useState<Intake[]>([]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shelter Intake</Text>

      <Card>
        <Text style={styles.sectionTitle}>New Animal</Text>
        <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button title={species === "dog" ? "Dog (selected)" : "Dog"} onPress={() => setSpecies("dog")} tone={species === "dog" ? "primary" : "secondary"} />
          <Button title={species === "cat" ? "Cat (selected)" : "Cat"} onPress={() => setSpecies("cat")} tone={species === "cat" ? "primary" : "secondary"} />
        </View>
        <View style={styles.switchRow}>
          <Text style={{ color: COLORS.text, fontWeight: "600" }}>🚨 Urgent (72h)</Text>
          <Switch value={urgent} onValueChange={setUrgent} />
        </View>
        <Button
          title="Add Intake"
          onPress={() => {
            if (!name.trim()) return;
            setIntakes((arr) => [...arr, { id: Math.random().toString(36).slice(2), name: name.trim(), species, urgent }]);
            setName(""); setUrgent(false);
          }}
        />
      </Card>

      <FlatList
        data={intakes}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 12, paddingTop: 12 }}
        renderItem={({ item }) => (
          <Card>
            <Text style={{ fontWeight: "700" }}>{item.name} · {item.species.toUpperCase()}</Text>
            {item.urgent && <Text style={{ color: "#D00", marginTop: 6 }}>Urgent (72h)</Text>}
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
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 8 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 8 }
});