import 'package:flutter/material.dart';
import 'dart:async';

class AlarmsScreen extends StatefulWidget {
  const AlarmsScreen({super.key});

  @override
  State<AlarmsScreen> createState() => _AlarmsScreenState();
}

class _AlarmsScreenState extends State<AlarmsScreen> {
  final List<TimeOfDay> _alarms = []; // List to store alarms
  final TextEditingController _timeController = TextEditingController(); // For typed input

  // Function to add alarm to the list
  void _addAlarm(TimeOfDay time) {
    setState(() {
      _alarms.add(time);
      _alarms.sort((a, b) => a.hour == b.hour
          ? a.minute.compareTo(b.minute)
          : a.hour.compareTo(b.hour)); // Sort alarms in ascending order
    });
  }

  // Show time picker dialog
  Future<void> _showTimePicker() async {
    final TimeOfDay? selectedTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (selectedTime != null) {
      _addAlarm(selectedTime);
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

      _addAlarm(TimeOfDay(hour: hour, minute: minute));
      _timeController.clear(); // Clear the input field
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Invalid time format. Use HH:mm")),
      );
    }
  }

  // Convert TimeOfDay to a readable string
  String _formatTime(TimeOfDay time) {
    final String hour = time.hour.toString().padLeft(2, '0');
    final String minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
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
                final TimeOfDay alarm = _alarms[index];
                return ListTile(
                  title: Text(
                    _formatTime(alarm),
                    style: const TextStyle(fontSize: 16),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete),
                    onPressed: () {
                      setState(() {
                        _alarms.removeAt(index);
                      });
                    },
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
