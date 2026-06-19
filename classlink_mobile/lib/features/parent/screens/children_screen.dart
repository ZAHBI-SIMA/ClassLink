import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/theme/app_theme.dart';

// ─── Provider ────────────────────────────────────────────────────────────────

final childrenProvider = FutureProvider<List<dynamic>>((ref) async {
  final resp = await ApiClient().get(ApiConstants.children);
  return resp.data['children'] as List<dynamic>;
});

// ─── Screen ──────────────────────────────────────────────────────────────────

class ChildrenScreen extends ConsumerWidget {
  const ChildrenScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(childrenProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mes enfants')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error:   (e, _) => Center(child: Text('Erreur : $e', style: const TextStyle(color: AppTheme.danger))),
        data: (children) {
          if (children.isEmpty) {
            return const Center(child: Text('Aucun enfant lié à votre compte.', style: TextStyle(color: AppTheme.textSub)));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: children.length,
            itemBuilder: (ctx, i) {
              final c = children[i] as Map<String, dynamic>;
              final name = '${c['firstName']} ${c['lastName']}';
              final studentId = c['studentId'] as String;

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(14),
                  leading: CircleAvatar(
                    radius: 24,
                    backgroundColor: AppTheme.secondary.withValues(alpha: 0.15),
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : '?',
                      style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.secondary),
                    ),
                  ),
                  title: Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (c['className'] != null)
                        Text(c['className'], style: TextStyle(fontSize: 12, color: AppTheme.textSub)),
                      if (c['academicYear'] != null)
                        Text(c['academicYear'], style: TextStyle(fontSize: 11, color: AppTheme.textSub)),
                    ],
                  ),
                  trailing: const Icon(Icons.chevron_right_rounded, color: AppTheme.textSub),
                  onTap: () => context.push('/parent/child/$studentId'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
