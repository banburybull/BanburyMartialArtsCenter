import { StyleSheet, View, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { db } from '../../FirebaseConfig';
import {
  collection,
  query,
  onSnapshot,
  doc,
  runTransaction,
  where,
  getDocs,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { Card, DataTable, Text, Button, Modal, Portal, TextInput, Divider } from 'react-native-paper';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ClassTemplatesProps {
  onBack: () => void;
}

interface ClassTemplate {
  id: string;
  startDate: string;
  endDate: string;
  dayOfWeek: string[];
  time: string;
  name: string;
  description: string;
}

export default function ClassTemplates({ onBack }: ClassTemplatesProps) {
  const [classTemplates, setClassTemplates] = useState<ClassTemplate[]>([]);
  const [isTemplateModalVisible, setTemplateModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ClassTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateTime, setTemplateTime] = useState(new Date());
  const [templateDaysOfWeek, setTemplateDaysOfWeek] = useState<string[]>([]);
  const [templateStartDate, setTemplateStartDate] = useState(new Date());
  const [templateEndDate, setTemplateEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isStartDatePicker, setIsStartDatePicker] = useState(true);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const templatesQuery = query(collection(db, 'classTemplates'));
    const unsubscribeTemplates = onSnapshot(templatesQuery, (snapshot) => {
      const templates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate().toISOString().split('T')[0],
        endDate: doc.data().endDate.toDate().toISOString().split('T')[0],
      })) as ClassTemplate[];
      setClassTemplates(templates);
    });

    return () => unsubscribeTemplates();
  }, []);

  const showTemplateModal = (template?: ClassTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setTemplateName(template.name);
      setTemplateDescription(template.description);
      setTemplateDaysOfWeek(template.dayOfWeek);
      setTemplateTime(new Date(`2000-01-01T${template.time}`));
      setTemplateStartDate(new Date(template.startDate));
      setTemplateEndDate(new Date(template.endDate));
    } else {
      setSelectedTemplate(null);
      setTemplateName('');
      setTemplateDescription('');
      setTemplateDaysOfWeek([]);
      setTemplateTime(new Date());
      setTemplateStartDate(new Date());
      setTemplateEndDate(new Date());
    }
    setTemplateModalVisible(true);
  };

  const hideTemplateModal = () => {
    setTemplateModalVisible(false);
    setSelectedTemplate(null);
  };

  const handleToggleDay = (day: string) => {
    setTemplateDaysOfWeek(prevDays =>
      prevDays.includes(day)
        ? prevDays.filter(d => d !== day)
        : [...prevDays, day]
    );
  };

  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    if (isStartDatePicker) {
      setShowDatePicker(false);
      if (selectedDate) {
        setTemplateStartDate(selectedDate);
      }
    } else {
      setShowDatePicker(false);
      if (selectedDate) {
        setTemplateEndDate(selectedDate);
      }
    }
  };

  const onTimeChange = (event: any, selectedTime: Date | undefined) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTemplateTime(selectedTime);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (!templateName || !templateDescription || templateDaysOfWeek.length === 0) {
        Alert.alert('Error', 'Please fill in all fields correctly.');
        return;
      }
      if (templateStartDate.getTime() > templateEndDate.getTime()) {
        Alert.alert('Error', 'Start date cannot be after end date.');
        return;
      }

      await runTransaction(db, async (transaction) => {
        const newTemplateRef = selectedTemplate ? doc(db, 'classTemplates', selectedTemplate.id) : doc(collection(db, 'classTemplates'));
        const templateData = {
          name: templateName,
          description: templateDescription,
          startDate: templateStartDate,
          endDate: templateEndDate,
          dayOfWeek: templateDaysOfWeek,
          time: templateTime.toTimeString().split(' ')[0].substring(0, 5),
        };

        transaction.set(newTemplateRef, templateData, { merge: true });

        // Delete existing classes for this template if it's an edit
        if (selectedTemplate) {
          const existingClassesQuery = query(collection(db, 'classes'), where('templateId', '==', selectedTemplate.id));
          const snapshot = await getDocs(existingClassesQuery);
          snapshot.forEach((doc: QueryDocumentSnapshot) => {
            transaction.delete(doc.ref);
          });
        }

        // Create new classes based on the template
        const currentDate = new Date(templateStartDate);
        while (currentDate <= templateEndDate) {
          const dayName = daysOfWeek[currentDate.getDay()];
          if (templateDaysOfWeek.includes(dayName)) {
            const classDateTime = new Date(currentDate);
            classDateTime.setHours(templateTime.getHours(), templateTime.getMinutes(), 0, 0);

            const classRef = doc(collection(db, 'classes'));
            transaction.set(classRef, {
              name: templateName,
              description: templateDescription,
              datetime: classDateTime,
              templateId: newTemplateRef.id,
            });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

      Alert.alert('Success', 'Class template and classes updated successfully.');
      hideTemplateModal();
    } catch (error) {
      console.error('Error saving template:', error);
      Alert.alert('Error', 'Failed to save class template.');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this class template and all associated classes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await runTransaction(db, async (transaction) => {
                const classesQuery = query(collection(db, 'classes'), where('templateId', '==', templateId));
                const classesSnapshot = await getDocs(classesQuery);
                const classIdsToDelete: string[] = [];
                classesSnapshot.forEach((doc: QueryDocumentSnapshot) => {
                  classIdsToDelete.push(doc.id);
                  transaction.delete(doc.ref);
                });
                const userClassesQuery = query(collection(db, 'userClasses'), where('classes', 'array-contains-any', classIdsToDelete));
                const userClassesSnapshot = await getDocs(userClassesQuery);
                userClassesSnapshot.forEach((doc: QueryDocumentSnapshot) => {
                  const currentClasses = doc.data().classes as string[];
                  const newClasses = currentClasses.filter(id => !classIdsToDelete.includes(id));
                  transaction.update(doc.ref, { classes: newClasses });
                });
                const templateRef = doc(db, 'classTemplates', templateId);
                transaction.delete(templateRef);
              });
              Alert.alert('Success', 'Class template, associated classes, and user records deleted.');
            } catch (error) {
              console.error('Error deleting template:', error);
              Alert.alert('Error', 'Failed to delete template.');
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <Button onPress={onBack} mode="outlined" style={styles.backButton}>
        <FontAwesome name="arrow-left" size={16} /> Back
      </Button>
      <Card style={styles.card}>
        <Card.Title title="Class Templates" />
        <Card.Content>
          <Button onPress={() => showTemplateModal()} mode="contained" style={styles.addButton}>
            Add New Template
          </Button>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Name</DataTable.Title>
              <DataTable.Title>Days & Time</DataTable.Title>
              <DataTable.Title style={{ justifyContent: 'flex-end' }}>Actions</DataTable.Title>
            </DataTable.Header>
            {classTemplates.map(template => (
              <DataTable.Row key={template.id}>
                <DataTable.Cell>{template.name}</DataTable.Cell>
                <DataTable.Cell>{template.dayOfWeek.join(', ')} @ {template.time}</DataTable.Cell>
                <DataTable.Cell style={styles.actionCell}>
                  <TouchableOpacity onPress={() => showTemplateModal(template)}>
                    <FontAwesome name="pencil" size={20} color="black" style={{ marginRight: 15 }} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteTemplate(template.id)}>
                    <FontAwesome name="trash" size={20} color="red" />
                  </TouchableOpacity>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>

      <Portal>
        <Modal
          visible={isTemplateModalVisible}
          onDismiss={hideTemplateModal}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView>
            <Card>
              <Card.Title title={selectedTemplate ? 'Edit Class Template' : 'Create Class Template'} />
              <Card.Content>
                <TextInput
                  label="Class Name"
                  value={templateName}
                  onChangeText={setTemplateName}
                  style={styles.input}
                />
                <TextInput
                  label="Description"
                  value={templateDescription}
                  onChangeText={setTemplateDescription}
                  style={styles.input}
                  multiline
                />

                <Text style={styles.label}>Start Date</Text>
                <Button onPress={() => { setIsStartDatePicker(true); setShowDatePicker(true); }} mode="outlined">
                  {templateStartDate.toDateString()}
                </Button>

                <Text style={styles.label}>End Date</Text>
                <Button onPress={() => { setIsStartDatePicker(false); setShowDatePicker(true); }} mode="outlined">
                  {templateEndDate.toDateString()}
                </Button>

                {showDatePicker && (
                  <DateTimePicker
                    value={isStartDatePicker ? templateStartDate : templateEndDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                  />
                )}

                <Text style={styles.label}>Time</Text>
                <Button onPress={() => setShowTimePicker(true)} mode="outlined">
                  {templateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Button>
                {showTimePicker && (
                  <DateTimePicker
                    value={templateTime}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                  />
                )}
                
                <Text style={styles.label}>Days of the Week</Text>
                <View style={styles.dayButtonsContainer}>
                  {daysOfWeek.map((day) => (
                    <Button
                      key={day}
                      mode={templateDaysOfWeek.includes(day) ? 'contained' : 'outlined'}
                      onPress={() => handleToggleDay(day)}
                      style={styles.dayButton}
                    >
                      {day.substring(0, 3)}
                    </Button>
                  ))}
                </View>

                <View style={styles.modalButtons}>
                  <Button onPress={hideTemplateModal} mode="outlined" style={{ marginRight: 10 }}>Cancel</Button>
                  <Button onPress={handleSaveTemplate} mode="contained">Save</Button>
                </View>
              </Card.Content>
            </Card>
          </ScrollView>
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
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  pickerLabel: {
    marginTop: 15,
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  actionCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  divider: {
    marginVertical: 20,
  },
  addButton: {
    marginBottom: 10,
  },
  input: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  dayButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  dayButton: {
    margin: 4,
    minWidth: 50,
  },
  backButton: {
    marginBottom: 10,
  },
});