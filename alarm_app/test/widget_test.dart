import 'package:flutter_test/flutter_test.dart';
import 'package:alarm_app/main.dart'; // Keep the necessary import

void main() {
  testWidgets('Verify widget tree', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const WakePhraseApp());

    // Verify that the initial screen shows the app's title.
    expect(find.text('WakePhrase'), findsOneWidget);
  });
}
