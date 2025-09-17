// app/components/NotificationsIcon.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Assuming you have a NotificationsContext to get the unread count
import { useNotifications } from '../context/notificationsContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function NotificationsIcon() {
  const { unreadCount } = useNotifications();
  const colorScheme = useColorScheme();

  return (
    <Link href="/modal" asChild>
      <Pressable>
        {({ pressed }) => (
          <View style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}>
            <FontAwesome
              name="bell"
              size={25}
              color={Colors[colorScheme ?? 'light'].text}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
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