import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id');
        setIsAuthenticated(!!userId);
      } catch (error) {
        console.error('Failed to check authentication status:', error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  // Show nothing while checking authentication status
  if (isAuthenticated === null) {
    return null;
  }

  // Redirect based on authentication status
  return isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}