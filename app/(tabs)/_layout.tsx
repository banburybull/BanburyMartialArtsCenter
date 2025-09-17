// (tabs)/_layout.tsx
import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Pressable, View, Text } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useUser, UserProvider } from '../../context/userContext';
import NotificationsIcon from '../../components/notificationsIcon';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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
        headerRight: () => <NotificationsIcon />, // Use the new component here
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
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      {tabs}
    </Tabs>
  );
}