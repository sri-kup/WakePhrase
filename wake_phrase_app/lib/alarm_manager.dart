import 'package:flutter/material.dart';
import 'package:android_alarm_manager_plus/android_alarm_manager_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AlarmManager {
  static const String alarmsKey = "alarms";

  // Schedule an alarm
  static Future<void> scheduleAlarm({
    required int id,
    required DateTime time,
    required String userId,
    required String action,
  }) async {
    // Save alarm details in SharedPreferences
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    List<String> alarms = prefs.getStringList(alarmsKey) ?? [];
    alarms.add("$id,${time.toIso8601String()},$action,$userId");
    await prefs.setStringList(alarmsKey, alarms);

    // Schedule the alarm
    await AndroidAlarmManager.oneShotAt(
      time,
      id, // Unique ID for the alarm
      _alarmCallback,
      exact: true,
      wakeup: true,
    );
  }

  // Callback function when an alarm triggers
  static Future<void> _alarmCallback() async {
    // Retrieve the stored alarm data
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    List<String> alarms = prefs.getStringList(alarmsKey) ?? [];

    if (alarms.isNotEmpty) {
      // Trigger navigation to AlarmTriggerScreen
      // Alarm navigation logic will be handled in main.dart using a background isolate
    }
  }

  // Cancel an alarm
  static Future<void> cancelAlarm(int id) async {
    await AndroidAlarmManager.cancel(id);

    // Remove the alarm from SharedPreferences
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    List<String> alarms = prefs.getStringList(alarmsKey) ?? [];
    alarms.removeWhere((alarm) => alarm.startsWith("$id,"));
    await prefs.setStringList(alarmsKey, alarms);
  }

  // Reschedule for snooze
  static Future<void> snoozeAlarm(int id, int minutes) async {
    DateTime snoozeTime = DateTime.now().add(Duration(minutes: minutes));
    await scheduleAlarm(
      id: id,
      time: snoozeTime,
      userId: "N/A", // Placeholder if userId is not required
      action: "snooze",
    );
  }
}
