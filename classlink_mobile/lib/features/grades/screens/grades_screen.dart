import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/grades_provider.dart';
import '../../../core/theme/app_theme.dart';

class GradesScreen extends ConsumerWidget {
  const GradesScreen({super.key});

  Color _avgColor(double? avg) {
    if (avg == null) return AppTheme.textSub;
    if (avg >= 14) return AppTheme.success;
    if (avg >= 10) return AppTheme.primary;
    return AppTheme.danger;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(gradesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mes notes')),
      body: state.isLoading
        ? const Center(child: CircularProgressIndicator())
        : state.error != null
          ? Center(child: Text(state.error!, style: const TextStyle(color: AppTheme.danger)))
          : state.subjects.isEmpty
            ? const Center(child: Text('Aucune note disponible.'))
            : RefreshIndicator(
                onRefresh: () => ref.read(gradesProvider.notifier).load(),
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: state.subjects.length,
                  itemBuilder: (ctx, i) {
                    final sub = state.subjects[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ExpansionTile(
                        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        title: Row(
                          children: [
                            Expanded(
                              child: Text(sub.name,
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: _avgColor(sub.average).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                sub.average != null ? sub.average!.toStringAsFixed(2) : '—',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700, fontSize: 14,
                                  color: _avgColor(sub.average),
                                ),
                              ),
                            ),
                          ],
                        ),
                        subtitle: Text('${sub.grades.length} note${sub.grades.length > 1 ? 's' : ''}',
                          style: TextStyle(fontSize: 12, color: AppTheme.textSub)),
                        children: sub.grades.map((g) => Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          child: Row(
                            children: [
                              Text('${g.value.toStringAsFixed(1)}/20',
                                style: TextStyle(fontWeight: FontWeight.w700, color: _avgColor(g.value), fontSize: 14)),
                              const SizedBox(width: 8),
                              Text('(coef. ${g.coefficient.toStringAsFixed(0)})',
                                style: TextStyle(fontSize: 12, color: AppTheme.textSub)),
                              const Spacer(),
                              if (g.comment != null)
                                Flexible(child: Text(g.comment!, style: TextStyle(fontSize: 11, color: AppTheme.textSub), overflow: TextOverflow.ellipsis)),
                            ],
                          ),
                        )).toList(),
                      ),
                    );
                  },
                ),
              ),
    );
  }
}
