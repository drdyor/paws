import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DiscoveryTinderScreen from "../screens/DiscoveryTinderScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator();

export default function SeekerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Discovery" 
        component={DiscoveryTinderScreen} 
        options={{ title: "Discover Pets" }} 
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: "Profile" }} 
      />
    </Stack.Navigator>
  );
}