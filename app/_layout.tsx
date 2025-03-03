import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Ignore specific warnings that might be causing issues
LogBox.ignoreLogs([
  'Remote debugger',
  'Require cycle:',
  'Warning: componentWill',
  'java.io.IOException'
]);

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// Note: Notification listeners are handled in AlarmScreen component

export default function RootLayout() {
  useEffect(() => {
    window.frameworkReady?.();
    
    // Register for push notifications
    registerForPushNotificationsAsync();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    return;
  }

  if (Device.isDevice) {
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
  } else {
    console.log('Must use physical device for Push Notifications');
  }
}