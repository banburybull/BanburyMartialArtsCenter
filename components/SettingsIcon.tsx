// app/components/SettingsIcon.tsx
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import { Link, router } from 'expo-router'; // Link is no longer strictly needed but kept in imports
import { useNotifications } from '../context/notificationsContext'; 
import { useUser } from '../context/userContext'; 
import { getAuth, signOut } from 'firebase/auth'; 
import { app } from '../FirebaseConfig'; 

// Initialize auth
const auth = getAuth(app);

// --- Content Component for Notifications (No padding here!) ---
const NotificationsMenuContent = () => {
  const { unreadCount } = useNotifications();
  const colorScheme = useColorScheme();
  const iconColor = Colors[colorScheme ?? 'light'].text;

  return (
    // This View now only defines the icon and text layout
    <View style={styles.menuItemContent}> 
      <View style={styles.menuItemIconContainer}>
        <FontAwesome
          name="bell"
          size={20}
          color={iconColor}
        />
        {/* Re-adding the unread count badge logic for the menu item */}
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      <Text style={{ ...styles.menuItemText, color: iconColor }}>
        Notifications
      </Text>
    </View>
  );
};

// --- Logout Menu Item Component ---
const LogoutMenuOption = () => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert("Logout Error", "Failed to log out. Please try again.");
    }
  };

  return (
    // MenuOption with consistent style and onSelect for closing/action
    <MenuOption onSelect={handleLogout} style={styles.menuOptionStyle}>
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemIconContainer}>
          <FontAwesome
            name="sign-out"
            size={20}
            color="red"
          />
        </View>
        <Text style={styles.logoutText}>
          Log Out
        </Text>
      </View>
    </MenuOption>
  );
};


// --- SettingsIcon Component ---
export default function SettingsIcon() {
  const colorScheme = useColorScheme();

  // New handler for Notifications, which closes the menu and navigates
  const handleNotifications = () => {
    router.push('/modal');
  };

  return (
    <Menu>
      <MenuTrigger>
        <View style={styles.triggerContainer}>
          <FontAwesome
            name="cog"
            size={25}
            color={Colors[colorScheme ?? 'light'].text}
          />
        </View>
      </MenuTrigger>

      <MenuOptions customStyles={optionsCustomStyles}>
        
        {/* Notifications Option: Use standard MenuOption with onSelect */}
        <MenuOption 
            onSelect={handleNotifications} 
            style={styles.menuOptionStyle}
        >
            <NotificationsMenuContent />
        </MenuOption>

        {/* --- LOGOUT BUTTON --- */}
        <LogoutMenuOption />

      </MenuOptions>
    </Menu>
  );
}

// --- Stylesheet for Menu Customization ---
const styles = StyleSheet.create({
  triggerContainer: {
    marginRight: 15,
    padding: 5,
  },
  // Consistent padding and background for the MenuOption
  menuOptionStyle: {
    padding: 10, 
    width: '100%', 
  },
  // This only defines the internal row layout
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  menuItemIconContainer: {
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Logout specific styles
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'red', 
  },
  // Badge styles
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

// Custom styles for MenuOptions
const optionsCustomStyles = {
  optionsContainer: {
    marginTop: 40,
    minWidth: 150,
    padding: 0, // Remove outer padding from container
    borderRadius: 5,
  },
};