import 'package:flutter/material.dart';

class AlarmTriggerScreen extends StatefulWidget {
  const AlarmTriggerScreen({super.key});

  @override
  State<AlarmTriggerScreen> createState() => _AlarmScreenState();
}

class _AlarmScreenState extends State<AlarmTriggerScreen> {
  String _phrase = "Loading phrase..."; // Placeholder for the phrase
  final TextEditingController _inputController = TextEditingController();
  bool _isLoading = true; // Tracks whether the phrase is loading

  // Simulate phrase loading (Replace this with actual API call later)
  Future<void> _loadPhrase() async {
    setState(() {
      _isLoading = true;
    });

    await Future.delayed(const Duration(seconds: 2)); // Simulate API delay

    setState(() {
      _phrase = "Yes, I will achieve my dreams!"; // Replace with actual phrase
      _isLoading = false;
    });
  }

  // Validate the input phrase
  void _validatePhrase() {
    if (_inputController.text == _phrase) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Success! Alarm dismissed.")),
      );
      // Stop the alarm here
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Incorrect phrase. Try again.")),
      );
    }
  }

  // Simulate Snooze
  void _snoozeAlarm() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Alarm snoozed for 5 minutes.")),
    );
    // Logic for snoozing the alarm goes here
  }

  @override
  void initState() {
    super.initState();
    _loadPhrase(); // Load the phrase when the screen is opened
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Alarm Triggered"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Phrase Display
            if (_isLoading)
              const CircularProgressIndicator()
            else
              Text(
                _phrase,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
            const SizedBox(height: 20),

            // Text Input
            TextField(
              controller: _inputController,
              decoration: const InputDecoration(
                labelText: "Retype the phrase",
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),

            // Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: _validatePhrase,
                  child: const Text("Validate"),
                ),
                ElevatedButton(
                  onPressed: _snoozeAlarm,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                  ),
                  child: const Text("Snooze"),
                ),
                ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Alarm dismissed.")),
                    );
                    // Logic to dismiss the alarm
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                  ),
                  child: const Text("Dismiss"),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
