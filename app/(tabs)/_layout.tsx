// _layout.tsx

import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, router } from 'expo-router'; // Import router
import { Pressable, View, Text } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useUser, UserProvider } from '../../context/userContext';

// Initialize Firebase
import { app } from '../../FirebaseConfig';
const auth = getAuth(app);
const db = getFirestore(app);

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
  const colorScheme = useColorScheme();

  // Redirect logic
  useEffect(() => {
    if (!loading && auth.currentUser && userMembership?.membershipType === 'no-membership') {
      router.replace('/create');
    }
  }, [loading, userMembership]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const tabs = [
    <Tabs.Screen
      key="index"
      name="index"
      options={{
        title: 'Home',
        tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="info-circle"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
      }}
    />,
    <Tabs.Screen
      key="calendar"
      name="calendar"
      options={{
        title: 'Calendar',
        tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
      }}
    />,
    <Tabs.Screen
      key="store"
      name="store"
      options={{
        title: 'Store',
        tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
      }}
    />,
  ];

  if (isAdmin) {
    tabs.splice(1, 0, (
      <Tabs.Screen
        key="admin"
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    ));
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      {tabs}
    </Tabs>
  );
}