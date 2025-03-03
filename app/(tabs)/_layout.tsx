import { Tabs } from 'expo-router';
import { Bell, User } from 'lucide-react-native';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export default function TabLayout() {
  useEffect(() => {
    // Request notification permissions when the app starts
    if (Platform.OS !== 'web') {
      registerForPushNotificationsAsync();
    }
  }, []);

  async function registerForPushNotificationsAsync() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          backgroundColor: '#FFFFFF',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Alarms',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          headerShown: true,
        }}
      />
    </Tabs>
  );
}