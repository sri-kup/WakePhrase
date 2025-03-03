import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

console.log('Expo Config:', Constants.expoConfig);  // Debugging log

const API_URL = Constants.expoConfig?.extra?.API_URL || 'http://localhost:5001';

console.log('Loaded API_URL:', API_URL);  // Debugging log

export default API_URL;





// Determine the appropriate API URL based on the platform and environment
// let API_URL = 'http://localhost:5001';

// // For physical devices, use the actual IP address of your computer
// if (Platform.OS !== 'web' && __DEV__) {
//   API_URL = 'http://192.168.1.107:5001'; 
// }


interface UserProfile {
  name: string;
  goals: string[];
  fears: string[];
}

interface ApiResponse {
  message?: string;
  error?: string;
  user_id?: string;
  phrase?: string;
}

export const registerUser = async (email: string, password: string): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data: ApiResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    if (data.user_id) {
      await AsyncStorage.setItem('user_id', data.user_id);
      return data.user_id;
    }
    throw new Error('No user ID received');
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    if (data.user_id) {
      // Store user ID
      await AsyncStorage.setItem('user_id', data.user_id);
      
      // Store profile data
      if (data.profile) {
        await AsyncStorage.setItem('profile', JSON.stringify(data.profile));
      }
      
      // Store alarms data
      if (data.alarms) {
        await AsyncStorage.setItem('alarms', JSON.stringify(data.alarms));
      }
      
      return data.user_id;
    }
    throw new Error('No user ID received');
  } catch (error) {
    throw error;
  }
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User not logged in');
    }

    const response = await fetch(`${API_URL}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        name: profile.name,
        goals: profile.goals,
        fears: profile.fears,
      }),
    });
    
    // Check if response is JSON before trying to parse it
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data: ApiResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }
    } else {
      // Handle non-JSON response
      const text = await response.text();
      throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Profile save error:', error);
    throw error;
  }
};

export const generatePhrase = async (action: 'dismiss' | 'snooze'): Promise<string> => {
  try {
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User not logged in');
    }

    const response = await fetch(`${API_URL}/phrase?user_id=${userId}&action=${action}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data: ApiResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate phrase');
    }
    
    return data.phrase || 'No phrase generated';
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('user_id');
    await AsyncStorage.removeItem('profile');
  } catch (error) {
    throw error;
  }
};

export interface Alarm {
  id: string;
  time: string;
  label: string;
  days: string[];
  isActive: boolean;
  sound?: string;
  notificationIds?: string[];
}

export const saveAlarm = async (alarm: Alarm): Promise<string> => {
  try {
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User not logged in');
    }

    const response = await fetch(`${API_URL}/alarms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        ...alarm
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save alarm');
    }
    
    return data.id;
  } catch (error) {
    throw error;
  }
};

export const getAlarms = async (): Promise<Alarm[]> => {
  try {
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User not logged in');
    }

    const response = await fetch(`${API_URL}/alarms?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch alarms');
    }
    
    return data.alarms;
  } catch (error) {
    throw error;
  }
};

export const deleteAlarm = async (alarmId: string): Promise<void> => {
  try {
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User not logged in');
    }

    const response = await fetch(`${API_URL}/alarms/${alarmId}?user_id=${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete alarm');
    }
  } catch (error) {
    throw error;
  }
};