import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:signature/signature.dart';
import '../../core/theme/app_theme.dart';

/// Capture une signature tactile et la renvoie (via [Navigator.pop]) sous
/// forme de chaîne base64 `data:image/png;base64,...` — même format que la
/// signature capturée côté web (composants/ui/signature-pad.tsx).
class SignatureScreen extends StatefulWidget {
  final String title;
  const SignatureScreen({super.key, required this.title});

  @override
  State<SignatureScreen> createState() => _SignatureScreenState();
}

class _SignatureScreenState extends State<SignatureScreen> {
  final _controller = SignatureController(
    penStrokeWidth: 3,
    penColor: AppTheme.textMain,
    exportBackgroundColor: Colors.white,
  );
  bool _saving = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_controller.isEmpty) return;
    setState(() => _saving = true);
    final bytes = await _controller.toPngBytes();
    if (!mounted) return;
    setState(() => _saving = false);
    if (bytes == null) return;
    final base64Data = 'data:image/png;base64,${base64Encode(bytes)}';
    Navigator.of(context).pop(base64Data);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text(
              'Signez ci-dessous pour confirmer votre autorisation',
              style: TextStyle(fontSize: 13, color: AppTheme.textSub),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: AppTheme.border, width: 2),
                  borderRadius: BorderRadius.circular(16),
                ),
                clipBehavior: Clip.antiAlias,
                child: Signature(controller: _controller, backgroundColor: Colors.white),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _controller.clear(),
                    child: const Text('Effacer'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _save,
                    child: Text(_saving ? 'Enregistrement...' : 'Valider la signature'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
