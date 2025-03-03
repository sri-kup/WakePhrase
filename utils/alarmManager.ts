import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { format, parse, isToday, isTomorrow, addDays, isAfter } from 'date-fns';

// Add this near the top of the file, after imports
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface Alarm {
  id: string;
  time: string;
  label: string;
  days: string[];
  isActive: boolean;
  sound?: string;
  notificationIds?: string[];
}

const ALARMS_STORAGE_KEY = 'alarms';
const DEFAULT_ALARM_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

let sound: Audio.Sound | null = null;

// Add initialization cleanup
export const initializeAlarmSound = async (): Promise<void> => {
  await stopAlarmSound();
  sound = null;
};

// Add a counter to track active sounds
let activeAlarmSounds = 0;

export const playAlarmSound = async (soundUri: string = DEFAULT_ALARM_SOUND): Promise<Audio.Sound | null> => {
  console.log('[DEBUG] Starting playAlarmSound, current active sounds:', activeAlarmSounds);
  // Ensure any existing sounds are stopped first
  await stopAlarmSound();

  if (Platform.OS === 'web') {
    console.log('[DEBUG] Playing alarm on web platform');
    const audioElement = document.createElement('audio');
    audioElement.src = soundUri;
    audioElement.loop = true;
    audioElement.play().catch((error: Error) => console.error('Error playing sound on web:', error));
    activeAlarmSounds++;
    console.log('[DEBUG] Web audio started, active sounds:', activeAlarmSounds);
    return null;
  }

  try {
    console.log('[DEBUG] Creating new alarm sound');
    // Create and load the new sound
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: soundUri },
      { shouldPlay: true, isLooping: true, volume: 1.0 }
    );
    
    // Store the new sound in the global variable
    sound = newSound;
    activeAlarmSounds++;
    console.log('[DEBUG] Alarm sound created and playing, active sounds:', activeAlarmSounds);
    return newSound;
  } catch (error) {
    console.error('[DEBUG] Error playing alarm sound:', error);
    return null;
  }
};

export const stopAlarmSound = async (soundToStop?: Audio.Sound | null): Promise<void> => {
  console.log('[DEBUG] Starting stopAlarmSound, current active sounds:', activeAlarmSounds);
  
  if (Platform.OS === 'web') {
    console.log('[DEBUG] Stopping web audio elements');
    const audioElements = document.getElementsByTagName('audio');
    for (let i = 0; i < audioElements.length; i++) {
      audioElements[i].pause();
      audioElements[i].currentTime = 0;
      activeAlarmSounds = Math.max(0, activeAlarmSounds - 1);
    }
    console.log('[DEBUG] Web audio stopped, remaining active sounds:', activeAlarmSounds);
    return;
  }

  try {
    const soundsToStop = [soundToStop, sound].filter(Boolean);
    console.log('[DEBUG] Stopping', soundsToStop.length, 'sound objects');
    
    for (const soundObj of soundsToStop) {
      if (soundObj) {
        const status = await soundObj.getStatusAsync();
        if (status.isLoaded) {
          console.log('[DEBUG] Unloading active sound');
          await soundObj.stopAsync();
          await soundObj.unloadAsync();
          activeAlarmSounds = Math.max(0, activeAlarmSounds - 1);
        }
      }
    }
    sound = null;
    console.log('[DEBUG] All sounds stopped, remaining active sounds:', activeAlarmSounds);
  } catch (error) {
    console.error('[DEBUG] Error stopping alarm sound:', error);
    // Reset counters and references on error to prevent stuck state
    sound = null;
    activeAlarmSounds = 0;
    console.log('[DEBUG] Reset sound state due to error');
  }
};

export const loadAlarms = async (): Promise<Alarm[]> => {
  try {
    const savedAlarms = await AsyncStorage.getItem(ALARMS_STORAGE_KEY);
    if (savedAlarms) {
      return JSON.parse(savedAlarms);
    }
    return [];
  } catch (error) {
    console.error('Failed to load alarms:', error);
    return [];
  }
};

export const saveAlarms = async (alarms: Alarm[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(alarms));
  } catch (error) {
    console.error('Failed to save alarms:', error);
  }
};

export const scheduleAlarmNotifications = async (alarm: Alarm): Promise<string[]> => {
  console.log('[DEBUG] Scheduling alarm notifications:', { alarmId: alarm.id, time: alarm.time, days: alarm.days });
  
  if (!alarm.isActive || Platform.OS === 'web') {
    console.log('[DEBUG] Skipping alarm scheduling:', { reason: !alarm.isActive ? 'alarm inactive' : 'web platform' });
    return [];
  }

  // Cancel any existing notifications for this alarm
  if (alarm.notificationIds && alarm.notificationIds.length > 0) {
    await cancelAlarmNotifications(alarm.notificationIds);
  }

  const notificationIds: string[] = [];

  // If no days are selected, schedule for today or tomorrow
  if (alarm.days.length === 0) {
    const notificationId = await scheduleOneTimeAlarm(alarm);
    if (notificationId) {
      notificationIds.push(notificationId);
    }
    return notificationIds;
  }

  // Schedule for each selected day of the week
  const daysMap: { [key: string]: number } = {
    'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0
  };

  for (const day of alarm.days) {
    const dayNumber = daysMap[day];
    const notificationId = await scheduleRepeatingAlarm(alarm, dayNumber);
    if (notificationId) {
      notificationIds.push(notificationId);
    }
  }

  return notificationIds;
};

