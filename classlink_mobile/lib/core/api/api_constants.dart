class ApiConstants {
  static const String baseUrl = 'http://192.168.1.4:3000'; // IP WiFi locale du PC (téléphone sur le même réseau)
  // Émulateur Android → 'http://10.0.2.2:3000'
  // Production déployée → 'https://<domaine>'

  static const String login        = '/api/mobile/auth/login';
  static const String refresh      = '/api/mobile/auth/refresh';
  static const String grades       = '/api/mobile/grades';
  static const String schedule     = '/api/mobile/schedule';
  static const String attendance   = '/api/mobile/attendance';
  static const String announcements= '/api/mobile/announcements';
  static const String cafeteria    = '/api/mobile/cafeteria';
  static const String messages     = '/api/mobile/messages';
  static const String children     = '/api/mobile/parent/children';
  static const String payments     = '/api/mobile/payments';
  static const String bulletins    = '/api/mobile/bulletins';
  static const String fcmRegister  = '/api/mobile/fcm/register';

  static String paymentInitiate(String paymentId) =>
      '/api/mobile/payments/$paymentId/initiate';
}
