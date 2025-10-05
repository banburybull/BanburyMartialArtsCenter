import { StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import { getFirestore, collection, query, onSnapshot, doc, getDoc, setDoc, deleteDoc, arrayUnion, arrayRemove, runTransaction, where, getDocs } from 'firebase/firestore';
import { Card, DataTable, Text, Button, Modal, Portal } from 'react-native-paper';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { getAuth } from 'firebase/auth';

import Colors from '@/constants/Colors';
import { db, auth } from '../../FirebaseConfig';
import { useUser } from '../../context/userContext'; // ASSUMING THIS PATH FOR useUser

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
  const { isAdmin, loading: userLoading } = useUser(); // Added userLoading
  const [selectedDay, setSelectedDay] = useState('');
  const [markedDates, setMarkedDates] = useState<Record<string, MarkedDatesProps>>({});
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [userClasses, setUserClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isClassesLoading, setIsClassesLoading] = useState(true); // <-- NEW LOADING STATE

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
        setIsClassesLoading(false); // <-- Set loading to false once classes are loaded
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

  // Handle Admin Cancellation
  const handleAdminCancelClass = async (classId: string, className: string) => {
    if (!isAdmin) {
        Alert.alert('Error', 'You do not have permission to cancel classes.');
        return;
    }

    Alert.alert(
        "Confirm Class Cancellation",
        `Are you sure you want to cancel the class: ${className}? This will delete the class and remove all user check-ins.`,
        [
            { text: "No", style: "cancel" },
            {
                text: "Yes, Cancel",
                onPress: async () => {
                    try {
                        await runTransaction(db, async (transaction) => {
                            // 1. Delete the class document
                            const classRef = doc(db, 'classes', classId);
                            transaction.delete(classRef);
                            
                            // 2. Remove classId from all userClasses documents (check-ins)
                            const userClassesQuery = query(collection(db, 'userClasses'), where('classes', 'array-contains', classId));
                            const userClassesSnapshot = await getDocs(userClassesQuery);

                            userClassesSnapshot.forEach((userDoc) => {
                                transaction.update(userDoc.ref, { classes: arrayRemove(classId) });
                            });
                        });
                        
                        Alert.alert('Success', `${className} has been successfully cancelled and deleted.`);
                    } catch (error) {
                        console.error('Error canceling class:', error);
                        Alert.alert('Error', 'Failed to cancel the class.');
                    }
                },
                style: "destructive"
            }
        ]
    );
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

  // Combine loading states
  const isContentLoading = isClassesLoading || userLoading;

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
              
              {isContentLoading ? ( // <-- CHECK LOADING STATE HERE
                  <Text style={styles.noClassesText}>Loading classes...</Text>
              ) : classesForSelectedDay.length > 0 ? (
              <DataTable>
    <DataTable.Header>
        <DataTable.Title style={{ flex: 0.8 }}>Time</DataTable.Title>
        <DataTable.Title style={{ flex: 2.2 }}>Name</DataTable.Title>
        <DataTable.Title style={{ flex: 3, justifyContent: 'flex-end' }}>Actions</DataTable.Title>
    </DataTable.Header>
    {classesForSelectedDay.map((item) => {
        const isCheckedIn = userClasses.includes(item.id);
        return (
            <DataTable.Row key={item.id}>
                <DataTable.Cell style={{ flex: 0.8 }}>{item.time}</DataTable.Cell>
                <DataTable.Cell style={{ flex: 2.2 }} onPress={() => showDescriptionModal(item)}>
                    {item.name}
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 3, ...styles.actionCell }}>                  
                  {/* USER CHECK IN / CANCEL CHECK IN BUTTON */}
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
                  {/* ADMIN CANCEL BUTTON */}
                  {isAdmin && (
                      <Button
                          mode="contained"
                          onPress={() => handleAdminCancelClass(item.id, item.name)}
                          style={{ backgroundColor: 'orange', marginLeft: 5 }} // Changed color for distinction and using marginLeft
                          compact
                      >
                          Cancel
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
  // ADDED actionCell style for consistent button placement
  actionCell: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Pushes all buttons to the right
    alignItems: 'center',
  }
});