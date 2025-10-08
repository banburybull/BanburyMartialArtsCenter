import { StyleSheet, View, Image, Alert, useColorScheme, ScrollView } from 'react-native';
import { Button, Card, TextInput } from 'react-native-paper';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import { router } from 'expo-router';
// Import only GlobalStyles exports
import { getThemedStyles, AppBranding, AppColorsExport } from '../constants/GlobalStyles'; 
import { UserMembership } from '../constants/types';

// Placeholder for theme colors (replace with actual theme logic)
const currentThemeColors = useColorScheme() === 'dark' ? AppColorsExport.dark : AppColorsExport.light;

const styles = getThemedStyles(currentThemeColors);

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login failed:', error);
      Alert.alert('Login failed. Please check your credentials.');
    }
  };

  return (
    <ScrollView 
        style={styles.themedContainer}
        contentContainerStyle={styles.scrollViewContent} 
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.logoContainer}>
            <Image source={AppBranding.logo} style={styles.logo} />
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
    </ScrollView>
  );
}