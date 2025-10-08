import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity, Alert, useColorScheme, ScrollView } from 'react-native'; 
import { useState, useEffect } from 'react';
import { DataTable, Card, Text, Button } from 'react-native-paper';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { View } from '@/components/Themed';
import { db } from '../FirebaseConfig';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// 1. Import useRouter from expo-router
import { useRouter } from 'expo-router';
import { useNotifications } from '../context/notificationsContext'
// Import only GlobalStyles exports
import { getThemedStyles, AppColorsExport } from '../constants/GlobalStyles';
// Import useSafeAreaInsets
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Assuming this is installed

interface NotificationData {
  id: string;
  title: string;
  body: string;
  createdAt: {
    toDate(): Date;
  };
}
const currentThemeColors = useColorScheme() === 'dark' ? AppColorsExport.dark : AppColorsExport.light;

const globalStyles = getThemedStyles(currentThemeColors);

export default function NotificationsScreen() {
  // 2. Get the router object
  const router = useRouter();
  // 3. Get safe area insets
  const insets = useSafeAreaInsets();

  const { dismissedNotificationIds, readNotificationIds, markAsRead, markAsDismissed } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const allNotifications: NotificationData[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificationData[];

      const filteredNotifications = allNotifications.filter(
        (notif) => !dismissedNotificationIds.includes(notif.id)
      );

      setNotifications(filteredNotifications);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [dismissedNotificationIds]);

  useEffect(() => {
    // Set all unread notifications to be expanded by default
    const unreadIds = notifications
      .filter((notif) => !readNotificationIds.includes(notif.id))
      .map((notif) => notif.id);
    setExpandedIds(unreadIds);
  }, [notifications, readNotificationIds]);

  const handleToggleExpand = async (notification: NotificationData) => {
    // If notification is unread, mark as read
    if (!readNotificationIds.includes(notification.id)) {
      markAsRead(notification.id);
    }

    // Toggle the expanded state for the selected notification
    setExpandedIds(prevExpandedIds => {
      if (prevExpandedIds.includes(notification.id)) {
        return prevExpandedIds.filter(id => id !== notification.id);
      } else {
        return [...prevExpandedIds, notification.id];
      }
    });
  };

  const handleDismiss = async (notificationId: string) => {
    Alert.alert(
      'Dismiss',
      'Are you sure you want to dismiss this notification?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Dismiss',
          onPress: () => {
            markAsDismissed(notificationId);
            
            // FIX: Immediately filter the local notifications state 
            // to ensure instantaneous removal from the view.
            setNotifications(prevNotifications => 
              prevNotifications.filter(notif => notif.id !== notificationId)
            );
            
            // Remove from expanded list
            setExpandedIds(prevExpandedIds => prevExpandedIds.filter(id => id !== notificationId));
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    // Apply top inset padding here
    <ScrollView style={[localStyles.container, { paddingTop: insets.top }]}>
      
      {/* Screen Title: Now at the top */}
      <Text style={[globalStyles.themedTitle, localStyles.titleMargin]}>Notifications</Text> 
      
      {/* Back Button: Now below the title */}
      <Button 
        onPress={() => {
          console.log("back pressed");
          router.back()
        }} 
        mode="outlined" 
        style={globalStyles.backButton}
      >
        <FontAwesome name="arrow-left" size={16} color={currentThemeColors.text} /> Back
      </Button>

      {isLoading ? (
        <Text>Loading notifications...</Text>
      ) : notifications.length === 0 ? (
        <Text>You have no notifications.</Text>
      ) : (
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Status</DataTable.Title>
            <DataTable.Title>Title</DataTable.Title>
            <DataTable.Title>Date</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>
          {notifications.map((item) => {
            const isRead = readNotificationIds.includes(item.id);
            const isExpanded = expandedIds.includes(item.id);

            return (
              <View key={item.id}>
                <TouchableOpacity onPress={() => handleToggleExpand(item)}>
                  <DataTable.Row style={!isRead && localStyles.unreadRow}>
                    <DataTable.Cell>
                      {isRead ? <FontAwesome name="check-circle" color="green" /> : <FontAwesome name="bell" color="orange" />}
                    </DataTable.Cell>
                    <DataTable.Cell>{item.title}</DataTable.Cell>
                    <DataTable.Cell>
                      {item.createdAt.toDate().toLocaleDateString()}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <TouchableOpacity onPress={() => handleDismiss(item.id)}>
                        <FontAwesome name="times-circle" size={20} color="red" />
                      </TouchableOpacity>
                    </DataTable.Cell>
                  </DataTable.Row>
                </TouchableOpacity>
                {isExpanded && (
                  <View style={localStyles.expandedContent}>
                    <Text>{item.body}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </DataTable>
      )}

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    // Removed explicit paddingTop here, now handled by insets.top
  },
  unreadRow: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  expandedContent: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  titleMargin: { 
    marginBottom: 10,
    // marginTop is no longer needed since safe area insets handle top spacing
  }
});