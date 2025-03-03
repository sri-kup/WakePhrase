import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { CreditCard as Edit, Trash2 } from 'lucide-react-native';
import { format, parse } from 'date-fns';
import { Alarm } from '../utils/alarmManager';

interface AlarmItemProps {
  alarm: Alarm;
  onToggle: (id: string) => void;
  onEdit: (alarm: Alarm) => void;
  onDelete: (id: string) => void;
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AlarmItem({ alarm, onToggle, onEdit, onDelete }: AlarmItemProps) {
  // Format time to 12-hour format
  const formattedTime = format(
    parse(alarm.time, 'HH:mm', new Date()),
    'h:mm a'
  );

  return (
    <View style={[styles.alarmItem, !alarm.isActive && styles.inactiveAlarmItem]}>
      <View style={styles.alarmInfo}>
        <Text style={[styles.alarmTime, !alarm.isActive && styles.inactiveText]}>
          {formattedTime}
        </Text>
        <Text style={styles.alarmLabel}>{alarm.label}</Text>
        <View style={styles.daysContainer}>
          {daysOfWeek.map((day) => (
            <Text
              key={day}
              style={[
                styles.dayIndicator,
                alarm.days.includes(day) ? styles.activeDayIndicator : styles.inactiveDayIndicator,
                !alarm.isActive && styles.disabledDayIndicator,
              ]}
            >
              {day[0]}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.alarmActions}>
        <Switch
          value={alarm.isActive}
          onValueChange={() => onToggle(alarm.id)}
          trackColor={{ false: '#E5E5EA', true: '#34C759' }}
          thumbColor="#FFFFFF"
        />
        <TouchableOpacity onPress={() => onEdit(alarm)} style={styles.iconButton}>
          <Edit size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(alarm.id)} style={styles.iconButton}>
          <Trash2 size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  alarmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inactiveAlarmItem: {
    opacity: 0.7,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  inactiveText: {
    color: '#8E8E93',
  },
  alarmLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dayIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginRight: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeDayIndicator: {
    backgroundColor: '#007AFF',
    color: '#FFFFFF',
  },
  inactiveDayIndicator: {
    backgroundColor: '#E5E5EA',
    color: '#8E8E93',
  },
  disabledDayIndicator: {
    opacity: 0.5,
  },
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
});