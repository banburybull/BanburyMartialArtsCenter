import { StyleSheet, View, Image } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { getAuth } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import Branding from '../constants/Branding';
import Colors from '../constants/Colors';
import { router } from 'expo-router';

export default function NoMembershipScreen() {
  const handleSignOut = () => {
    auth.signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.logoContainer}>
            <Image source={Branding.logo} style={styles.logo} />
          </View>
          <Text style={styles.title}>No Active Membership</Text>
          <Text style={styles.message}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
});