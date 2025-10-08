import { StyleSheet, View, Image, useColorScheme } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { auth } from '../FirebaseConfig';
import { router } from 'expo-router';
// Import only GlobalStyles exports
import { getThemedStyles, AppBranding, AppColorsExport } from '../constants/GlobalStyles'; 

const currentThemeColors = useColorScheme() === 'dark' ? AppColorsExport.dark : AppColorsExport.light;

const styles = getThemedStyles(currentThemeColors);

export default function NoMembershipScreen() {
  const handleSignOut = () => {
    auth.signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.themedContainer}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.logoContainer}>
            <Image source={AppBranding.logo} style={styles.logo} />
          </View>
          <Text style={styles.themedTitle}>No Active Membership</Text>
          <Text style={styles.themedMessage }>
            You do not have an active membership in the app. Please contact the administrator for assistance.
          </Text>
          <Button mode="contained" onPress={handleSignOut} style={styles.button}>
            Sign Out
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}