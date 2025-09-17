import { StyleSheet, View, Alert, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Card, DataTable, Text, Button } from 'react-native-paper';
import { auth, db } from '../../FirebaseConfig';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  arrayRemove,
} from 'firebase/firestore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface ClassesProps {
  onBack: () => void;
}

interface ClassData {
  id: string;
  name: string;
  time: string;
  day: string;
}

export default function Classes({ onBack }: ClassesProps) {
  const [userClasses, setUserClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const userDocRef = doc(db, 'userClasses', userId);
    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const checkedInClassIds = docSnap.data().classes || [];
        const classesData: ClassData[] = [];
        for (const classId of checkedInClassIds) {
          const classRef = doc(db, 'classes', classId);
          const classDoc = await getDoc(classRef);
          if (classDoc.exists()) {
            const data = classDoc.data();
            const date = new Date(data.datetime.seconds * 1000).toLocaleDateString();
            const time = new Date(data.datetime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            classesData.push({
              id: classDoc.id,
              name: data.name,
              time: time,
              day: date,
            });
          }
        }
        setUserClasses(classesData);
      } else {
        setUserClasses([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleCheckout = async (classId: string) => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to check out.');
      return;
    }
    try {
      await runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, 'userClasses', userId);
        const userDoc = await transaction.get(userDocRef);
        if (userDoc.exists()) {
          const currentClasses = userDoc.data().classes as string[];
          const updatedClasses = currentClasses.filter(id => id !== classId);
          transaction.update(userDocRef, { classes: updatedClasses });
        }
      });
      Alert.alert('Success', 'Successfully checked out of the class.');
    } catch (error) {
      console.error('Error checking out:', error);
      Alert.alert('Error', 'Failed to check out of the class.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Button onPress={onBack} mode="outlined" style={styles.backButton}>
        <FontAwesome name="arrow-left" size={16} /> Back
      </Button>
      <Card style={styles.card}>
        <Card.Title title="My Classes" />
        <Card.Content>
          {isLoading ? (
            <Text style={{ textAlign: 'center' }}>Loading...</Text>
          ) : userClasses.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Time</DataTable.Title>
                <DataTable.Title>Name</DataTable.Title>
                <DataTable.Title style={{ justifyContent: 'flex-end' }}>Actions</DataTable.Title>
              </DataTable.Header>
              {userClasses.map((item) => (
                <DataTable.Row key={item.id}>
                  <DataTable.Cell>{item.day}</DataTable.Cell>
                  <DataTable.Cell>{item.time}</DataTable.Cell>
                  <DataTable.Cell>{item.name}</DataTable.Cell>
                  <DataTable.Cell style={styles.actionCell}>
                    <Button
                      mode="contained"
                      onPress={() => handleCheckout(item.id)}
                      style={{ backgroundColor: 'red' }}
                      compact
                    >
                      Checkout
                    </Button>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <Text style={{ textAlign: 'center' }}>You are not checked into any classes.</Text>
          )}
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
    marginBottom: 20,
    padding: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  actionCell: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});