import { StyleSheet, View, Image, Alert } from 'react-native';
import { Button, Card, TextInput } from 'react-native-paper';
import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../FirebaseConfig';
import { router } from 'expo-router';
import Branding from '../constants/Branding';
import Colors from '../constants/Colors';
import { UserMembership } from '../constants/types';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
  await signInWithEmailAndPassword(auth, email, password);
  console.log('User signed in successfully!');
  router.replace('/(tabs)');
} catch (error) {
  console.error('Login failed:', error);
  Alert.alert('Login failed. Please check your credentials.');
}
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.logoContainer}>
            <Image source={Branding.logo} style={styles.logo} />
          </View>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
          />
          <Button mode="contained" onPress={handleLogin} style={styles.button}>
            Log In
          </Button>
          <Button
            mode="text"
            onPress={() => router.push('/create')}
            style={styles.textButton}
          >
            Create an account
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
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  textButton: {
    marginTop: 10,
  },
});