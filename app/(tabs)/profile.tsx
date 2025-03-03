import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Save, CreditCard as Edit2, LogOut } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

import { saveUserProfile, logoutUser } from '../../utils/api';

interface ProfileData {
  name: string;
  fears: string[];
  goals: string[];
  avatar: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    fears: [],
    goals: [],
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
  });
  
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFear, setNewFear] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [tempFears, setTempFears] = useState<string[]>([]);
  const [tempGoals, setTempGoals] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);
  
  useEffect(() => {
    // Initialize temporary lists when profile loads
    setTempFears([...profile.fears]);
    setTempGoals([...profile.goals]);
  }, [profile.fears, profile.goals]);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('profile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        // Ensure fears and goals are arrays
        setProfile({
          ...parsedProfile,
          fears: Array.isArray(parsedProfile.fears) ? parsedProfile.fears : [],
          goals: Array.isArray(parsedProfile.goals) ? parsedProfile.goals : []
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Reset to default state if error occurs
      setProfile({
        name: '',
        fears: [],
        goals: [],
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
      });
    }
  };

  const saveProfile = async (updatedProfile: ProfileData) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        console.error('User not logged in');
        // Show error alert to user
        alert('Failed to save profile - User not logged in. Please log in first.');
        return;
      }
      await AsyncStorage.setItem('profile', JSON.stringify(updatedProfile));
      // Save to backend database
      await saveUserProfile({
        name: updatedProfile.name,
        goals: updatedProfile.goals,
        fears: updatedProfile.fears
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveProfile = () => {
    // Update name if in edit mode
    let updatedName = profile.name;
    if (editMode && newName.trim()) {
      updatedName = newName.trim();
      setEditMode(false);
    }
    
    // Create updated profile with all changes
    const updatedProfile = { 
      ...profile, 
      name: updatedName,
      fears: tempFears,
      goals: tempGoals
    };
    
    // Save to backend and update local state
    saveProfile(updatedProfile);
    setProfile(updatedProfile);
    setHasUnsavedChanges(false);
  };

  const addFear = () => {
    if (newFear.trim()) {
      const updatedFears = [...tempFears, newFear.trim()];
      setTempFears(updatedFears);
      setNewFear('');
      setHasUnsavedChanges(true);
    }
  };

  const removeFear = (index: number) => {
    const updatedFears = tempFears.filter((_, i) => i !== index);
    setTempFears(updatedFears);
    setHasUnsavedChanges(true);
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      const updatedGoals = [...tempGoals, newGoal.trim()];
      setTempGoals(updatedGoals);
      setNewGoal('');
      setHasUnsavedChanges(true);
    }
  };

  const removeGoal = (index: number) => {
    const updatedGoals = tempGoals.filter((_, i) => i !== index);
    setTempGoals(updatedGoals);
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    if (editMode) {
      setNewName(profile.name);
    }
  }, [editMode, profile.name]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={24} color="#FF3B30" />
        </TouchableOpacity>
        
        <Image
          source={{ uri: profile.avatar }}
          style={styles.avatar}
        />
        
        {editMode ? (
          <View style={styles.editNameContainer}>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={(text) => {
                setNewName(text);
                setHasUnsavedChanges(true);
              }}
              placeholder="Enter your name"
            />
            <TouchableOpacity style={styles.saveButton} onPress={() => setEditMode(false)}>
              <Save size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{profile.name || 'Your Name'}</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => {
              setEditMode(true);
              setNewName(profile.name);
            }}>
              <Edit2 size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fears</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newFear}
            onChangeText={setNewFear}
            placeholder="Add a fear"
          />
          <TouchableOpacity style={styles.addButton} onPress={addFear}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.itemsList}>
          {tempFears.length === 0 ? (
            <Text style={styles.emptyText}>No fears added yet</Text>
          ) : (
            tempFears.map((fear, index) => (
              <View key={index} style={styles.item}>
                <Text style={styles.itemText}>{fear}</Text>
                <TouchableOpacity onPress={() => removeFear(index)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goals</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newGoal}
            onChangeText={setNewGoal}
            placeholder="Add a goal"
          />
          <TouchableOpacity style={styles.addButton} onPress={addGoal}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.itemsList}>
          {tempGoals.length === 0 ? (
            <Text style={styles.emptyText}>No goals added yet</Text>
          ) : (
            tempGoals.map((goal, index) => (
              <View key={index} style={styles.item}>
                <Text style={styles.itemText}>{goal}</Text>
                <TouchableOpacity onPress={() => removeGoal(index)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
      
      {hasUnsavedChanges && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.mainSaveButton} onPress={handleSaveProfile}>
            <Save size={20} color="#FFFFFF" style={styles.saveIcon} />
            <Text style={styles.saveButtonText}>Save All Changes</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginRight: 8,
  },
  editButton: {
    padding: 4,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 8,
    fontSize: 18,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1C1C1E',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  itemsList: {
    marginTop: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  itemText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  removeButton: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  emptyText: {
    color: '#8E8E93',
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  saveButtonContainer: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  mainSaveButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '80%',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  saveIcon: {
    marginRight: 4,
  },
  logoutButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
});