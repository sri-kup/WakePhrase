import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Vibration } from 'react-native';
import { Plus, Bell } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import AlarmItem from '../../components/AlarmItem';
import AlarmModal from '../../components/AlarmModal';
import AlarmTriggerModal from '../../components/AlarmTriggerModal';
import { 
  Alarm, 
  loadAlarms, 
  saveAlarms, 
  scheduleAlarmNotifications, 
  cancelAlarmNotifications,
  getNextAlarmText,
  stopAlarmSound,
  playAlarmSound,
  scheduleSnooze
} from '../../utils/alarmManager';
import { saveAlarm, getAlarms, deleteAlarm } from '../../utils/api';

// Notification handler is already set up in _layout.tsx

export default function AlarmScreen() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [nextAlarmText, setNextAlarmText] = useState('No alarms set');
  const [triggerModalVisible, setTriggerModalVisible] = useState(false);
  const [currentTriggeringAlarm, setCurrentTriggeringAlarm] = useState<Alarm | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    loadAlarmsData();
    
    // Set up notification listeners
    registerNotificationListeners();
    
    return () => {
      // Clean up notification listeners
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  useEffect(() => {
    // Update next alarm text whenever alarms change
    setNextAlarmText(getNextAlarmText(alarms));
  }, [alarms]);

  const loadAlarmsData = async () => {
    try {
      const savedAlarms = await getAlarms();
      // Ensure all alarms have valid IDs and required properties
      const validatedAlarms = savedAlarms.map(alarm => ({
        ...alarm,
        id: alarm.id || Date.now().toString(),
        label: alarm.label || 'Alarm', // Provide default label
        days: alarm.days || [], // Ensure days array exists
        isActive: typeof alarm.isActive === 'boolean' ? alarm.isActive : true, // Default to active
        sound: alarm.sound || undefined // Keep sound optional
      }));
      setAlarms(validatedAlarms);
    } catch (error) {
      console.error('Error loading alarms:', error);
      const localAlarms = await loadAlarms();
      setAlarms(localAlarms);
    }
  };

  const handleSaveAlarm = async (alarm: Alarm) => {
    let updatedAlarms: Alarm[];
    
    if (editingAlarm) {
      // Update existing alarm
      updatedAlarms = alarms.map((a) =>
        a.id === alarm.id ? alarm : a
      );
    } else {
      // Add new alarm
      updatedAlarms = [...alarms, alarm];
    }
    
    try {
      // Save to backend first
      const alarmId = await saveAlarm(alarm);
      if (!alarm.id) {
        // If it's a new alarm, update the ID from backend
        alarm.id = alarmId;
        updatedAlarms = updatedAlarms.map((a) =>
          a === alarm ? { ...a, id: alarmId } : a
        );
      }
      
      // Update state and local storage before scheduling notifications
      setAlarms(updatedAlarms);
      await saveAlarms(updatedAlarms);
      
      // Schedule notifications for the alarm
      if (alarm.isActive) {
        const notificationIds = await scheduleAlarmNotifications(alarm);
        
        // Create a new alarm object with notification IDs
        const updatedAlarmWithNotifications = { ...alarm, notificationIds };
        
        // Update the alarms array with the updated alarm
        const finalUpdatedAlarms = updatedAlarms.map((a) =>
          a.id === alarm.id ? updatedAlarmWithNotifications : a
        );
        
        // Update state and local storage again with notification IDs
        setAlarms(finalUpdatedAlarms);
        await saveAlarms(finalUpdatedAlarms);
      }
    } catch (error) {
      console.error('Error saving alarm:', error);
    }
    
    setModalVisible(false);
    setEditingAlarm(null);
  };

  const handleToggleAlarm = async (id: string) => {
    const updatedAlarms = alarms.map((alarm) => {
      if (alarm.id === id) {
        const updatedAlarm = { ...alarm, isActive: !alarm.isActive };
        
        // If turning on, schedule notifications
        if (updatedAlarm.isActive) {
          scheduleAlarmNotifications(updatedAlarm).then(notificationIds => {
            updatedAlarm.notificationIds = notificationIds;
            saveAlarms(alarms.map(a => a.id === id ? updatedAlarm : a));
          });
        } 
        // If turning off, cancel notifications
        else if (updatedAlarm.notificationIds && updatedAlarm.notificationIds.length > 0) {
          cancelAlarmNotifications(updatedAlarm.notificationIds);
          updatedAlarm.notificationIds = [];
        }
        
        return updatedAlarm;
      }
      return alarm;
    });
    
    setAlarms(updatedAlarms);
    await saveAlarms(updatedAlarms);
  };

  const handleDeleteAlarm = async (id: string) => {
    try {
      // Find the alarm to delete
      const alarmToDelete = alarms.find(alarm => alarm.id === id);
      
      // Cancel any scheduled notifications for this alarm
      if (alarmToDelete?.notificationIds && alarmToDelete.notificationIds.length > 0) {
        await cancelAlarmNotifications(alarmToDelete.notificationIds);
      }
      
      // Delete from backend database
      await deleteAlarm(id);
      
      // Remove the alarm from the list
      const updatedAlarms = alarms.filter((alarm) => alarm.id !== id);
      setAlarms(updatedAlarms);
      await saveAlarms(updatedAlarms);
    } catch (error) {
      console.error('Error deleting alarm:', error);
      alert('Failed to delete alarm. Please try again.');
    }
  };

  const openEditModal = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setEditingAlarm(null);
    setModalVisible(true);
  };

  const registerNotificationListeners = () => {
    console.log('[DEBUG] Setting up notification listeners');
    if (Platform.OS === 'web') {
      console.log('[DEBUG] Web platform detected, skipping notification setup');
      return;
    }
    
    // Single notification listener for handling both foreground and background notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(async notification => {
      console.log('[DEBUG] Notification received:', {
        content: notification.request.content,
        trigger: notification.request.trigger
      });
      
      let alarmId;
      try {
        // Access data from dataString JSON
        const content = notification.request.content;
        const dataString = content.dataString;
        if (dataString) {
          const parsedData = JSON.parse(dataString);
          alarmId = parsedData.alarmId;
        }
        
        if (!alarmId) {
          console.warn('[DEBUG] No alarmId found in notification data');
          return;
        }
      } catch (error) {
        console.error('[DEBUG] Error accessing notification data:', error);
        return;
      }
      
      console.log('[DEBUG] Extracted alarmId:', alarmId);
      
      if (alarmId) {
        let alarm = alarms.find(a => a.id === alarmId);
        
        if (!alarm) {
          try {
            const savedAlarms = await getAlarms();
            const validatedAlarm = savedAlarms.find(a => a.id === alarmId);
            if (validatedAlarm) {
              const validatedAlarms = savedAlarms
                .filter(a => a.id)
                .map(a => ({
                  ...a,
                  id: a.id!,
                  label: a.label || 'Alarm',
                  days: a.days || [],
                  isActive: typeof a.isActive === 'boolean' ? a.isActive : true,
                  notificationIds: a.notificationIds || []
                }));
              setAlarms(validatedAlarms);
              alarm = validatedAlarm;
            }
          } catch (error) {
            console.error('[DEBUG] Error fetching alarms from database:', error);
          }
        }
        
        if (alarm) {
          setCurrentTriggeringAlarm(alarm);
          setTriggerModalVisible(true);
        } else {
          console.warn('[DEBUG] No matching alarm found for ID:', alarmId);
        }
      }
    });
  };


  const handleAlarmDismiss = async () => {
    await stopAlarmSound();
    setTriggerModalVisible(false);
    setCurrentTriggeringAlarm(null);
  };

  const handleAlarmSnooze = async () => {
    try {
      // First stop any existing alarm sounds and cleanup
      await stopAlarmSound();
      
      // Cancel vibration
      Vibration.cancel();

      // Only schedule snooze after ensuring previous alarm is cleaned up
      if (currentTriggeringAlarm) {
        const snoozeId = await scheduleSnooze(currentTriggeringAlarm);
        if (snoozeId) {
          console.log('[DEBUG] Snooze alarm scheduled:', { alarmId: currentTriggeringAlarm.id, snoozeId });
        }
      }

      // Close the alarm trigger modal after cleanup and scheduling
      setTriggerModalVisible(false);
      setCurrentTriggeringAlarm(null);
    } catch (error) {
      console.error('[DEBUG] Error in handleAlarmSnooze:', error);
      // Ensure cleanup happens even if there's an error
      await stopAlarmSound().catch(e => console.error('Cleanup error:', e));
      Vibration.cancel();
      
      // Reset UI state
      setTriggerModalVisible(false);
      setCurrentTriggeringAlarm(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.nextAlarmContainer}>
        <Bell size={20} color="#007AFF" />
        <Text style={styles.nextAlarmText}>{nextAlarmText}</Text>
      </View>
      
      <ScrollView style={styles.alarmList}>
        {alarms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No alarms set</Text>
            <Text style={styles.emptyStateSubtext}>Tap the + button to add an alarm</Text>
          </View>
        ) : (
          alarms.map((alarm) => (
            <AlarmItem
              key={alarm.id}
              alarm={alarm}
              onToggle={handleToggleAlarm}
              onEdit={openEditModal}
              onDelete={handleDeleteAlarm}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <AlarmModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveAlarm}
        alarm={editingAlarm}
      />

      <AlarmTriggerModal
        visible={triggerModalVisible}
        alarm={currentTriggeringAlarm}
        onDismiss={handleAlarmDismiss}
        onSnooze={handleAlarmSnooze}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  nextAlarmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  nextAlarmText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
  },
  alarmList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8E8E93',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});