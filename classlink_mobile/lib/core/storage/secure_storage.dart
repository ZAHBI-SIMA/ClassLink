import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage();

  static const _accessTokenKey  = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _schoolSlugKey   = 'school_slug';
  static const _userKey         = 'user_data';

  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _accessTokenKey,  value: accessToken),
      _storage.write(key: _refreshTokenKey, value: refreshToken),
    ]);
  }

  static Future<String?> getAccessToken()  => _storage.read(key: _accessTokenKey);
  static Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);

  static Future<void> saveSchoolSlug(String slug) =>
      _storage.write(key: _schoolSlugKey, value: slug);
  static Future<String?> getSchoolSlug() => _storage.read(key: _schoolSlugKey);

  static Future<void> saveUser(String json) =>
      _storage.write(key: _userKey, value: json);
  static Future<String?> getUser() => _storage.read(key: _userKey);

  static Future<void> clear() => _storage.deleteAll();
}
