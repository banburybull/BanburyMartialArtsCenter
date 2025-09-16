import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app, db } from '../FirebaseConfig';
import { UserMembership } from '../constants/types';
import { router } from 'expo-router';

const auth = getAuth(app);

interface UserContextType {
  isAdmin: boolean;
  loading: boolean;
  userMembership: UserMembership | null;
}

export const UserContext = createContext<UserContextType>({
  isAdmin: false,
  loading: true,
  userMembership: null,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userMembership, setUserMembership] = useState<UserMembership | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("Auth state changed. Current user:", user);
      if (user) {
        try {
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
  }, []);

  return (
    <UserContext.Provider value={{ isAdmin, loading, userMembership }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);