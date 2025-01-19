import 'package:flutter/material.dart';
import 'screens/alarms_screen.dart';
import 'screens/profile_screen.dart';

void main() {
  runApp(const WakePhraseApp());
}

class WakePhraseApp extends StatelessWidget {
  const WakePhraseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'WakePhrase',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  MainScreenState createState() => MainScreenState();
}

class MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  // Updated screens with functional AlarmsScreen and ProfileScreen
  final List<Widget> _screens = [
    const AlarmsScreen(),
    const ProfileScreen(),
  ];

  void _onTabTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('WakePhrase'),
      ),
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onTabTapped,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.alarm), label: 'Alarms'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
