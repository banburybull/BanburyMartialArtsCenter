import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { UserProvider, useUser } from '@/context/userContext';
import { MenuProvider } from 'react-native-popup-menu';
import SettingsIcon from '@/components/SettingsIcon';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
 
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return  <UserProvider>
            <RootLayoutNav />
          </UserProvider>
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { loading, userMembership, needsMembershipRedirect } = useUser();

  if (loading) {
    return null; // or a custom loading component
  }

  const isAuthenticated = userMembership !== null;
 return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* 2. Wrap the Stack with MenuProvider */}
      <MenuProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* 1. Handle the highest priority redirect: No Membership */}
          {needsMembershipRedirect ? (
              <Stack.Screen name="no-membership" options={{ headerShown: false }} />
          ) : isAuthenticated ? (
            // 2. Handle Authenticated User (with membership)
            <>
              {/* This is the screen where headerRight is set */}
              <Stack.Screen name="(tabs)" options={{
                 headerShown: false, headerTitle: '', headerBackTitle: '', }} />
              <Stack.Screen name="modal" options={{ 
                presentation: 'modal' }} />
            </>
          ) : (
            // 3. Handle Unauthenticated User
            <Stack.Screen name="login" options={{ headerShown: false }} />
          )}
        </Stack>
      </MenuProvider>
    </ThemeProvider>
  );
}
