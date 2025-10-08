import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app, db } from '../FirebaseConfig';
import { UserMembership } from '../constants/types';

const auth = getAuth(app);

interface UserContextType {
  displayName: string;
  isAdmin: boolean;
  loading: boolean;
  userMembership: UserMembership | null;
  needsMembershipRedirect: boolean; 
  refreshUserData: () => void; 
}

export const UserContext = createContext<UserContextType>({
  isAdmin: false,
  loading: true,
  userMembership: null,
  displayName: '',
  needsMembershipRedirect: false,
  refreshUserData: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [refreshCount, setRefreshCount] = useState(0); 
  const [userMembership, setUserMembership] = useState<UserMembership | null>(null);
  const [needsMembershipRedirect, setNeedsMembershipRedirect] = useState(false);

  const refreshUserData = () => {
      setRefreshCount(prev => prev + 1);
  };

useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setNeedsMembershipRedirect(false); // Reset on every check
      if (user) {
        try {
          // ... (existing logic to fetch displayName)
          
          const userMembershipDocRef = doc(db, 'userMemberships', user.uid);
          const userMembershipDoc = await getDoc(userMembershipDocRef);
          
          if (userMembershipDoc.exists()) {
            // Success
            const membershipData = userMembershipDoc.data() as UserMembership;
            setUserMembership(membershipData);
            setIsAdmin(membershipData.membershipType === 'App Admin');
          } else {
            // User logged in but HAS NO MEMBERSHIP DOCUMENT
            setNeedsMembershipRedirect(true); // <--- FLAG THE STATE
            setUserMembership(null);
            setIsAdmin(false);
          }
        } catch (error) {
            // Failed to fetch or error occurred
            setNeedsMembershipRedirect(true); // <--- FLAG THE STATE on error
            setUserMembership(null);
            setIsAdmin(false);
        }
      } else {
        // User is logged out
        setUserMembership(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshCount]);

  return (
    <UserContext.Provider value={{ displayName, isAdmin, loading, userMembership, needsMembershipRedirect, refreshUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);