// app/components/NotificationMenuItem.tsx (Conceptual Component)
import { Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function NotificationMenuItem() {
  const colorScheme = useColorScheme();
  const iconColor = Colors[colorScheme ?? 'light'].text;

  return (
    <Link href="/modal" asChild>
      <Pressable style={styles.menuItem}>
        <FontAwesome
          name="bell" // The icon is now inside the menu item
          size={20}
          color={iconColor}
          style={styles.icon}
        />
        <Text style={{ ...styles.text, color: iconColor }}>Notifications</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    // Add styling for menu item appearance
  },
  icon: {
    marginRight: 10,
  },
  text: {
    fontSize: 16,
  },
});