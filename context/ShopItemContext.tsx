// app/adminDashboardItems/ShopItemContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { db } from '../FirebaseConfig';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

interface ShopItemContextType {
  createShopItem: (item: {
    name: string;
    description: string;
    price: number;
    imageUrl: string;
  }) => Promise<void>;
}

export const ShopItemContext = createContext<ShopItemContextType | undefined>(undefined);

export const ShopItemProvider = ({ children }: { children: React.ReactNode }) => {
  const createShopItem = async (item: {
    name: string;
    description: string;
    price: number;
    imageUrl: string;
  }) => {
    try {
      await addDoc(collection(db, 'products'), item);
    } catch (error) {
      console.error('Error creating shop item:', error);
      throw new Error('Failed to create shop item.');
    }
  };

  return (
    <ShopItemContext.Provider value={{ createShopItem }}>
      {children}
    </ShopItemContext.Provider>
  );
};

export const useShopItems = () => {
  const context = useContext(ShopItemContext);
  if (!context) {
    throw new Error('useShopItems must be used within a ShopItemProvider');
  }
  return context;
};