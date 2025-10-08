import { StyleSheet, View, Text, Image, ActivityIndicator, useColorScheme } from 'react-native';
import { useState } from 'react';
import { Card } from 'react-native-paper';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useUser } from '../../context/userContext';
import MemberDetails from '../userDashboardItems/memberDetails';
import Classes from '../userDashboardItems/classes';

import { getThemedStyles, AppBranding, AppColorsExport } from '../../constants/GlobalStyles';

const currentThemeColors = useColorScheme() === 'dark' ? AppColorsExport.dark : AppColorsExport.light;
const styles = getThemedStyles(currentThemeColors);

export default function HomeScreen() {
  const [activeView, setActiveView] = useState<'dashboard' | 'memberDetails' | 'classes'>('dashboard');
  const { displayName, loading } = useUser();
  const userName = displayName || 'Member';

  const renderHeader = () => {
    if (activeView !== 'dashboard') {
      return null; // Don't render the header if not on the dashboard
    }

    return (
      <View style={styles.headerContainer}>
        <Image source={AppBranding.logo} style={styles.logo} />
        {userName && <Text style={styles.welcomeText}>Welcome, {userName}!</Text>}
      </View>
    );
  };

  const renderDashboard = () => (
    <View style={localStyles.dashboardContainer}>
      <Card style={styles.tile} onPress={() => setActiveView('memberDetails')}>
        <View style={styles.tileContent}>
          <FontAwesome name="user-circle" size={40} color={currentThemeColors.tint} />
          <Text style={styles.themedTileText}>Member Details</Text>
        </View>
      </Card>
      <Card style={styles.tile} onPress={() => setActiveView('classes')}>
        <View style={styles.tileContent}>
          <FontAwesome name="calendar-check-o" size={40} color={currentThemeColors.tint} />
          <Text style={styles.themedTileText}>My Classes</Text>
        </View>
      </Card>
    </View>
  );

  const renderView = () => {
    if (loading) {
      return <ActivityIndicator size="large" style={localStyles.loadingIndicator} color={currentThemeColors.tint} />;
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
    <View style={styles.themedContainer}>
      {renderHeader()}
      {renderView()}
    </View>
  );
}

// Local styles are only used to override or define unique dashboard layout rules
const localStyles = StyleSheet.create({
  dashboardContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});