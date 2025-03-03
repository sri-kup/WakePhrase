import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, Vibration } from 'react-native';
import { stopAlarmSound, playAlarmSound, initializeAlarmSound } from '../utils/alarmManager';
import { generatePhrase } from '../utils/api';

interface AlarmTriggerModalProps {
  visible: boolean;
  alarm: {
    label: string;
    time: string;
  } | null;
  onDismiss: () => void;
  onSnooze: () => void;
}

const AlarmTriggerModal: React.FC<AlarmTriggerModalProps> = ({
  visible,
  alarm,
  onDismiss,
  onSnooze,
}) => {
  const [userInput, setUserInput] = useState<string>('');
  const [wakePhrase, setWakePhrase] = useState<string>('');
  const [phraseType, setPhraseType] = useState<'dismiss' | 'snooze'>('dismiss');
  const [showPhrase, setShowPhrase] = useState(false);
  const [error, setError] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Initialize alarm sound when component mounts
    initializeAlarmSound();

    if (visible && alarm) {
      console.log('[DEBUG] Alarm triggered:', { time: alarm.time, label: alarm.label });
      // Start vibration pattern when alarm appears
      Vibration.vibrate([500, 1000, 500, 1000], true);
      // Play alarm sound
      playAlarmSound();
    }

    return () => {
      console.log('[DEBUG] Cleaning up alarm resources');
      stopAlarmSound().catch(error => {
        console.error('[DEBUG] Error stopping alarm sound during cleanup:', error);
      });
      Vibration.cancel();
    };
  }, [visible, alarm]);

  // Remove redundant cleanup effect
  useEffect(() => {
    return () => {
      stopAlarmSound().catch(error => {
        console.error('[DEBUG] Error stopping alarm sound during cleanup:', error);
      });
      Vibration.cancel();
    };
  }, []);

  const handleActionPress = async (action: 'dismiss' | 'snooze') => {
    console.log('[DEBUG] Action pressed:', action);
    setPhraseType(action);
    try {
      setIsValidating(true);
      const phrase = await generatePhrase(action);
      console.log('[DEBUG] Generated phrase:', phrase);
      setWakePhrase(phrase);
      setShowPhrase(true);
      setError('');
    } catch (error) {
      console.error('[DEBUG] Error generating wake phrase:', error);
      // Fallback to direct action if phrase generation fails
      handleAction(action);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAction = async (action: 'dismiss' | 'snooze') => {
    console.log('[DEBUG] Starting handleAction:', { action });
    try {
      // Ensure sound is stopped first
      console.log('[DEBUG] Attempting to stop alarm sound');
      await stopAlarmSound();
      console.log('[DEBUG] Successfully stopped alarm sound');
      
      // Cancel vibration
      console.log('[DEBUG] Cancelling vibration');
      Vibration.cancel();
      
      // Clear all state before proceeding with action
      console.log('[DEBUG] Clearing modal state');
      setUserInput('');
      setShowPhrase(false);
      setWakePhrase('');
      setError('');
      
      // Only call the action after cleanup is complete
      console.log('[DEBUG] Executing action:', action);
      if (action === 'dismiss') {
        onDismiss();
      } else {
        onSnooze();
      }
    } catch (error) {
      console.error('[DEBUG] Error in handleAction:', error);
      // Still proceed with the action even if sound stopping fails
      console.log('[DEBUG] Proceeding with action despite error');
      if (action === 'dismiss') {
        onDismiss();
      } else {
        onSnooze();
      }
    }
  };

  const checkPhrase = () => {
    console.log('[DEBUG] Checking phrase:', {
      userInput: userInput.toLowerCase().trim(),
      wakePhrase: wakePhrase.toLowerCase().trim(),
      match: userInput.toLowerCase().trim() === wakePhrase.toLowerCase().trim()
    });
    
    if (userInput.toLowerCase().trim() === wakePhrase.toLowerCase().trim()) {
      console.log('[DEBUG] Phrase matched, executing action:', phraseType);
      handleAction(phraseType);
    } else {
      console.log('[DEBUG] Phrase mismatch');
      setError('Incorrect phrase. Please try again.');
    }
  };

  if (!visible || !alarm) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {}}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.time}>{alarm.time}</Text>
          <Text style={styles.label}>{alarm.label || 'Alarm'}</Text>
          
          {showPhrase ? (
            <View style={styles.phraseContainer}>
              <Text style={styles.phraseTitle}>Type this phrase to {phraseType}:</Text>
              <Text style={styles.phrase}>{wakePhrase}</Text>
              <TextInput
                style={styles.input}
                value={userInput}
                onChangeText={(text) => {
                  setUserInput(text);
                  setError('');
                }}
                onSubmitEditing={checkPhrase}
                placeholder="Type the phrase here"
                autoFocus
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={checkPhrase}
                disabled={isValidating}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.dismissButton]}
                onPress={() => handleActionPress('dismiss')}
              >
                <Text style={styles.buttonText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.snoozeButton]}
                onPress={() => handleActionPress('snooze')}
              >
                <Text style={styles.buttonText}>Snooze</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: Dimensions.get('window').width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  time: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    fontSize: 24,
    color: '#666',
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: '#ff4444',
  },
  snoozeButton: {
    backgroundColor: '#4444ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  phraseContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  phraseTitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  phrase: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    marginTop: 5,
    marginBottom: 10,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
  },
});

export default AlarmTriggerModal;