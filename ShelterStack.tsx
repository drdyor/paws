import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ShelterDashboard from "../screens/ShelterDashboard";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator();

export default function ShelterStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ShelterDashboard" component={ShelterDashboard} options={{ title: "Shelter" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Stack.Navigator>
  );
}