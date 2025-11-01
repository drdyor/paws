import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import VetDashboard from "../screens/VetDashboard";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator();

export default function VetStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="VetDashboard" component={VetDashboard} options={{ title: "Vet" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Stack.Navigator>
  );
}