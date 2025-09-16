// constants/types.ts

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  membershipType?: string; // Optional because it might not be immediately available
}

export interface UserMembership {
  uid: string;
  membershipType: string;
}