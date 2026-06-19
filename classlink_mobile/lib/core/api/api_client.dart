import 'package:dio/dio.dart';
import '../storage/secure_storage.dart';
import 'api_constants.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio _dio;

  ApiClient._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await SecureStorage.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        // 401 → essayer de rafraîchir le token
        if (error.response?.statusCode == 401) {
          final refreshToken = await SecureStorage.getRefreshToken();
          if (refreshToken != null) {
            try {
              final resp = await Dio().post(
                '${ApiConstants.baseUrl}${ApiConstants.refresh}',
                options: Options(headers: {
                  'Authorization': 'Bearer $refreshToken',
                  'Content-Type': 'application/json',
                }),
              );
              final newToken = resp.data['accessToken'] as String;
              await SecureStorage.saveTokens(
                accessToken: newToken,
                refreshToken: refreshToken,
              );
              // Rejouer la requête originale
              error.requestOptions.headers['Authorization'] = 'Bearer $newToken';
              final retry = await _dio.fetch(error.requestOptions);
              return handler.resolve(retry);
            } catch (_) {
              await SecureStorage.clear();
            }
          }
        }
        return handler.next(error);
      },
    ));
  }

  Dio get dio => _dio;

  Future<Response> get(String path, {Map<String, dynamic>? params}) =>
      _dio.get(path, queryParameters: params);

  Future<Response> post(String path, {dynamic data}) =>
      _dio.post(path, data: data);
}
