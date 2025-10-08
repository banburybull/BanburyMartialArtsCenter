import { StyleSheet, View, Alert, ScrollView, useColorScheme } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { Card, DataTable, Text, Button, SegmentedButtons } from 'react-native-paper';
import { auth, db } from '../../FirebaseConfig';
import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { getThemedStyles, AppColorsExport } from '../../constants/GlobalStyles';

const currentThemeColors = useColorScheme() === 'dark' ? AppColorsExport.dark : AppColorsExport.light;
const styles = getThemedStyles(currentThemeColors);

// Define a type for a single class item with date as a Date object for comparison
interface ClassData {
  id: string;
  name: string;
  time: string;
  day: string; // Formatted date string
  datetime: Date; // Actual Date object for sorting/filtering
}

interface ClassesProps {
  onBack: () => void;
}

// --- Component for Rendering Class Lists (Future & Past) ---

interface ClassListProps {
    classes: ClassData[];
    isFuture: boolean;
    handleCheckout?: (classId: string) => Promise<void>;
}

const ClassList = ({ classes, isFuture, handleCheckout }: ClassListProps) => {
    return (
        <View style={styles.listContainer}>
            {classes.length > 0 ? (
                <DataTable>
                    <DataTable.Header>
                        <DataTable.Title textStyle={styles.themedText}>Date</DataTable.Title>
                        <DataTable.Title textStyle={styles.themedText}>Time</DataTable.Title>
                        <DataTable.Title textStyle={styles.themedText}>Name</DataTable.Title>
                        {isFuture && <DataTable.Title style={styles.actionCell} textStyle={styles.themedText}>Actions</DataTable.Title>}
                    </DataTable.Header>
                    {classes.map((item) => (
                        <DataTable.Row key={item.id}>
                            <DataTable.Cell textStyle={styles.themedText}>{item.day}</DataTable.Cell>
                            <DataTable.Cell textStyle={styles.themedText}>{item.time}</DataTable.Cell>
                            <DataTable.Cell textStyle={styles.themedText}>{item.name}</DataTable.Cell>
                            {isFuture && handleCheckout && (
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
                            )}
                        </DataTable.Row>
                    ))}
                </DataTable>
            ) : (
                <Text style={[styles.themedText, styles.centeredText]}>
                    {isFuture ? "You don't have any upcoming classes booked." : "No past classes found."}
                </Text>
            )}
        </View>
    );
};

// --- Main Classes Component ---

export default function Classes({ onBack }: ClassesProps) {
  const [allUserClasses, setAllUserClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'future' | 'past'>('future');
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
            // Convert Firestore Timestamp to JavaScript Date
            const classDate = new Date(data.datetime.seconds * 1000);
            const dateStr = classDate.toLocaleDateString();
            const timeStr = classDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            classesData.push({
              id: classDoc.id,
              name: data.name,
              time: timeStr,
              day: dateStr,
              datetime: classDate, // Store the Date object for filtering
            });
          }
        }
        setAllUserClasses(classesData);
      } else {
        setAllUserClasses([]);
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


  // Use useMemo to filter and sort the class data only when allUserClasses changes
  const { futureClasses, pastClasses } = useMemo(() => {
    const now = new Date();
    const future = allUserClasses
      .filter(c => c.datetime >= now)
      .sort((a, b) => a.datetime.getTime() - b.datetime.getTime()); 

    const past = allUserClasses
      .filter(c => c.datetime < now)
      .sort((a, b) => b.datetime.getTime() - a.datetime.getTime()); 
      
    return { futureClasses: future, pastClasses: past };
  }, [allUserClasses]);


  return (
    <ScrollView style={styles.themedContainer}>
      <Button onPress={onBack} mode="outlined" style={styles.backButton}>
        <FontAwesome name="arrow-left" size={16} color={currentThemeColors.text} /> Back
      </Button>
      <Card style={styles.themedCard}>
        <Card.Title titleStyle={styles.themedText} title="My Classes" />
        <Card.Content style={localStyles.cardContent}>
          {isLoading ? (
            <Text style={[styles.themedText, styles.centeredText]}>Loading...</Text>
          ) : (
            <>
              {/* Segmented Buttons for Tab Navigation */}
              <View style={styles.themedSegmentedButtonsContainer}>
                <SegmentedButtons
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as 'future' | 'past')}
                  buttons={[
                    {
                      value: 'future',
                      label: `Future (${futureClasses.length})`,
                    },
                    {
                      value: 'past',
                      label: `Past (${pastClasses.length})`,
                    },
                  ]}
                />
              </View>

              {/* Conditional Rendering of Class List based on Active Tab */}
              {activeTab === 'future' ? (
                <ClassList
                    classes={futureClasses}
                    isFuture={true}
                    handleCheckout={handleCheckout}
                />
              ) : (
                <ClassList
                    classes={pastClasses}
                    isFuture={false}
                />
              )}
            </>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  cardContent: {
    padding: 0, // Ensure no extra padding inside card content
  },
});