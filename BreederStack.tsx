import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BreederDashboard from "../screens/BreederDashboard";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator();

export default function BreederStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BreederDashboard" component={BreederDashboard} options={{ title: "Breeder" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Stack.Navigator>
  );
}