// (tabs)/_layout.tsx - FIXED
import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Pressable, View, Text } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useUser, UserProvider } from '../../context/userContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { app } from '../../FirebaseConfig';
import SettingsIcon from '@/components/SettingsIcon';
const auth = getAuth(app);
const db = getFirestore(app);

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <PaperProvider>
      <UserProvider>
        <AppTabs />
      </UserProvider>
    </PaperProvider>
  );
}

function AppTabs() {
  const { isAdmin, loading, userMembership } = useUser();

  // Redirect logic
  useEffect(() => {
    // Only redirect if loading is complete, user is logged in, and membership is invalid
    if (!loading && auth.currentUser && userMembership?.membershipType === 'no-membership') {
      router.replace('/create');
    }
  }, [loading, userMembership]);

  if (loading) {
    // Block rendering entirely while data is loading
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Tabs screenOptions={{ headerShown: false}}>      
      {/* Home Tab: Now inherits header options from <Tabs> */}
      <Tabs.Screen
        key="index"
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: true,
          headerRight: () => <SettingsIcon />,
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      
      {/* ADMIN TAB: Now inherits header options from <Tabs> */}
      <Tabs.Screen
        key="admin"
        name="admin"
        options={{
          headerShown: true,
          headerRight: () => <SettingsIcon />,
          title: 'Admin',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          href: isAdmin ? '/admin' : null, 
        }}
      />

      <Tabs.Screen
        key="calendar"
        name="calendar"
        options={{
          headerShown: true,
          headerRight: () => <SettingsIcon />,
          title: 'Calendar',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />

      <Tabs.Screen
        key="store"
        name="store"
        options={{
          headerShown: true,
          headerRight: () => <SettingsIcon />,
          title: 'Store',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
        }}
      />
    </Tabs>
  );
}