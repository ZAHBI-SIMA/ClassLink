import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/theme/app_theme.dart';
import 'children_screen.dart';

/// Carte d'élève numérique : QR code d'identification généré localement à
/// partir du numéro d'élève (aucun appel réseau nécessaire — les données du
/// QR sont déjà disponibles côté client via `childrenProvider`).
class IdCardScreen extends ConsumerWidget {
  final String studentId;
  const IdCardScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(childrenProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Carte d\'élève')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error:   (e, _) => Center(child: Text('Erreur : $e', style: const TextStyle(color: AppTheme.danger))),
        data: (children) {
          final child = children.cast<Map<String, dynamic>>().firstWhere(
            (c) => c['studentId'] == studentId,
            orElse: () => <String, dynamic>{},
          );
          if (child.isEmpty) {
            return const Center(child: Text('Élève introuvable.', style: TextStyle(color: AppTheme.textSub)));
          }

          final name = '${child['firstName']} ${child['lastName']}';
          final studentNumber = child['studentNumber'] as String? ?? studentId;

          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('MyClassLink', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                      const SizedBox(height: 20),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppTheme.border),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: QrImageView(
                          data: studentNumber,
                          version: QrVersions.auto,
                          size: 200,
                          eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: AppTheme.primary),
                          dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: AppTheme.primary),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.textMain)),
                      const SizedBox(height: 4),
                      if (child['className'] != null)
                        Text(child['className'], style: const TextStyle(fontSize: 13, color: AppTheme.textSub)),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(color: AppTheme.surface, borderRadius: BorderRadius.circular(8)),
                        child: Text(studentNumber, style: const TextStyle(fontSize: 12, fontFamily: 'monospace', color: AppTheme.textSub)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
