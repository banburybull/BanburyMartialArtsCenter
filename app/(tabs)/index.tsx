import { StyleSheet, View, Text, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Card } from 'react-native-paper';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import branding from '../../constants/Branding'; 

// Import the useUser hook from your UserContext file
import { useUser } from '../../context/userContext';

import MemberDetails from '../userDashboardItems/memberDetails';
import Classes from '../userDashboardItems/classes';

export default function HomeScreen() {
  const [activeView, setActiveView] = useState<'dashboard' | 'memberDetails' | 'classes'>('dashboard');

  // Use the useUser hook to access the context values
  const { displayName, loading } = useUser();
  const userName = displayName || 'Member';

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Image source={branding.logo} style={styles.logo} />
      {userName && <Text style={styles.welcomeText}>Welcome, {userName}!</Text>}
    </View>
  );

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      <Card style={styles.tile} onPress={() => setActiveView('memberDetails')}>
        <View style={styles.tileContent}>
          <FontAwesome name="user-circle" size={40} color="#007bff" />
          <Text style={styles.tileText}>Member Details</Text>
        </View>
      </Card>
      <Card style={styles.tile} onPress={() => setActiveView('classes')}>
        <View style={styles.tileContent}>
          <FontAwesome name="calendar-check-o" size={40} color="#28a745" />
          <Text style={styles.tileText}>My Classes</Text>
        </View>
      </Card>
    </View>
  );

  const renderView = () => {
    // Show a loading indicator while the user data is being fetched
    if (loading) {
      return <ActivityIndicator size="large" style={styles.loadingIndicator} />;
    }

    switch (activeView) {
      case 'memberDetails':
        return <MemberDetails onBack={() => setActiveView('dashboard')} />;
      case 'classes':
        return <Classes onBack={() => setActiveView('dashboard')} />;
      default:
        return renderDashboard();
    }
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  dashboardContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tile: {
    width: '45%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginBottom: 20,
  },
  tileContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});