const scheduleOneTimeAlarm = async (alarm: Alarm): Promise<string | null> => {
  console.log('[DEBUG] Scheduling one-time alarm:', { alarmId: alarm.id, time: alarm.time });
  try {
    const [hours, minutes] = alarm.time.split(':').map(Number);
    
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (isAfter(new Date(), scheduledDate)) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }
    
    const trigger = scheduledDate;
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.label || 'Alarm',
        body: `It's ${format(scheduledDate, 'h:mm a')}`,
        sound: alarm.sound || DEFAULT_ALARM_SOUND,
        data: { alarmId: alarm.id },
      },
      trigger,
    });
    
    return identifier;
  } catch (error) {
    console.error('Error scheduling one-time alarm:', error);
    return null;
  }
};

const scheduleRepeatingAlarm = async (alarm: Alarm, dayOfWeek: number): Promise<string | null> => {
  console.log('[DEBUG] Scheduling repeating alarm:', { alarmId: alarm.id, time: alarm.time, dayOfWeek });
  try {
    const [hours, minutes] = alarm.time.split(':').map(Number);
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.label || 'Alarm',
        body: `It's ${alarm.time}`,
        sound: alarm.sound || DEFAULT_ALARM_SOUND,
        data: { alarmId: alarm.id },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        weekday: dayOfWeek,
        repeats: true,
      },
    });
    
    return identifier;
  } catch (error) {
    console.error('Error scheduling repeating alarm:', error);
    return null;
  }
};

export const cancelAlarmNotifications = async (notificationIds: string[]): Promise<void> => {
  if (Platform.OS === 'web') return;
  
  for (const id of notificationIds) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
};



export const getNextAlarmText = (alarms: Alarm[]): string => {
  if (!alarms || alarms.length === 0) {
    return 'No alarms set';
  }

  const activeAlarms = alarms.filter(alarm => alarm.isActive);
  if (activeAlarms.length === 0) {
    return 'No active alarms';
  }

  // Get current day of week (0-6, where 0 is Sunday)
  const today = new Date().getDay();
  const daysMap: { [key: string]: number } = {
    'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0
  };
  
  // Convert current time to minutes for comparison
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  let nextAlarm: Alarm | null = null;
  let nextAlarmMinutes = Infinity;
  let daysUntilNextAlarm = 7; // Maximum days until alarm repeats
  
  for (const alarm of activeAlarms) {
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const alarmMinutes = hours * 60 + minutes;
    
    if (alarm.days.length === 0) {
      // One-time alarm
      if (alarmMinutes > currentMinutes && alarmMinutes < nextAlarmMinutes) {
        nextAlarm = alarm;
        nextAlarmMinutes = alarmMinutes;
        daysUntilNextAlarm = 0;
      }
    } else {
      // Repeating alarm
      for (const day of alarm.days) {
        const dayNumber = daysMap[day];
        let daysUntil = (dayNumber - today + 7) % 7;
        
        // If it's the same day and the alarm time has passed, it will ring next week
        if (daysUntil === 0 && alarmMinutes <= currentMinutes) {
          daysUntil = 7;
        }
        
        if (daysUntil < daysUntilNextAlarm || 
            (daysUntil === daysUntilNextAlarm && alarmMinutes < nextAlarmMinutes)) {
          nextAlarm = alarm;
          nextAlarmMinutes = alarmMinutes;
          daysUntilNextAlarm = daysUntil;
        }
      }
    }
  }
  
  if (!nextAlarm) {
    return 'No upcoming alarms';
  }
  
  // Format the next alarm time
  const nextTime = format(
    parse(nextAlarm.time, 'HH:mm', new Date()),
    'h:mm a'
  );
  
  if (daysUntilNextAlarm === 0) {
    return `Next alarm today at ${nextTime}`;
  } else if (daysUntilNextAlarm === 1) {
    return `Next alarm tomorrow at ${nextTime}`;
  } else {
    const nextDate = addDays(new Date(), daysUntilNextAlarm);
    const dayName = format(nextDate, 'EEEE');
    return `Next alarm on ${dayName} at ${nextTime}`;
  }
};

// Add notification listener setup
export const setupNotifications = async () => {
  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Notification permissions not granted');
    return;
  }
};

export const scheduleSnooze = async (alarm: Alarm, snoozeMinutes: number = 2): Promise<string | null> => {
  console.log('[DEBUG] Scheduling snooze alarm:', { alarmId: alarm.id, snoozeMinutes });
  try {
    const now = new Date();
    const snoozeTime = new Date(now.getTime() + snoozeMinutes * 60000);
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${alarm.label || 'Alarm'} (Snoozed)`,
        body: `Snoozed alarm for ${snoozeMinutes} minutes`,
        sound: alarm.sound || DEFAULT_ALARM_SOUND,
        data: { alarmId: alarm.id },
      },
      trigger: snoozeTime,
    });
    
    return identifier;
  } catch (error) {
    console.error('Error scheduling snooze alarm:', error);
    return null;
  }
};