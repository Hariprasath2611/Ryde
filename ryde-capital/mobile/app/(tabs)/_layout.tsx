import React from 'react';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Using custom BottomTabs component from src/components/BottomTabs.tsx
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          href: null, // internal alias
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
