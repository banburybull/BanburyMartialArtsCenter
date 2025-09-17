import { StyleSheet, View, Alert, TouchableOpacity, ScrollView } from 'react-native';
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
    <ScrollView style={styles.container}>
      <Button onPress={onBack} mode="outlined" style={styles.backButton}>
        <FontAwesome name="arrow-left" size={16} /> Back
      </Button>

      {/* New Notification Section */}
      <Card style={styles.card}>
        <Card.Title title="Send New Notification" />
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
          <Button onPress={handleCreateNotification} mode="contained" style={styles.sendButton}>
            Send
          </Button>
        </Card.Content>
      </Card>

      {/* Notification History Section */}
      <Card style={styles.card}>
        <Card.Title title="Notification History" />
        <Card.Content>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Title</DataTable.Title>
              <DataTable.Title>Date</DataTable.Title>
              <DataTable.Title style={{ justifyContent: 'flex-end' }}>Action</DataTable.Title>
            </DataTable.Header>
            {notifications.map((notif) => (
              <DataTable.Row key={notif.id}>
                <TouchableOpacity onPress={() => showHistoryModal(notif)} style={styles.rowClickable}>
                  <DataTable.Cell style={styles.cellWithTouch}>{notif.title}</DataTable.Cell>
                  <DataTable.Cell style={styles.cellWithTouch}>{notif.createdAt.toDate().toLocaleDateString()}</DataTable.Cell>
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
          contentContainerStyle={styles.modalContent}
        >
          {selectedNotification && (
            <Card>
              <Card.Title title={selectedNotification.title} />
              <Card.Content>
                <Text>Date: {selectedNotification.createdAt.toDate().toLocaleDateString()}</Text>
                <Text style={styles.modalBody}>{selectedNotification.body}</Text>
                <Button onPress={hideHistoryModal} mode="contained">Close</Button>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>
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
  input: {
    marginBottom: 10,
  },
  sendButton: {
    marginTop: 10,
  },
  actionCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 'auto',
  },
  backButton: {
    marginBottom: 10,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
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