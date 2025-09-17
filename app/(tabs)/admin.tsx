import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { Card, Divider } from 'react-native-paper';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import UserManagement from '../adminDashboardItems/userManagement';
import ClassTemplates from '../adminDashboardItems/classTemplates';
import NotificationManagement from '../adminDashboardItems/notificationManagement';
import ShopItemsManagement from '../adminDashboardItems/shopItemsManagement';

export default function AdminScreen() {
  const [activeView, setActiveView] = useState<'dashboard' | 'users' | 'templates' | 'notifications' | 'shopItems'>('dashboard');

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      <Card style={styles.tile} onPress={() => setActiveView('users')}>
        <View style={styles.tileContent}>
          <FontAwesome name="users" size={40} color="#007bff" />
          <Text style={styles.tileText}>User Management</Text>
        </View>
      </Card>
      <Card style={styles.tile} onPress={() => setActiveView('templates')}>
        <View style={styles.tileContent}>
          <FontAwesome name="calendar" size={40} color="#28a745" />
          <Text style={styles.tileText}>Class Templates</Text>
        </View>
      </Card>
      <Card style={styles.tile} onPress={() => setActiveView('notifications')}>
        <View style={styles.tileContent}>
          <FontAwesome name="bell" size={40} color="#ffc107" />
          <Text style={styles.tileText}>Notifications</Text>
        </View>
      </Card>
      <Card style={styles.tile} onPress={() => setActiveView('shopItems')}>
        <View style={styles.tileContent}>
          <FontAwesome name="shopping-bag" size={40} color="#6c757d" />
          <Text style={styles.tileText}>Shop Items</Text>
        </View>
      </Card>
    </View>
  );

  const renderView = () => {
    switch (activeView) {
      case 'users':
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
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Admin Dashboard" />
        <Card.Content>
          {renderView()}
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
    width: '100%',
    padding: 10,
    marginBottom: 20,
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
});