import { StyleSheet, View, Alert, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  doc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { Card, DataTable, Text, Button, Modal, Portal, TextInput } from 'react-native-paper';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { db } from '../../FirebaseConfig';
import { getThemedStyles, AppColorsExport } from '../../constants/GlobalStyles';

const currentThemeColors = useColorScheme() === 'dark' ? AppColorsExport.dark : AppColorsExport.light;
const styles = getThemedStyles(currentThemeColors);

interface NotificationManagementProps {
  onBack: () => void;
}

interface NotificationData {
  id: string;
  title: string;
  body: string;
  createdAt: Timestamp;
}

export default function NotificationManagement({ onBack }: NotificationManagementProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificationData[];
      setNotifications(fetchedNotifications);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateNotification = async () => {
    if (!notificationTitle || !notificationBody) {
      Alert.alert('Error', 'Title and message cannot be empty.');
      return;
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        title: notificationTitle,
        body: notificationBody,
        createdAt: Timestamp.now(),
        isRead: false,
        isDismissed: false,
        userId: null, // Global notification
      });
      setNotificationTitle(''); // Clear the title input
      setNotificationBody(''); // Clear the body input
      Alert.alert('Success', 'Notification sent!');
    } catch (error) {
      console.error('Error adding notification:', error);
      Alert.alert('Error', 'Failed to create notification.');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this notification? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'notifications', notificationId));
              Alert.alert('Success', 'Notification deleted successfully.');
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification.');
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const showHistoryModal = (notification: NotificationData) => {
    setSelectedNotification(notification);
    setIsHistoryModalVisible(true);
  };

  const hideHistoryModal = () => {
    setSelectedNotification(null);
    setIsHistoryModalVisible(false);
  };

  return (
    <ScrollView style={styles.themedContainer}>
      <Button onPress={onBack} mode="outlined" style={styles.backButton}>
        <FontAwesome name="arrow-left" size={16} color={currentThemeColors.text} /> Back
      </Button>

      {/* New Notification Section */}
      <Card style={styles.themedCard}>
        <Card.Title titleStyle={styles.themedText} title="Send New Notification" />
        <Card.Content>
          <TextInput
            label="Title"
            value={notificationTitle}
            onChangeText={setNotificationTitle}
            style={styles.input}
          />
          <TextInput
            label="Message"
            value={notificationBody}
            onChangeText={setNotificationBody}
            style={styles.input}
            multiline
          />
          <Button onPress={handleCreateNotification} mode="contained" style={[localStyles.sendButton, { backgroundColor: currentThemeColors.tint }]}>
            Send
          </Button>
        </Card.Content>
      </Card>

      {/* Notification History Section */}
      <Card style={styles.themedCard}>
        <Card.Title titleStyle={styles.themedText} title="Notification History" />
        <Card.Content>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title textStyle={styles.themedText}>Title</DataTable.Title>
              <DataTable.Title textStyle={styles.themedText}>Date</DataTable.Title>
              <DataTable.Title style={{ justifyContent: 'flex-end' }} textStyle={styles.themedText}>Action</DataTable.Title>
            </DataTable.Header>
            {notifications.map((notif) => (
              <DataTable.Row key={notif.id}>
                {/* Use a single touchable element to encompass the cells for navigation */}
                <TouchableOpacity onPress={() => showHistoryModal(notif)} style={localStyles.rowClickable}>
                  <DataTable.Cell style={localStyles.cellWithTouch} textStyle={styles.themedText}>{notif.title}</DataTable.Cell>
                  <DataTable.Cell style={localStyles.cellWithTouch} textStyle={styles.themedText}>{notif.createdAt.toDate().toLocaleDateString()}</DataTable.Cell>
                </TouchableOpacity>
                <DataTable.Cell style={styles.actionCell}>
                  <TouchableOpacity onPress={() => handleDeleteNotification(notif.id)}>
                    <FontAwesome name="trash" size={20} color="red" />
                  </TouchableOpacity>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>

      {/* History Modal */}
      <Portal>
        <Modal
          visible={isHistoryModalVisible}
          onDismiss={hideHistoryModal}
          contentContainerStyle={styles.themedModalContent}
        >
          {selectedNotification && (
            <Card style={styles.themedCard}>
              <Card.Title titleStyle={styles.themedText} title={selectedNotification.title} />
              <Card.Content>
                <Text style={styles.themedText}>Date: {selectedNotification.createdAt.toDate().toLocaleDateString()}</Text>
                <Text style={[styles.themedText, localStyles.modalBody]}>{selectedNotification.body}</Text>
                <Button onPress={hideHistoryModal} mode="contained" style={{ backgroundColor: currentThemeColors.tint }}>Close</Button>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>
    </ScrollView>
  );
}

// Local styles for unique layout rules
const localStyles = StyleSheet.create({
  sendButton: {
    marginTop: 10,
  },
  modalBody: {
    marginTop: 15,
    marginBottom: 20,
  },
  rowClickable: {
    flex: 1,
    flexDirection: 'row',
  },
  cellWithTouch: {
    flex: 1,
    borderWidth: 0,
  },
});