// screens/BreederDashboard.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList } from "react-native";
import Card from "../components/Card";
import Button from "../components/Button";
import { COLORS, SPACING } from "../theme";

type BreedingAnimal = { id: string; name: string; sex: "male" | "female"; breed: string };

export default function BreederDashboard() {
  const [animals, setAnimals] = useState<BreedingAnimal[]>([
    { id: "d1", name: "Bella", sex: "female", breed: "Maltese" },
    { id: "d2", name: "Thor", sex: "male", breed: "German Shepherd" }
  ]);

  const [newName, setNewName] = useState("");
  const [newBreed, setNewBreed] = useState("");
  const [newSex, setNewSex] = useState<"male" | "female">("female");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Breeding Animals</Text>

      <Card>
        <Text style={styles.sectionTitle}>Add Animal</Text>
        <TextInput placeholder="Name" value={newName} onChangeText={setNewName} style={styles.input} />
        <TextInput placeholder="Breed" value={newBreed} onChangeText={setNewBreed} style={styles.input} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button
            title={newSex === "female" ? "♀ Female (selected)" : "♀ Female"}
            onPress={() => setNewSex("female")}
            tone={newSex === "female" ? "primary" : "secondary"}
          />
          <Button
            title={newSex === "male" ? "♂ Male (selected)" : "♂ Male"}
            onPress={() => setNewSex("male")}
            tone={newSex === "male" ? "primary" : "secondary"}
          />
        </View>
        <Button
          title="Add"
          onPress={() => {
            if (!newName.trim()) return;
            setAnimals((a) => [
              ...a,
              { id: Math.random().toString(36).slice(2), name: newName.trim(), breed: newBreed.trim() || "—", sex: newSex }
            ]);
            setNewName(""); setNewBreed("");
          }}
        />
      </Card>

      <FlatList
        data={animals}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 12, paddingTop: 12 }}
        renderItem={({ item }) => (
          <Card>
            <Text style={{ fontWeight: "700" }}>{item.name} · {item.breed}</Text>
            <Text style={{ color: COLORS.muted }}>{item.sex === "female" ? "Female" : "Male"}</Text>
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