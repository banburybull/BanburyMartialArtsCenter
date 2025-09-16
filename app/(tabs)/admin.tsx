import { StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import { getAuth } from 'firebase/auth';
import { auth, db } from '../../FirebaseConfig';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Card, DataTable, Text, Button, Modal, Portal } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { UserProfile, UserMembership } from '../../constants/types';

export default function AdminScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [memberships, setMemberships] = useState<{ id: string, name: string }[]>([{ id: 'no-membership', name: 'No Membership' }]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [modalMembershipType, setModalMembershipType] = useState<string>('no-membership');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let usersData: { [key: string]: UserProfile } = {};
    let membershipsData: { id: string, name: string }[] = [];
    let usersLoaded = false;
    let membershipsLoaded = false;

    const checkIfDoneLoading = () => {
      if (usersLoaded && membershipsLoaded) {
        setIsLoading(false);
      }
    };

    const membershipsQuery = query(collection(db, 'memberships'));
    const unsubscribeMemberships = onSnapshot(membershipsQuery, (snapshot) => {
      membershipsData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setMemberships([{ id: 'no-membership', name: 'No Membership' }, ...membershipsData]);
      membershipsLoaded = true;
      checkIfDoneLoading();
    });

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
    };
  }, []);

  const showModal = (user: UserProfile) => {
    setSelectedUser(user);
    const foundMembership = memberships.find(m => m.id === user.membershipType);
    setModalMembershipType(foundMembership ? foundMembership.id : 'no-membership');
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    setSelectedUser(null);
  };

  const handleSave = async () => {
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
      hideModal();
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
              // Deleting from Firestore
              await deleteDoc(doc(db, 'users', userToDelete.uid));
              await deleteDoc(doc(db, 'userMemberships', userToDelete.uid));
              // Note: Deleting from Auth is a security risk from the client
              // and should be handled on a backend.
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

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Admin Dashboard" />
        <Card.Content>
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
                    <TouchableOpacity onPress={() => showModal(user)}>
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
      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={hideModal}
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
                  <Button onPress={hideModal} mode="outlined" style={{ marginRight: 10 }}>Cancel</Button>
                  <Button onPress={handleSave} mode="contained">Save</Button>
                </View>
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
    width: '100%',
    padding: 10,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
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
});