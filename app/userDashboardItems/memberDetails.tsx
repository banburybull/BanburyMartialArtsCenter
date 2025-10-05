import { StyleSheet, View, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Card, Text, Button, TextInput } from 'react-native-paper';
import { getAuth, updateProfile, updateEmail, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore functions
import { auth, db } from '../../FirebaseConfig';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Import the useUser hook
import { useUser } from '../../context/userContext'; 

interface MemberDetailsProps {
  onBack: () => void;
}

export default function MemberDetails({ onBack }: MemberDetailsProps) {
  // Destructure the necessary refresh function
  const { displayName: contextDisplayName, refreshUserData } = useUser(); 
  
  const [displayName, setDisplayName] = useState(contextDisplayName || '');
  const [email, setEmail] = useState(auth.currentUser?.email || '');

  useEffect(() => {
    // Sync local state with context/auth display name
    // This ensures that if the name changes elsewhere (or on initial load), the input updates
    setDisplayName(contextDisplayName || auth.currentUser?.displayName || '');
    // Ensure email is correctly initialized from auth
    setEmail(auth.currentUser?.email || '');
  }, [contextDisplayName]); 

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;

    // Check if the name actually changed
    if (displayName === auth.currentUser.displayName || displayName === contextDisplayName) {
        Alert.alert('Info', 'Display name is already the same.');
        return;
    }

    try {
      // 1. Update Firebase Auth Profile (Necessary for local user object)
      await updateProfile(auth.currentUser, { displayName: displayName });

      // 2. Update Firestore 'users' document (Source of truth for context)
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, { displayName: displayName }, { merge: true });

      // 3. Trigger context refresh
      refreshUserData(); 

      Alert.alert('Success', 'Display name updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update display name.');
    }
  };

  const handleChangeEmail = async () => {
    if (!auth.currentUser) return;
    try {
      // Note: Firebase requires re-authentication for sensitive operations like email change.
      // This is often why the API call fails.
      await updateEmail(auth.currentUser, email);
      Alert.alert('Success', 'Email updated successfully! Please verify your new email.');
    } catch (error) {
      console.error('Error changing email:', error);
      Alert.alert('Error', 'Failed to change email. Please log in again to try.');
    }
  };

  const handlePasswordReset = async () => {
    if (!auth.currentUser || !auth.currentUser.email) {
      Alert.alert('Error', 'Please log in to an account with an email address.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      Alert.alert('Password Reset', 'A password reset email has been sent to your email address.');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      Alert.alert('Error', 'Failed to send password reset email. Please try again later.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Button onPress={onBack} mode="outlined" style={styles.backButton}>
        <FontAwesome name="arrow-left" size={16} /> Back
      </Button>
      <Card style={styles.card}>
        <Card.Title title="Update Profile" />
        <Card.Content>
          <TextInput
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            style={styles.input}
          />
          <Button onPress={handleUpdateProfile} mode="contained" style={styles.button}>
            Update Display Name
          </Button>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
          />
          <Button onPress={handleChangeEmail} mode="contained" style={styles.button}>
            Change Email
          </Button>
          <Button onPress={handlePasswordReset} mode="outlined" style={styles.button}>
            Reset Password
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 20,
    padding: 10,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginBottom: 10,
  },
  backButton: {
    marginBottom: 10,
  },
});