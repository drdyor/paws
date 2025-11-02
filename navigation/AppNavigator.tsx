import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BreederStack from "./BreederStack";
import SeekerStack from "./SeekerStack";
import ShelterStack from "./ShelterStack";
import VetStack from "./VetStack";
import type { Role } from "../types";

const Stack = createNativeStackNavigator();

export default function AppNavigator({ route }: any) {
  const role: Role = route?.params?.role ?? "seeker";

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {role === "breeder" && <Stack.Screen name="Breeder" component={BreederStack} />}
      {role === "seeker" && <Stack.Screen name="Seeker" component={SeekerStack} />}
      {role === "shelter" && <Stack.Screen name="Shelter" component={ShelterStack} />}
      {role === "vet" && <Stack.Screen name="Vet" component={VetStack} />}
    </Stack.Navigator>
  );
}