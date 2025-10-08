import { StyleSheet, View, Text, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { useState } from 'react';
import { Card } from 'react-native-paper';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import UserManagement from '../adminDashboardItems/userManagement';
import ClassTemplates from '../adminDashboardItems/classTemplates';
import NotificationManagement from '../adminDashboardItems/notificationManagement';
import ShopItemsManagement from '../adminDashboardItems/shopItemsManagement';

import { getThemedStyles, AppColorsExport } from '../../constants/GlobalStyles';

const currentThemeColors = useColorScheme() === 'dark' ? AppColorsExport.dark : AppColorsExport.light; 
const styles = getThemedStyles(currentThemeColors);

export default function AdminScreen() {
  const [activeView, setActiveView] = useState<'dashboard' | 'users' | 'templates' | 'notifications' | 'shopItems'>('dashboard');

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      <Card style={styles.tile} onPress={() => setActiveView('users')}>
        <View style={styles.tileContent}>
          <FontAwesome name="users" size={40} color={currentThemeColors.tint} />
          <Text style={styles.themedTileText}>User Management</Text>
        </View>
      </Card>
      <Card style={styles.tile} onPress={() => setActiveView('templates')}>
        <View style={styles.tileContent}>
          <FontAwesome name="calendar" size={40} color={currentThemeColors.tint} />
          <Text style={styles.themedTileText}>Class Templates</Text>
        </View>
      </Card>
      <Card style={styles.tile} onPress={() => setActiveView('notifications')}>
        <View style={styles.tileContent}>
          <FontAwesome name="bell" size={40} color={currentThemeColors.tint} />
          <Text style={styles.themedTileText}>Notifications</Text>
        </View>
      </Card>
      <Card style={styles.tile} onPress={() => setActiveView('shopItems')}>
        <View style={styles.tileContent}>
          <FontAwesome name="shopping-bag" size={40} color={currentThemeColors.tint} />
          <Text style={styles.themedTileText}>Shop Items</Text>
        </View>
      </Card>
    </View>
  );

  const renderView = () => {
    switch (activeView) {
      case 'users':
        // Pass theme colors down if needed, but components should handle their own theme
        return <UserManagement onBack={() => setActiveView('dashboard')} />;
      case 'templates':
        return <ClassTemplates onBack={() => setActiveView('dashboard')} />;
      case 'notifications':
        return <NotificationManagement onBack={() => setActiveView('dashboard')} />;
      case 'shopItems':
        return <ShopItemsManagement onBack={() => setActiveView('dashboard')} />;
      default:
        return renderDashboard();
    }
  };

  return (
    <ScrollView style={styles.themedContainer}>
      <Card style={styles.themedCard}>
        <Card.Title titleStyle={styles.themedText} title="Admin Dashboard" />
        <Card.Content>
          {renderView()}
        </Card.Content>
      </Card>
    </ScrollView>
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
});