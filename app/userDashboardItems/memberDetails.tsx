import { StyleSheet, View, Alert, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { useState, useEffect } from 'react';
import { Card, Text, Button, TextInput } from 'react-native-paper';
import { getAuth, updateProfile, updateEmail, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../../FirebaseConfig';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useUser } from '../../context/userContext'; 
import { getThemedStyles, AppColorsExport } from '../../constants/GlobalStyles';

const currentThemeColors = useColorScheme() === 'dark' ? AppColorsExport.dark : AppColorsExport.light; 
const styles = getThemedStyles(currentThemeColors);

interface MemberDetailsProps {
  onBack: () => void;
}

export default function MemberDetails({ onBack }: MemberDetailsProps) {
  const { displayName: contextDisplayName, refreshUserData } = useUser(); 
  
  const [displayName, setDisplayName] = useState(contextDisplayName || '');
  const [email, setEmail] = useState(auth.currentUser?.email || '');

  useEffect(() => {
    setDisplayName(contextDisplayName || auth.currentUser?.displayName || '');
    setEmail(auth.currentUser?.email || '');
  }, [contextDisplayName]); 

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;

    if (displayName === auth.currentUser.displayName || displayName === contextDisplayName) {
        Alert.alert('Info', 'Display name is already the same.');
        return;
    }

    try {
      await updateProfile(auth.currentUser, { displayName: displayName });
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, { displayName: displayName }, { merge: true });
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
    <ScrollView style={styles.themedContainer}>
      <Button onPress={onBack} mode="outlined" style={styles.backButton}>
        <FontAwesome name="arrow-left" size={16} color={currentThemeColors.text} /> Back
      </Button>
      <Card style={styles.themedCard}>
        <Card.Title titleStyle={styles.themedText} title="Update Profile" />
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