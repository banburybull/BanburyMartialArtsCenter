import { StyleSheet, View, Image} from 'react-native';
import { auth, db } from '../../FirebaseConfig';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Text, Card, Button } from 'react-native-paper';
import Branding from '../../constants/Branding';
import Colors from '../../constants/Colors';

export default function HomeScreen() {
  const [userName, setUserName] = useState('User');
  const [membershipDetails, setMembershipDetails] = useState('N/A');
  const [upcomingClasses, setUpcomingClasses] = useState('N/A');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.replace('/login');
      } else {
        // Fetch user data from Firestore
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserName(docSnap.data().name);
            // You would fetch and set membership and classes here
            // For now, these are hardcoded for demonstration
            setMembershipDetails('Active: Gold Member');
            setUpcomingClasses('BJJ - 8:00 PM, Wednesday');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Image source={Branding.logo} style={styles.logo} />
      <Text style={styles.welcomeText}>Welcome, {userName}</Text>

      {/* User Details Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.cardTitle}>Your Dashboard</Text>
          <View style={styles.detailSection}>
            <Text variant="titleMedium"  style={styles.subheading}>Membership Details:</Text>
            <Text style={styles.detailText}>{membershipDetails}</Text>
          </View>
          <View style={styles.detailSection}>
            <Text variant="titleMedium" style={styles.subheading}>Upcoming Classes:</Text>
            <Text style={styles.detailText}>{upcomingClasses}</Text>
          </View>
        </Card.Content>
      </Card>      
      <Button mode="contained" onPress={() => auth.signOut()} style={styles.button}>
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 10,
  },
  detailSection: {
    marginBottom: 15,
  },
  subheading: {
    fontWeight: 'bold',
  },
  detailText: {
    fontSize: 16,
  },
  button: {
    marginTop: 20,
  },
});