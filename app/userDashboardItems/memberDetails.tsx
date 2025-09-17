import { StyleSheet, View, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Card, Text, Button, TextInput } from 'react-native-paper';
import { getAuth, updateProfile, updateEmail, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../FirebaseConfig';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface MemberDetailsProps {
  onBack: () => void;
}

export default function MemberDetails({ onBack }: MemberDetailsProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (auth.currentUser) {
      setDisplayName(auth.currentUser.displayName || '');
      setEmail(auth.currentUser.email || '');
    }
  }, []);

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, { displayName: displayName });
      Alert.alert('Success', 'Display name updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update display name.');
    }
  };

  const handleChangeEmail = async () => {
    if (!auth.currentUser) return;
    try {
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