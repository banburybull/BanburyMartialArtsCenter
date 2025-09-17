// app/notificationsContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, onSnapshot, query } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { db } from '../FirebaseConfig';

const auth = getAuth();

interface NotificationContextType {
  unreadCount: number;
  loading: boolean;
  dismissedNotificationIds: string[];
  readNotificationIds: string[];
  markAsRead: (id: string) => void;
  markAsDismissed: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  loading: true,
  dismissedNotificationIds: [],
  readNotificationIds: [],
  markAsRead: () => {},
  markAsDismissed: () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  
  useEffect(() => {
    // Load dismissed and read statuses from AsyncStorage on app start
    const loadStatuses = async () => {
      try {
        const dismissedData = await AsyncStorage.getItem('dismissedNotifications');
        const readData = await AsyncStorage.getItem('readNotifications');
        if (dismissedData) {
          setDismissedNotificationIds(JSON.parse(dismissedData));
        }
        if (readData) {
          setReadNotificationIds(JSON.parse(readData));
        }
      } catch (e) {
        console.error('Failed to load notification statuses:', e);
      }
    };
    loadStatuses();
  }, []);

  useEffect(() => {
    // Listen to all notifications from Firestore
    const notificationsQuery = query(collection(db, 'notifications'));
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const allNotificationIds = snapshot.docs.map(doc => doc.id);
      
      const unread = allNotificationIds.filter(id => 
        !readNotificationIds.includes(id) && 
        !dismissedNotificationIds.includes(id)
      );
      setUnreadCount(unread.length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [readNotificationIds, dismissedNotificationIds]);

  const markAsRead = async (id: string) => {
    const newReadIds = [...readNotificationIds, id];
    setReadNotificationIds(newReadIds);
    await AsyncStorage.setItem('readNotifications', JSON.stringify(newReadIds));
    
    // Recalculate unread count
    setUnreadCount(prevCount => prevCount > 0 ? prevCount - 1 : 0);
  };
  
  const markAsDismissed = async (id: string) => {
    const newDismissedIds = [...dismissedNotificationIds, id];
    setDismissedNotificationIds(newDismissedIds);
    await AsyncStorage.setItem('dismissedNotifications', JSON.stringify(newDismissedIds));

    // Recalculate unread count if the dismissed item was unread
    if (!readNotificationIds.includes(id)) {
        setUnreadCount(prevCount => prevCount > 0 ? prevCount - 1 : 0);
    }
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, loading, dismissedNotificationIds, readNotificationIds, markAsRead, markAsDismissed }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);