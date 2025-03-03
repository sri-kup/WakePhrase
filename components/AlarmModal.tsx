import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform
} from 'react-native';
import { format, parse } from 'date-fns';
import TimePickerModal from './TimePickerModal';
import { Alarm } from '../utils/alarmManager';

interface AlarmModalProps {
  visible: boolean;
  alarm: Alarm | null;
  onClose: () => void;
  onSave: (alarm: Alarm) => void;
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AlarmModal({
  visible,
  alarm,
  onClose,
  onSave
}: AlarmModalProps) {
  const [time, setTime] = useState('08:00');
  const [formattedTime, setFormattedTime] = useState('');
  const [label, setLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  useEffect(() => {
    if (alarm) {
      setTime(alarm.time);
      setLabel(alarm.label);
      setSelectedDays(alarm.days);
    } else {
      resetForm();
    }
  }, [alarm, visible]);

  useEffect(() => {
    if (time) {
      try {
        const parsedTime = parse(time, 'HH:mm', new Date());
        setFormattedTime(format(parsedTime, 'h:mm a'));
      } catch (error) {
        console.error('Error formatting time:', error);
        setFormattedTime(time);
      }
    }
  }, [time]);

  const resetForm = () => {
    setTime('08:00');
    setLabel('');
    setSelectedDays([]);
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = () => {
    const updatedAlarm: Alarm = {
      id: alarm ? alarm.id : Date.now().toString(),
      time,
      label,
      days: selectedDays,
      isActive: alarm ? alarm.isActive : true,
      notificationIds: alarm?.notificationIds || [],
    };
    
    onSave(updatedAlarm);
    resetForm();
  };

  const openTimePicker = () => {
    setTimePickerVisible(true);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {alarm ? 'Edit Alarm' : 'Add Alarm'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Time</Text>
            <TouchableOpacity 
              style={styles.timeInput}
              onPress={openTimePicker}
            >
              <Text style={styles.timeInputText}>{formattedTime || time}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Label</Text>
            <TextInput
              style={styles.textInput}
              value={label}
              onChangeText={setLabel}
              placeholder="Alarm label"
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Repeat</Text>
            <View style={styles.daysSelector}>
              {daysOfWeek.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    selectedDays.includes(day) && styles.selectedDayButton,
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      selectedDays.includes(day) && styles.selectedDayButtonText,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>
                {alarm ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TimePickerModal
        visible={timePickerVisible}
        initialTime={time}
        onClose={() => setTimePickerVisible(false)}
        onSelectTime={(selectedTime) => {
          setTime(selectedTime);
          setTimePickerVisible(false);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1C1C1E',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  timeInputText: {
    fontSize: 18,
    color: '#1C1C1E',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  daysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 8,
    marginRight: 4,
  },
  selectedDayButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayButtonText: {
    color: '#1C1C1E',
    fontSize: 14,
  },
  selectedDayButtonText: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#1C1C1E',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});