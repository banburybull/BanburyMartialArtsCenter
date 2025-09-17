import { StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import { getFirestore, collection, query, onSnapshot, doc, getDoc, setDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Card, DataTable, Text, Button, Modal, Portal } from 'react-native-paper';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { getAuth } from 'firebase/auth';

import Colors from '@/constants/Colors';
import { db, auth } from '../../FirebaseConfig';

// Define the correct type for the date object from react-native-calendars
interface CalendarDate {
  year: number;
  month: number;
  day: number;
  timestamp: number;
  dateString: string;
}

// Define data types
interface ClassData {
  id: string;
  day: string;
  time: string;
  name: string;
  description: string;
}

interface UserClassRecord {
  classId: string;
}

interface MarkedDatesProps {
  marked?: boolean;
  dotColor?: string;
  selected?: boolean;
  selectedColor?: string;
}

// Localize calendar
LocaleConfig.locales['en'] = {
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  monthNamesShort: ['Jan.', 'Feb.', 'Mar', 'Apr', 'May', 'Jun', 'Jul.', 'Aug', 'Sep.', 'Oct.', 'Nov.', 'Dec.'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today'
};
LocaleConfig.defaultLocale = 'en';

export default function CalendarScreen() {
  const [selectedDay, setSelectedDay] = useState('');
  const [markedDates, setMarkedDates] = useState<Record<string, MarkedDatesProps>>({});
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [userClasses, setUserClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    // Listener for all classes
    const classesQuery = query(collection(db, 'classes'));
    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
        const allClasses: ClassData[] = snapshot.docs.map(doc => {
            const data = doc.data();
            const date = new Date(data.datetime.seconds * 1000 + (data.datetime.nanoseconds / 1000000));
            const day = date.toISOString().split('T')[0];
            const time = date.toTimeString().split(' ')[0].substring(0, 5);

            return {
            id: doc.id,
            day: day,
            time: time,
            name: data.name,
            description: data.description,
            };
        });
        setClasses(allClasses);
    
        const newMarkedDates: Record<string, MarkedDatesProps> = {};
        allClasses.forEach(c => {
            newMarkedDates[c.day] = { marked: true };
        });
        setMarkedDates(newMarkedDates);
    });

    // Listener for user's checked-in classes from a single document
    let unsubscribeUserClasses: (() => void) | undefined;
    if (userId) {
      const userDocRef = doc(db, 'userClasses', userId);
      unsubscribeUserClasses = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const checkedInClasses = docSnap.data().classes || [];
          setUserClasses(checkedInClasses);
        } else {
          setUserClasses([]);
        }
      });
    }

    return () => {
      unsubscribeClasses();
      if (unsubscribeUserClasses) {
        unsubscribeUserClasses();
      }
    };
  }, [userId]);

  const handleDayPress = (day: CalendarDate) => {
    setSelectedDay(day.dateString);
  };

  const handleCheckIn = async (classId: string) => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to check in.');
      return;
    }
    try {
      const userDocRef = doc(db, 'userClasses', userId);
      await setDoc(userDocRef, {
        classes: arrayUnion(classId),
      }, { merge: true });
      Alert.alert('Success', 'You have successfully checked in.');
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert('Error', 'Failed to check in.');
    }
  };

  const handleCancelCheckIn = async (classId: string) => {
    if (!userId) {
      return;
    }
    try {
      const userDocRef = doc(db, 'userClasses', userId);
      await setDoc(userDocRef, {
        classes: arrayRemove(classId),
      }, { merge: true });
      Alert.alert('Success', 'Check-in canceled.');
    } catch (error) {
      console.error('Error canceling check-in:', error);
      Alert.alert('Error', 'Failed to cancel check-in.');
    }
  };

  const showDescriptionModal = (classItem: ClassData) => {
    setSelectedClass(classItem);
    setIsModalVisible(true);
  };

  const hideDescriptionModal = () => {
    setIsModalVisible(false);
    setSelectedClass(null);
  };

  const classesForSelectedDay = classes.filter(c => c.day === selectedDay);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={{
              ...markedDates,
              [selectedDay]: {
                selected: true,
                marked: markedDates[selectedDay]?.marked || false,
                dotColor: markedDates[selectedDay]?.dotColor || 'white',
              },
            }}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          {selectedDay ? (
            <View>
              <Text style={styles.title}>Classes on {selectedDay}</Text>
              {classesForSelectedDay.length > 0 ? (
              <DataTable>
    <DataTable.Header>
        <DataTable.Title style={{ flex: 1 }}>Time</DataTable.Title>
        <DataTable.Title style={{ flex: 2 }}>Name</DataTable.Title>
        <DataTable.Title style={{ flex: 1 }}>Actions</DataTable.Title>
    </DataTable.Header>
    {classesForSelectedDay.map((item) => {
        const isCheckedIn = userClasses.includes(item.id);
        return (
            <DataTable.Row key={item.id}>
                <DataTable.Cell style={{ flex: 1 }}>{item.time}</DataTable.Cell>
                <DataTable.Cell style={{ flex: 2 }} onPress={() => showDescriptionModal(item)}>
                    {item.name}
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1, flexDirection: 'row' }}>
                  {isCheckedIn ? (
                      <Button
                          mode="contained"
                          onPress={() => handleCancelCheckIn(item.id)}
                          style={{ backgroundColor: 'red', marginHorizontal: 0, paddingHorizontal: 0 }}
                          compact
                      >
                          Cancel
                      </Button>
                  ) : (
                      <Button
                          mode="contained"
                          onPress={() => handleCheckIn(item.id)}
                          style={{ marginHorizontal: 0, paddingHorizontal: 0 }}
                          compact
                      >
                          Check In
                      </Button>
                  )}
              </DataTable.Cell>
            </DataTable.Row>
        );
    })}
</DataTable>
              ) : (
                <Text style={styles.noClassesText}>No classes scheduled for this day.</Text>
              )}
            </View>
          ) : (
            <Text style={styles.noClassesText}>Select a day to view classes.</Text>
          )}
        </Card.Content>
      </Card>
      
      <Portal>
        <Modal visible={isModalVisible} onDismiss={hideDescriptionModal} contentContainerStyle={styles.modalContent}>
          {selectedClass && (
            <Card>
              <Card.Title title={selectedClass.name} />
              <Card.Content>
                <Text>Time: {selectedClass.time}</Text>
                <Text style={styles.modalDescription}>{selectedClass.description}</Text>
                <Button onPress={hideDescriptionModal} mode="contained" style={styles.modalButton}>Close</Button>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noClassesText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalDescription: {
    marginTop: 10,
    marginBottom: 20,
  },
  modalButton: {
    marginTop: 10,
  },
});