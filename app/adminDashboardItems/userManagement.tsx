import { StyleSheet, View, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { auth, db } from '../../FirebaseConfig';
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  where,
} from 'firebase/firestore';
import { Card, DataTable, Text, Button, Modal, Portal, TextInput, Divider } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// ASSUMED IMPORTS FOR SHARING - These must be installed via 'npx expo install expo-sharing expo-file-system'
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import { UserProfile, UserMembership } from '../../constants/types';

interface UserManagementProps {
  onBack: () => void;
}

interface ClassData {
  id: string;
  name: string;
  time: string;
  day: string;
  templateId?: string; // Add templateId for tracking
}

interface ShareRange {
    startDate: string;
    endDate: string;
}

export default function UserManagement({ onBack }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [memberships, setMemberships] = useState<{ id: string, name: string }[]>([{ id: 'no-membership', name: 'No Membership' }]);
  const [classTemplates, setClassTemplates] = useState<{ [key: string]: string }>({}); // Store template ID to Name mapping

  const [isUserModalVisible, setUserModalVisible] = useState(false);
  const [isClassesModalVisible, setClassesModalVisible] = useState(false);
  const [isShareModalVisible, setShareModalVisible] = useState(false); // <-- NEW STATE for Share Modal

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [modalMembershipType, setModalMembershipType] = useState<string>('no-membership');
  const [isLoading, setIsLoading] = useState(true);
  const [userClasses, setUserClasses] = useState<ClassData[]>([]);
  
  // <-- NEW STATES for Share Modal
  const [shareRange, setShareRange] = useState<ShareRange>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [isSharing, setIsSharing] = useState(false);
  // -->

  useEffect(() => {
    let usersData: { [key: string]: UserProfile } = {};
    let membershipsData: { id: string, name: string }[] = [];
    let templateMap: { [key: string]: string } = {};
    let usersLoaded = false;
    let membershipsLoaded = false;
    let templatesLoaded = false;

    const checkIfDoneLoading = () => {
      if (usersLoaded && membershipsLoaded && templatesLoaded) {
        setIsLoading(false);
      }
    };

    // 1. Fetch Memberships
    const membershipsQuery = query(collection(db, 'memberships'));
    const unsubscribeMemberships = onSnapshot(membershipsQuery, (snapshot) => {
      membershipsData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setMemberships([{ id: 'no-membership', name: 'No Membership' }, ...membershipsData]);
      membershipsLoaded = true;
      checkIfDoneLoading();
    });

    // 2. Fetch Class Templates (for CSV headers)
    const templatesQuery = query(collection(db, 'classTemplates'));
    const unsubscribeTemplates = onSnapshot(templatesQuery, (snapshot) => {
      templateMap = {};
      snapshot.forEach(doc => {
        templateMap[doc.id] = doc.data().name;
      });
      setClassTemplates(templateMap);
      templatesLoaded = true;
      checkIfDoneLoading();
    });

    // 3. Fetch Users and User Memberships
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (userSnapshot) => {
      usersData = {};
      userSnapshot.forEach((userDoc) => {
        const user = userDoc.data() as UserProfile;
        usersData[userDoc.id] = { ...user, uid: userDoc.id, membershipType: 'No Membership' };
      });
      usersLoaded = true;
      checkIfDoneLoading();

      const userMembershipsQuery = query(collection(db, 'userMemberships'));
      const unsubscribeUserMemberships = onSnapshot(userMembershipsQuery, (membershipSnapshot) => {
        const newUsersData = { ...usersData };
        membershipSnapshot.forEach((membershipDoc) => {
          const membership = membershipDoc.data() as UserMembership;
          const uid = membership.uid;
          if (newUsersData[uid]) {
            newUsersData[uid].membershipType = membership.membershipType;
          }
        });
        setUsers(Object.values(newUsersData));
      });

      return () => {
        unsubscribeUserMemberships();
      };
    });

    return () => {
      unsubscribeMemberships();
      unsubscribeUsers();
      unsubscribeTemplates();
    };
  }, []);

  // Modal handlers 
  const showUserModal = (user: UserProfile) => {
    setSelectedUser(user);
    const foundMembership = memberships.find(m => m.id === user.membershipType);
    setModalMembershipType(foundMembership ? foundMembership.id : 'no-membership');
    setUserModalVisible(true);
  };

  const hideUserModal = () => {
    setUserModalVisible(false);
    setSelectedUser(null);
  };

  const showClassesModal = async (user: UserProfile) => {
    setSelectedUser(user);
    try {
      const userClassesRef = doc(db, 'userClasses', user.uid);
      const userClassesDoc = await getDoc(userClassesRef);
      if (userClassesDoc.exists()) {
        const classIds = userClassesDoc.data().classes as string[];
        const classesData: ClassData[] = [];
        for (const classId of classIds) {
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
              templateId: data.templateId, // Include template ID
            });
          }
        }
        setUserClasses(classesData);
      } else {
        setUserClasses([]);
      }
      setClassesModalVisible(true);
    } catch (error) {
      console.error('Error fetching user classes:', error);
      Alert.alert('Error', 'Failed to fetch user classes.');
    }
  };

  const hideClassesModal = () => {
    setClassesModalVisible(false);
    setSelectedUser(null);
    setUserClasses([]);
  };

  const showShareModal = () => { // <-- NEW MODAL HANDLER
    setShareModalVisible(true);
  };

  const hideShareModal = () => { // <-- NEW MODAL HANDLER
    setShareModalVisible(false);
    setIsSharing(false);
  };
  // End Modal handlers


  // Handler for Save User and Delete User
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    try {
      if (modalMembershipType === 'no-membership') {
        await deleteDoc(doc(db, 'userMemberships', selectedUser.uid));
        Alert.alert('Success', 'Membership removed successfully.');
      } else {
        await setDoc(doc(db, 'userMemberships', selectedUser.uid), {
          uid: selectedUser.uid,
          membershipType: modalMembershipType,
        });
        Alert.alert('Success', 'Membership updated successfully.');
      }
      hideUserModal();
    } catch (error) {
      console.error('Error updating membership:', error);
      Alert.alert('Error', 'Failed to update membership.');
    }
  };

  const handleDeleteUser = (userToDelete: UserProfile) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete ${userToDelete.name}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', userToDelete.uid));
              await deleteDoc(doc(db, 'userMemberships', userToDelete.uid));
              await deleteDoc(doc(db, 'userClasses', userToDelete.uid));
              Alert.alert('Success', `User ${userToDelete.name} and their records have been deleted.`);
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', `Failed to delete user ${userToDelete.name}.`);
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  // End Handler for Save User and Delete User


  // NEW FUNCTION: Generate and Share CSV
  const handleGenerateAndShareSummary = async () => {
    setIsSharing(true);
    try {
      // 1. Calculate Timestamps
      // ⭐️ FIX 1: Ensure Start Date is set to 00:00:00 UTC for consistent comparison
      const startDateObj = new Date(shareRange.startDate);
      startDateObj.setUTCHours(0, 0, 0, 0); // Set to start of day in UTC to avoid timezone issues

      // ⭐️ FIX 2: Ensure End Date is set to 23:59:59 UTC
      const endDateObj = new Date(shareRange.endDate);
      endDateObj.setUTCHours(23, 59, 59, 999); // Set to end of day in UTC

      const startTimestamp = startDateObj.getTime();
      const endTimestamp = endDateObj.getTime();

      // 2. Fetch all class documents (continue with client-side filter)
      const classesRef = collection(db, 'classes');
      const classesSnapshot = await getDocs(classesRef);
      
      const relevantClasses: { [id: string]: { templateId: string, timestamp: number } } = {};
      classesSnapshot.forEach(doc => {
          const data = doc.data();
          // Convert Firestore Timestamp to JS timestamp
          const timestamp = data.datetime.seconds * 1000;
          
          if (timestamp >= startTimestamp && timestamp <= endTimestamp) { // ⭐️ FIX 3: Use <= for endTimestamp
              relevantClasses[doc.id] = { 
                  templateId: data.templateId,
                  timestamp: timestamp
              };
          }
      });
      
      if (Object.keys(relevantClasses).length === 0) {
        Alert.alert('No Data', 'No classes were found in the selected date range. Please adjust dates.');
        setIsSharing(false);
        return;
      }

      // 3. Prepare CSV Header
      const templateNames = Object.values(classTemplates);
      const header = ["Name", "Membership Type", "Avg Classes/Week", ...templateNames].join(",");
      const csvRows: string[] = [header];

      // 4. Process data for each user
      // ⭐️ FIX 4: Use the current state array (users) for processing
      const usersToProcess = users.filter(u => u.membershipType !== 'App Admin');
      
      const totalDays = Math.ceil((endTimestamp - startTimestamp) / 86400000);
      // Ensure totalWeeks is at least 1 if the period is less than a week but contains days
      const totalWeeks = Math.max(1, totalDays / 7); 

      for (const user of usersToProcess) {
          const membershipName = memberships.find(m => m.id === user.membershipType)?.name || 'N/A';
          const userClassesRef = doc(db, 'userClasses', user.uid);
          const userClassesDoc = await getDoc(userClassesRef);

          let totalClasses = 0;
          let templateCounts: { [templateId: string]: number } = {};

          if (userClassesDoc.exists()) {
              const checkedInClassIds = userClassesDoc.data().classes as string[];
              
              for (const classId of checkedInClassIds) {
                  if (relevantClasses[classId]) {
                      totalClasses++;
                      const templateId = relevantClasses[classId].templateId;
                      templateCounts[templateId] = (templateCounts[templateId] || 0) + 1;
                  }
              }
          }
          
          const avgClassesPerWeek = totalWeeks > 0 ? (totalClasses / totalWeeks).toFixed(2) : '0.00';

          // 5. Build CSV Row
          const templateCountValues = templateNames.map(templateName => {
              const templateId = Object.keys(classTemplates).find(id => classTemplates[id] === templateName);
              return templateId ? (templateCounts[templateId] || 0) : 0;
          }).join(",");

          // Basic CSV sanitation: wrap names in quotes
          const row = [
              `"${user.name}"`, 
              `"${membershipName}"`,
              avgClassesPerWeek,
              templateCountValues
          ].join(",");
          
          csvRows.push(row);
      }

      // 6. Generate CSV file content and Share
      // ... (sharing logic remains the same)
      const csvContent = csvRows.join('\n');
      const fileName = `UserSummary_${shareRange.startDate}_to_${shareRange.endDate}.csv`;
      
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
        return;
      }
      
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Share Class Summary' });
      
      hideShareModal();
    } catch (error) {
      console.error('Error generating summary:', error);
      Alert.alert('Error', 'Failed to generate summary.');
    } finally {
      setIsSharing(false);
    }
  };

  
  return (
    <ScrollView style={styles.container}>
      <Button onPress={onBack} mode="outlined" style={styles.backButton}>
        <FontAwesome name="arrow-left" size={16} /> Back
      </Button>
      <Card style={styles.card}>
        <Card.Title title="User Management" />
        <Card.Content>
          <Button onPress={showShareModal} mode="contained" style={{ marginBottom: 15 }} disabled={isLoading || isSharing}>
            {isSharing ? 'Generating...' : 'Share Class Summary'}
          </Button>
          {isLoading ? (
            <Text style={{ textAlign: 'center' }}>Loading...</Text>
          ) : (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Name</DataTable.Title>
                <DataTable.Title>Email</DataTable.Title>
                <DataTable.Title style={{ justifyContent: 'flex-end' }}>Actions</DataTable.Title>
              </DataTable.Header>
              {users.map((user) => (
                <DataTable.Row key={user.uid}>
                  <DataTable.Cell>{user.name}</DataTable.Cell>
                  <DataTable.Cell>{user.email}</DataTable.Cell>
                  <DataTable.Cell style={styles.actionCell}>
                    <TouchableOpacity onPress={() => showClassesModal(user)}>
                      <FontAwesome name="calendar" size={20} color="black" style={{ marginRight: 15 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => showUserModal(user)}>
                      <FontAwesome name="pencil" size={20} color="black" style={{ marginRight: 15 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteUser(user)}>
                      <FontAwesome name="trash" size={20} color="red" />
                    </TouchableOpacity>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          )}
        </Card.Content>
      </Card>

      {/* Edit User Modal (omitted for brevity) */}
      <Portal>
        <Modal
          visible={isUserModalVisible}
          onDismiss={hideUserModal}
          contentContainerStyle={styles.modalContent}
        >
          {selectedUser && (
            <Card>
              <Card.Title title="Edit User Membership" />
              <Card.Content>
                <Text>Name: {selectedUser.name}</Text>
                <Text>Email: {selectedUser.email}</Text>
                <Text style={styles.pickerLabel}>Membership Type:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={modalMembershipType}
                    onValueChange={(itemValue) => setModalMembershipType(itemValue)}
                  >
                    {memberships.map((membership) => (
                      <Picker.Item key={membership.id} label={membership.name} value={membership.id} />
                    ))}
                  </Picker>
                </View>
                <View style={styles.modalButtons}>
                  <Button onPress={hideUserModal} mode="outlined" style={{ marginRight: 10 }}>Cancel</Button>
                  <Button onPress={handleSaveUser} mode="contained">Save</Button>
                </View>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>

      {/* Classes Modal (omitted for brevity) */}
      <Portal>
        <Modal
          visible={isClassesModalVisible}
          onDismiss={hideClassesModal}
          contentContainerStyle={styles.modalContent}
        >
          {selectedUser && (
            <Card>
              <Card.Title title={`Classes for ${selectedUser.name}`} />
              <Card.Content>
                {userClasses.length > 0 ? (
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title>Date</DataTable.Title>
                      <DataTable.Title>Time</DataTable.Title>
                      <DataTable.Title>Name</DataTable.Title>
                    </DataTable.Header>
                    {userClasses.map((classItem) => (
                      <DataTable.Row key={classItem.id}>
                        <DataTable.Cell>{classItem.day}</DataTable.Cell>
                        <DataTable.Cell>{classItem.time}</DataTable.Cell>
                        <DataTable.Cell>{classItem.name}</DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                ) : (
                  <Text>This user has no checked-in classes.</Text>
                )}
                <View style={styles.modalButtons}>
                  <Button onPress={hideClassesModal} mode="outlined">Close</Button>
                </View>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>

      {/* Share Summary Modal <-- NEW MODAL */}
      <Portal>
        <Modal
          visible={isShareModalVisible}
          onDismiss={hideShareModal}
          contentContainerStyle={styles.modalContent}
        >
          <Card>
            <Card.Title title="Share Class Summary" />
            <Card.Content>
              <TextInput
                label="Start Date (YYYY-MM-DD)"
                value={shareRange.startDate}
                onChangeText={(text) => setShareRange(prev => ({ ...prev, startDate: text }))}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="End Date (YYYY-MM-DD)"
                value={shareRange.endDate}
                onChangeText={(text) => setShareRange(prev => ({ ...prev, endDate: text }))}
                mode="outlined"
                style={styles.input}
              />
              <View style={styles.modalButtons}>
                <Button onPress={hideShareModal} mode="outlined" style={{ marginRight: 10 }} disabled={isSharing}>Cancel</Button>
                <Button onPress={handleGenerateAndShareSummary} mode="contained" disabled={isSharing}>
                  {isSharing ? 'Generating...' : 'Share CSV'}
                </Button>
              </View>
            </Card.Content>
          </Card>
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
  backButton: {
    marginBottom: 10,
  },
  input: {
    marginBottom: 10,
  },
});