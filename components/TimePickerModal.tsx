import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ScrollView
} from 'react-native';

interface TimePickerModalProps {
  visible: boolean;
  initialTime: string;
  onClose: () => void;
  onSelectTime: (time: string) => void;
}

export default function TimePickerModal({
  visible,
  initialTime,
  onClose,
  onSelectTime
}: TimePickerModalProps) {
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    if (initialTime) {
      const [hours, minutes] = initialTime.split(':').map(Number);
      if (hours >= 12) {
        setSelectedHour(hours === 12 ? 12 : hours - 12);
        setPeriod('PM');
      } else {
        setSelectedHour(hours === 0 ? 12 : hours);
        setPeriod('AM');
      }
      setSelectedMinute(minutes);
    }
  }, [initialTime, visible]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleSave = () => {
    let hour = selectedHour;
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    const formattedHour = hour.toString().padStart(2, '0');
    const formattedMinute = selectedMinute.toString().padStart(2, '0');
    onSelectTime(`${formattedHour}:${formattedMinute}`);
    onClose();
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
          <Text style={styles.modalTitle}>Select Time</Text>
          
          <View style={styles.pickerContainer}>
            {/* Hours */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Hour</Text>
              <ScrollView 
                style={styles.pickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={`hour-${hour}`}
                    style={[
                      styles.pickerItem,
                      selectedHour === hour && styles.selectedPickerItem
                    ]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedHour === hour && styles.selectedPickerItemText
                    ]}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Minutes */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Minute</Text>
              <ScrollView 
                style={styles.pickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={`minute-${minute}`}
                    style={[
                      styles.pickerItem,
                      selectedMinute === minute && styles.selectedPickerItem
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedMinute === minute && styles.selectedPickerItemText
                    ]}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* AM/PM */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>AM/PM</Text>
              <View style={styles.periodContainer}>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    period === 'AM' && styles.selectedPeriodButton
                  ]}
                  onPress={() => setPeriod('AM')}
                >
                  <Text style={[
                    styles.periodButtonText,
                    period === 'AM' && styles.selectedPeriodButtonText
                  ]}>
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    period === 'PM' && styles.selectedPeriodButton
                  ]}
                  onPress={() => setPeriod('PM')}
                >
                  <Text style={[
                    styles.periodButtonText,
                    period === 'PM' && styles.selectedPeriodButtonText
                  ]}>
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.selectedTimeDisplay}>
            <Text style={styles.selectedTimeText}>
              {selectedHour.toString().padStart(2, '0')}:
              {selectedMinute.toString().padStart(2, '0')} {period}
            </Text>
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
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1C1C1E',
  },
  pickerScroll: {
    height: 150,
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPickerItem: {
    backgroundColor: '#E5F1FF',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 18,
    color: '#1C1C1E',
  },
  selectedPickerItemText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  periodContainer: {
    marginTop: 10,
  },
  periodButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  selectedPeriodButtonText: {
    color: '#FFFFFF',
  },
  selectedTimeDisplay: {
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  selectedTimeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
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