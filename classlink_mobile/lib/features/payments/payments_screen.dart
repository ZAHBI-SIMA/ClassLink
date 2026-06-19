import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_constants.dart';
import '../../core/theme/app_theme.dart';

// ─── Provider ────────────────────────────────────────────────────────────────

final paymentsProvider = FutureProvider.family<List<dynamic>, String?>(
  (ref, studentId) async {
    final params = studentId != null ? {'studentId': studentId} : null;
    final resp = await ApiClient().get(ApiConstants.payments, params: params);
    return resp.data['payments'] as List<dynamic>;
  },
);

// ─── Screen ──────────────────────────────────────────────────────────────────

class PaymentsScreen extends ConsumerWidget {
  final String? studentId;
  const PaymentsScreen({super.key, this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(paymentsProvider(studentId));

    return Scaffold(
      appBar: AppBar(title: const Text('Paiements')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error:   (e, _) => Center(child: Text('Erreur : $e', style: const TextStyle(color: AppTheme.danger))),
        data: (payments) {
          if (payments.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.receipt_long_outlined, size: 48, color: AppTheme.textSub),
                  SizedBox(height: 12),
                  Text('Aucun paiement trouvé.', style: TextStyle(color: AppTheme.textSub)),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(paymentsProvider(studentId).future),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: payments.length,
              itemBuilder: (ctx, i) => _PaymentCard(payment: payments[i] as Map<String, dynamic>),
            ),
          );
        },
      ),
    );
  }
}

// ─── Carte paiement ───────────────────────────────────────────────────────────

class _PaymentCard extends StatelessWidget {
  final Map<String, dynamic> payment;
  const _PaymentCard({required this.payment});

  Color _statusColor(String status) => switch (status) {
    'SUCCESS'  => AppTheme.success,
    'PENDING'  => AppTheme.warning,
    'FAILED'   => AppTheme.danger,
    'REFUNDED' => AppTheme.secondary,
    _          => AppTheme.textSub,
  };

  String _statusLabel(String status) => switch (status) {
    'SUCCESS'  => 'Payé',
    'PENDING'  => 'En attente',
    'FAILED'   => 'Échoué',
    'REFUNDED' => 'Remboursé',
    _          => status,
  };

  IconData _statusIcon(String status) => switch (status) {
    'SUCCESS'  => Icons.check_circle_rounded,
    'PENDING'  => Icons.hourglass_top_rounded,
    'FAILED'   => Icons.cancel_rounded,
    'REFUNDED' => Icons.replay_rounded,
    _          => Icons.help_outline_rounded,
  };

  @override
  Widget build(BuildContext context) {
    final status  = payment['status'] as String? ?? 'PENDING';
    final color   = _statusColor(status);
    final amount  = payment['amount'] as num? ?? 0;
    final dueDate = payment['dueDate'] != null
        ? DateFormat('dd MMM yyyy', 'fr').format(DateTime.tryParse(payment['dueDate'].toString()) ?? DateTime.now())
        : '—';
    final createdAt = payment['createdAt'] != null
        ? DateFormat('dd/MM/yyyy', 'fr').format(DateTime.tryParse(payment['createdAt'].toString()) ?? DateTime.now())
        : '—';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6, offset: const Offset(0, 2))],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 42, height: 42,
              decoration: BoxDecoration(color: color.withValues(alpha: 0.12), shape: BoxShape.circle),
              child: Icon(_statusIcon(status), color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    payment['description'] as String? ?? 'Frais scolaires',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textMain),
                  ),
                  if (payment['studentName'] != null)
                    Text(payment['studentName'] as String,
                      style: TextStyle(fontSize: 11, color: AppTheme.textSub)),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Text('Créé le $createdAt',
                        style: TextStyle(fontSize: 11, color: AppTheme.textSub)),
                      if (dueDate != '—') ...[
                        const Text(' · ', style: TextStyle(fontSize: 11, color: AppTheme.textSub)),
                        Text('Échéance : $dueDate',
                          style: TextStyle(fontSize: 11, color: AppTheme.textSub)),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${NumberFormat('#,###').format(amount)} F',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: color),
                ),
                Container(
                  margin: const EdgeInsets.only(top: 4),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                  child: Text(_statusLabel(status),
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
