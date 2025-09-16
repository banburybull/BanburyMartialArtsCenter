import { StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import { Button, Card, TextInput, Text } from 'react-native-paper';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../FirebaseConfig';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Branding from '../constants/Branding';
import { Image } from 'react-native';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

export default function CreateAccountScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [displayName, setDisplayName] = useState('');

  const validatePassword = (text: string) => {
    // Password policy check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])[a-zA-Z\d!@#$%^&*()]{8,}$/;    
    if (!passwordRegex.test(text)) {
      setPasswordError('Password must be at least 8 characters, and contain at least one uppercase letter, one lowercase letter, and one number.');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };
  
  const validateConfirmPassword = (text: string) => {
    if (password !== text) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    } else {
      setConfirmPasswordError('');
      return true;
    }
  };

  const handleCreateAccount = async () => {
    if (!validatePassword(password) || !validateConfirmPassword(confirmPassword)) {
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
       // Create a user document in Firestore using the user's UID
      await setDoc(doc(db, 'users', user.uid), {
        name: displayName,
        email: user.email,
        createdAt: new Date(),
      });

      Alert.alert('Success', 'Account created successfully! Please log in.');
      router.replace('/login');
    } catch (error: any) {
      console.error('Account creation failed:', error);
      Alert.alert('Account creation failed', error.message);
    }
    
  };

   return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push('/login')} style={styles.closeButton}>
        <Ionicons name="close-circle-outline" size={30} />
      </TouchableOpacity>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.logoContainer}>
            <Image source={Branding.logo} style={styles.logo} />
          </View>
          <Text style={styles.title}>Create an Account</Text>
          <TextInput
            label="Name"
            value={displayName}
            onChangeText={setDisplayName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
          /> 
           {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            onEndEditing={(e) => validatePassword(e.nativeEvent.text)}
            secureTextEntry
            mode="outlined"
            style={styles.input}
          />
          {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onEndEditing={(e) => validateConfirmPassword(e.nativeEvent.text)}
            secureTextEntry
            mode="outlined"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleCreateAccount}
            style={styles.button}
          >
            Create Account
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
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 24,
    fontWeight: 'bold',
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
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 5,
  },
});