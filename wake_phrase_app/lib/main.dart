import 'package:flutter/material.dart';
import 'package:android_alarm_manager_plus/android_alarm_manager_plus.dart';
import 'screens/alarms_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/alarm_trigger_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized(); // Ensure widgets are initialized
  // await AndroidAlarmManager.initialize(); // Initialize alarm manager
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
      routes: {
        // Define a route for AlarmTriggerScreen
        '/alarm-trigger': (context) => const AlarmTriggerScreen(),
      },
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

  // Screens for navigation
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
