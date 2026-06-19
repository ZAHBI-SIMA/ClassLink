import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../api/api_client.dart';
import '../api/api_constants.dart';

@pragma('vm:entry-point')
Future<void> _onBackgroundMessage(RemoteMessage message) async {
  // FCM affiche automatiquement la notification en arrière-plan sur Android
}

class NotificationService {
  static bool _ready = false;

  static Future<void> initialize() async {
    if (_ready) return;
    try {
      await Firebase.initializeApp();
      await FirebaseMessaging.instance.requestPermission(
        alert: true, badge: true, sound: true,
      );
      FirebaseMessaging.onBackgroundMessage(_onBackgroundMessage);
      _ready = true;
    } catch (_) {
      // Firebase non configuré — notifications désactivées silencieusement
    }
  }

  static Future<String?> getToken() async {
    if (!_ready) return null;
    try {
      return await FirebaseMessaging.instance.getToken();
    } catch (_) {
      return null;
    }
  }

  static Future<void> registerDeviceToken() async {
    final token = await getToken();
    if (token == null) return;
    try {
      await ApiClient().post(ApiConstants.fcmRegister, data: {
        'token':    token,
        'platform': 'android',
      });
    } catch (_) {}
  }

  static Stream<RemoteMessage> get onForegroundMessage =>
      FirebaseMessaging.onMessage;
}
