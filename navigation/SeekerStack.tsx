import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DiscoveryScreen from "../screens/DiscoveryScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator();

export default function SeekerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Discovery" component={DiscoveryScreen} options={{ title: "Discover" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Stack.Navigator>
  );
}