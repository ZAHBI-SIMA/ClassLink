import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth/providers/auth_provider.dart';
import '../grades/providers/grades_provider.dart';
import '../../core/theme/app_theme.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth   = ref.watch(authProvider);
    final grades = ref.watch(gradesProvider);
    final user   = auth.user!;

    double? globalAvg;
    if (grades.subjects.isNotEmpty) {
      final withAvg = grades.subjects.where((s) => s.average != null).toList();
      if (withAvg.isNotEmpty) {
        globalAvg = withAvg.fold(0.0, (s, sub) => s + sub.average!) / withAvg.length;
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Bonjour, ${user.firstName} 👋',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            Text(user.schoolName, style: const TextStyle(fontSize: 11, color: AppTheme.textSub)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: () async => ref.read(authProvider.notifier).logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(gradesProvider.notifier).load(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Badge rôle
            Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: user.isParent
                    ? AppTheme.secondary.withValues(alpha: 0.1)
                    : AppTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  user.isParent ? 'Parent' : 'Élève',
                  style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w600,
                    color: user.isParent ? AppTheme.secondary : AppTheme.primary,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Carte moyenne générale (élève uniquement)
            if (!user.isParent) ...[
              _StatCard(
                label: 'Moyenne générale',
                value: globalAvg != null ? '${globalAvg.toStringAsFixed(2)}/20' : '—',
                icon:  Icons.bar_chart_rounded,
                color: globalAvg != null
                  ? (globalAvg >= 14 ? AppTheme.success : globalAvg >= 10 ? AppTheme.primary : AppTheme.danger)
                  : AppTheme.textSub,
                onTap: () => context.push('/grades'),
              ),
              const SizedBox(height: 12),
            ],

            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: Text('Accès rapide',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textMain)),
            ),

            GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.3,
              children: [
                if (!user.isParent) ...[
                  _QuickAction(icon: Icons.grade_rounded,          label: 'Notes',          color: AppTheme.primary,              onTap: () => context.push('/grades')),
                  _QuickAction(icon: Icons.description_rounded,    label: 'Bulletins',      color: const Color(0xFF7C3AED),       onTap: () => context.push('/bulletins')),
                ],
                _QuickAction(icon: Icons.calendar_today_rounded,   label: 'Emploi du temps',color: AppTheme.secondary,            onTap: () => context.push('/schedule')),
                _QuickAction(icon: Icons.check_circle_outline,     label: 'Absences',       color: AppTheme.warning,              onTap: () => context.push('/attendance')),
                _QuickAction(icon: Icons.campaign_rounded,         label: 'Annonces',       color: AppTheme.success,              onTap: () => context.push('/announcements')),
                _QuickAction(icon: Icons.restaurant_rounded,       label: 'Cantine',        color: const Color(0xFFEA580C),       onTap: () => context.push('/cafeteria')),
                _QuickAction(icon: Icons.receipt_long_rounded,     label: 'Paiements',      color: const Color(0xFF0891B2),       onTap: () => context.push('/payments')),
                if (user.isParent)
                  _QuickAction(icon: Icons.people_rounded,         label: 'Mes enfants',    color: AppTheme.secondary,            onTap: () => context.push('/parent/children')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _StatCard({required this.label, required this.value, required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 14),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSub)),
                Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
              ],
            ),
          ],
        ),
      ),
    ),
  );
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _QuickAction({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 8),
            Text(label,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
              maxLines: 2,
            ),
          ],
        ),
      ),
    ),
  );
}
