import 'package:flutter/material.dart';
import 'package:http/http.dart' as http; // Required for backend integration
import 'dart:convert';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key}); // Add this for compatibility with `const`

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _goalsController = TextEditingController();
  final TextEditingController _fearsController = TextEditingController();

  bool _isLoading = false;

  // Replace with dynamic user_id when authentication is added
  final String _userId = "123e4567-e89b-12d3-a456-426614174000";

  Future<void> _saveProfile() async {
    final String name = _nameController.text;
    final String goals = _goalsController.text;
    final String fears = _fearsController.text;

    if (name.isEmpty || goals.isEmpty || fears.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please fill out all fields")),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // const String apiUrl = "http://127.0.0.1:5000/profile";
      const String apiUrl = "http://192.168.1.128:5001/profile";

      final Map<String, dynamic> requestBody = {
        "user_id": _userId,
        "name": name,
        "goals": goals,
        "fears": fears,
      };

      final http.Response response = await http.post(
        Uri.parse(apiUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(requestBody),
      );

      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Profile saved successfully!")),
        );
      } else {
        final error = jsonDecode(response.body)["error"] ?? "Unknown error";
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $error")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error: $e")),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: 'Name'),
          ),
          TextField(
            controller: _goalsController,
            decoration: const InputDecoration(labelText: 'Goals'),
          ),
          TextField(
            controller: _fearsController,
            decoration: const InputDecoration(labelText: 'Fears'),
          ),
          const SizedBox(height: 20),
          _isLoading
              ? const CircularProgressIndicator()
              : ElevatedButton(
                  onPressed: _saveProfile,
                  child: const Text('Save Profile'),
                ),
        ],
      ),
    );
  }
}
