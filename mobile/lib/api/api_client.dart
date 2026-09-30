import 'dart:async';
import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../config.dart';

/// An error worth showing to the user as-is.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

/// Talks to the Django REST API.
///
/// Every successful non-list response is wrapped as `{success, message, data}`;
/// list endpoints are paginated as `{count, next, results}`. Errors arrive as
/// `{success: false, error: {message, details}}`. This class hides all of that:
/// callers get the unwrapped payload or an [ApiException] with a readable message.
class ApiClient {
  ApiClient({http.Client? client, FlutterSecureStorage? storage})
    : _http = client ?? http.Client(),
      _storage = storage ?? const FlutterSecureStorage();

  static const _accessKey = 'cybershield.access';
  static const _refreshKey = 'cybershield.refresh';
  static const _timeout = Duration(seconds: 20);

  final http.Client _http;
  final FlutterSecureStorage _storage;

  String? _access;
  String? _refresh;
  Future<bool>? _refreshInFlight;

  /// Called when the session can no longer be renewed (refresh token rejected).
  void Function()? onSessionExpired;

  bool get hasSession => _refresh != null;
  String? get refreshToken => _refresh;

  Future<void> loadTokens() async {
    _access = await _storage.read(key: _accessKey);
    _refresh = await _storage.read(key: _refreshKey);
  }

  Future<void> saveTokens({required String access, String? refresh}) async {
    _access = access;
    await _storage.write(key: _accessKey, value: access);
    if (refresh != null) {
      _refresh = refresh;
      await _storage.write(key: _refreshKey, value: refresh);
    }
  }

  Future<void> clearTokens() async {
    _access = null;
    _refresh = null;
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }

  // -- verbs -----------------------------------------------------------------

  /// GET that returns the unwrapped `data` of a single-object response.
  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    return _unwrap(await _send('GET', path, query: query));
  }

  /// GET a collection, following pagination up to [maxPages] pages.
  Future<List<Map<String, dynamic>>> getList(
    String path, {
    Map<String, dynamic>? query,
    int maxPages = 5,
  }) async {
    final items = <Map<String, dynamic>>[];
    for (var page = 1; page <= maxPages; page++) {
      final body = await _send(
        'GET',
        path,
        query: {'page_size': 100, 'page': page, ...?query},
      );
      final payload = body is Map && body.containsKey('results')
          ? body['results']
          : _unwrap(body);
      if (payload is List) {
        items.addAll(payload.whereType<Map<String, dynamic>>());
      }
      if (body is! Map || body['next'] == null) break;
    }
    return items;
  }

  Future<dynamic> post(String path, {Object? body, bool auth = true}) async {
    return _unwrap(await _send('POST', path, body: body, auth: auth));
  }

  Future<dynamic> patch(String path, {Object? body}) async {
    return _unwrap(await _send('PATCH', path, body: body));
  }

  Future<dynamic> delete(String path) async {
    return _unwrap(await _send('DELETE', path));
  }

  // -- internals -------------------------------------------------------------

  dynamic _unwrap(dynamic body) =>
      body is Map && body.containsKey('data') ? body['data'] : body;

  Uri _uri(String path, Map<String, dynamic>? query) {
    final base = Uri.parse('$apiBaseUrl$path');
    if (query == null || query.isEmpty) return base;
    return base.replace(
      queryParameters: {
        for (final entry in query.entries)
          if (entry.value != null) entry.key: entry.value.toString(),
      },
    );
  }

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, dynamic>? query,
    Object? body,
    bool auth = true,
    bool retried = false,
  }) async {
    final request = http.Request(method, _uri(path, query));
    request.headers['Accept'] = 'application/json';
    if (body != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(body);
    }
    if (auth && _access != null) {
      request.headers['Authorization'] = 'Bearer $_access';
    }

    http.Response response;
    try {
      response = await http.Response.fromStream(
        await _http.send(request).timeout(_timeout),
      );
    } on TimeoutException {
      throw ApiException(
        'The server took too long to respond. Please try again.',
      );
    } catch (_) {
      throw ApiException(
        "Can't reach the server. Check your connection and the API address ($apiBaseUrl).",
      );
    }

    if (response.statusCode == 401 && auth && !retried && _refresh != null) {
      if (await _refreshTokens()) {
        return _send(
          method,
          path,
          query: query,
          body: body,
          auth: auth,
          retried: true,
        );
      }
      onSessionExpired?.call();
      throw ApiException(
        'Your session has expired. Please sign in again.',
        statusCode: 401,
      );
    }

    final decoded = _tryDecode(response.bodyBytes);
    if (response.statusCode >= 200 && response.statusCode < 300) return decoded;
    throw ApiException(
      _errorMessage(decoded, response.statusCode),
      statusCode: response.statusCode,
    );
  }

  dynamic _tryDecode(List<int> bytes) {
    if (bytes.isEmpty) return null;
    try {
      return jsonDecode(utf8.decode(bytes, allowMalformed: true));
    } catch (_) {
      return null;
    }
  }

  /// Concurrent 401s share one refresh so a rotating refresh token is only spent once.
  Future<bool> _refreshTokens() {
    return _refreshInFlight ??= _doRefresh().whenComplete(
      () => _refreshInFlight = null,
    );
  }

  Future<bool> _doRefresh() async {
    final refresh = _refresh;
    if (refresh == null) return false;
    try {
      final response = await _http
          .post(
            Uri.parse('$apiBaseUrl/auth/token/refresh/'),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({'refresh': refresh}),
          )
          .timeout(_timeout);
      if (response.statusCode != 200) return false;
      final data = _unwrap(_tryDecode(response.bodyBytes));
      if (data is! Map || data['access'] == null) return false;
      await saveTokens(
        access: data['access'] as String,
        refresh: data['refresh'] as String?,
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  String _errorMessage(dynamic body, int status) {
    if (status == 429) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (body is Map && body['error'] is Map) {
      final error = body['error'] as Map;
      final fieldMessage = _firstFieldMessage(error['details']);
      if (fieldMessage != null) return fieldMessage;
      final message = error['message'];
      if (message is String && message.isNotEmpty) return message;
    }
    if (body is Map && body['detail'] is String) {
      return body['detail'] as String;
    }
    if (status >= 500) {
      return 'The server ran into a problem. Please try again shortly.';
    }
    if (status == 403) return "You don't have permission to do that.";
    if (status == 404) return 'That item could not be found.';
    return 'Something went wrong (HTTP $status).';
  }

  /// DRF field errors look like `{"email": ["Enter a valid email."]}`; show the text, not the JSON.
  String? _firstFieldMessage(dynamic details) {
    if (details is! Map || details.isEmpty) return null;
    final entry = details.entries.first;
    final value = entry.value;
    final text = value is List && value.isNotEmpty
        ? value.first.toString()
        : value is String
        ? value
        : null;
    if (text == null) return null;
    final key = entry.key.toString();
    if (key == 'detail' || key == 'non_field_errors') return text;
    final label = key.replaceAll('_', ' ');
    return '${label[0].toUpperCase()}${label.substring(1)}: $text';
  }
}
