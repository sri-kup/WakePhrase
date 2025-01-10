import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          TextField(
            decoration: InputDecoration(labelText: 'Name'),
          ),
          TextField(
            decoration: InputDecoration(labelText: 'Goals'),
          ),
          TextField(
            decoration: InputDecoration(labelText: 'Fears'),
          ),
          SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {
              // Save profile logic here
            },
            child: Text('Save Profile'),
          ),
        ],
      ),
    );
  }
}
