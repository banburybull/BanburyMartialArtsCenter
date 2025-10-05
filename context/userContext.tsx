import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app, db } from '../FirebaseConfig';
import { UserMembership } from '../constants/types';
import { router } from 'expo-router';

const auth = getAuth(app);
const [refreshCount, setRefreshCount] = useState(0);
const refreshUserData = () => {
    setRefreshCount(prev => prev + 1);
};

interface UserContextType {
  displayName: string;
  isAdmin: boolean;
  loading: boolean;
  userMembership: UserMembership | null;
  refreshUserData: () => void; 
}

export const UserContext = createContext<UserContextType>({
  isAdmin: false,
  loading: true,
  userMembership: null,
  displayName: '',
  refreshUserData: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
   const [refreshCount, setRefreshCount] = useState(0);
  const [userMembership, setUserMembership] = useState<UserMembership | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setDisplayName(userData.displayName || '');
          }
          const userMembershipDocRef = doc(db, 'userMemberships', user.uid);
          const userMembershipDoc = await getDoc(userMembershipDocRef);
          if (userMembershipDoc.exists()) {
            const membershipData = userMembershipDoc.data() as UserMembership;
            setUserMembership(membershipData);
            setIsAdmin(membershipData.membershipType === 'App Admin');
          } else {
            router.replace('/no-membership');
            setUserMembership(null);
            setIsAdmin(false);
          }
        } catch (error) {
            router.replace('/no-membership');
          setUserMembership(null);
          setIsAdmin(false);
        }
      } else {
        setUserMembership(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshCount]);

  return (
    <UserContext.Provider value={{ displayName, isAdmin, loading, userMembership, refreshUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);