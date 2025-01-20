import 'package:flutter/material.dart';
import 'package:android_alarm_manager_plus/android_alarm_manager_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import '../alarm_manager.dart';

class AlarmsScreen extends StatefulWidget {
  const AlarmsScreen({super.key});

  @override
  State<AlarmsScreen> createState() => _AlarmsScreenState();
}

class _AlarmsScreenState extends State<AlarmsScreen> {
  final List<Map<String, dynamic>> _alarms = []; // List to store alarms
  final TextEditingController _timeController = TextEditingController(); // For typed input

  @override
  void initState() {
    super.initState();
    _loadAlarms(); // Load stored alarms on screen load
  }

  // Load alarms from SharedPreferences
  Future<void> _loadAlarms() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    List<String> storedAlarms = prefs.getStringList(AlarmManager.alarmsKey) ?? [];
    setState(() {
      _alarms.addAll(storedAlarms.map((alarm) {
        final parts = alarm.split(',');
        return {
          "id": int.parse(parts[0]),
          "time": DateTime.parse(parts[1]),
          "action": parts[2],
          "userId": parts[3],
        };
      }).toList());
      _alarms.sort((a, b) => a["time"].compareTo(b["time"])); // Sort alarms
    });
  }

  // Add an alarm to the list and schedule it
  void _addAlarm(DateTime time) async {
    int alarmId = _alarms.length + 1; // Unique alarm ID
    String userId = "123e4567-e89b-12d3-a456-426614174000"; // Placeholder user ID
    String action = "dismiss"; // Default action

    await AlarmManager.scheduleAlarm(
      id: alarmId,
      time: time,
      userId: userId,
      action: action,
    );

    setState(() {
      _alarms.add({
        "id": alarmId,
        "time": time,
        "action": action,
        "userId": userId,
      });
      _alarms.sort((a, b) => a["time"].compareTo(b["time"])); // Sort alarms
    });
  }

  // Show time picker dialog
  Future<void> _showTimePicker() async {
    final TimeOfDay? selectedTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (selectedTime != null) {
      final DateTime now = DateTime.now();
      DateTime alarmTime = DateTime(
        now.year,
        now.month,
        now.day,
        selectedTime.hour,
        selectedTime.minute,
      );
      if (alarmTime.isBefore(now)) {
        alarmTime = alarmTime.add(const Duration(days: 1)); // Next day
      }
      _addAlarm(alarmTime);
    }
  }

  // Add alarm from typed input
  void _addAlarmFromTypedInput() {
    final String input = _timeController.text;
    if (input.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please enter a time")),
      );
      return;
    }

    try {
      final parts = input.split(':');
      if (parts.length != 2) throw FormatException();

      final int hour = int.parse(parts[0]);
      final int minute = int.parse(parts[1]);

      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        throw FormatException();
      }

      final DateTime now = DateTime.now();
      DateTime alarmTime = DateTime(now.year, now.month, now.day, hour, minute);
      if (alarmTime.isBefore(now)) {
        alarmTime = alarmTime.add(const Duration(days: 1)); // Next day
      }
      _addAlarm(alarmTime);
      _timeController.clear(); // Clear the input field
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Invalid time format. Use HH:mm")),
      );
    }
  }

  // Convert DateTime to a readable string
  String _formatTime(DateTime time) {
    return DateFormat.jm().format(time); // Format as 12-hour time
  }

  // Delete alarm
  void _deleteAlarm(int id) async {
    await AlarmManager.cancelAlarm(id);
    setState(() {
      _alarms.removeWhere((alarm) => alarm["id"] == id);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _timeController,
                  decoration: const InputDecoration(
                    labelText: 'Enter time (HH:mm)',
                  ),
                  keyboardType: TextInputType.datetime,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add),
                onPressed: _addAlarmFromTypedInput,
              ),
            ],
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: _showTimePicker,
            child: const Text("Pick a time"),
          ),
          const SizedBox(height: 20),
          const Text(
            "Set Alarms:",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: ListView.builder(
              itemCount: _alarms.length,
              itemBuilder: (context, index) {
                final alarm = _alarms[index];
                return ListTile(
                  title: Text(
                    _formatTime(alarm["time"]),
                    style: const TextStyle(fontSize: 16),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete),
                    onPressed: () => _deleteAlarm(alarm["id"]),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
