import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_constants.dart';

class GradeEntry {
  final String  id;
  final double  value;
  final double  coefficient;
  final String? comment;
  final String  gradedAt;
  const GradeEntry({required this.id, required this.value, required this.coefficient, this.comment, required this.gradedAt});

  factory GradeEntry.fromJson(Map<String, dynamic> j) => GradeEntry(
    id: j['id'], value: (j['value'] as num).toDouble(),
    coefficient: (j['coefficient'] as num).toDouble(),
    comment: j['comment'], gradedAt: j['gradedAt'],
  );
}

class SubjectGrades {
  final String        name;
  final String?       color;
  final List<GradeEntry> grades;
  final double?       average;
  const SubjectGrades({required this.name, this.color, required this.grades, this.average});

  factory SubjectGrades.fromJson(Map<String, dynamic> j) => SubjectGrades(
    name:    j['name'],
    color:   j['color'],
    average: j['average'] != null ? (j['average'] as num).toDouble() : null,
    grades:  (j['grades'] as List).map((g) => GradeEntry.fromJson(g)).toList(),
  );
}

class GradesState {
  final List<SubjectGrades> subjects;
  final List<dynamic>       terms;
  final bool                isLoading;
  final String?             error;
  const GradesState({this.subjects = const [], this.terms = const [], this.isLoading = false, this.error});
}

class GradesNotifier extends StateNotifier<GradesState> {
  GradesNotifier() : super(const GradesState()) { load(); }

  Future<void> load({String? termId}) async {
    state = GradesState(isLoading: true, terms: state.terms, subjects: state.subjects);
    try {
      final resp = await ApiClient().get(ApiConstants.grades, params: termId != null ? {'termId': termId} : null);
      final data = resp.data as Map<String, dynamic>;
      state = GradesState(
        subjects: (data['subjects'] as List).map((s) => SubjectGrades.fromJson(s)).toList(),
        terms:    data['terms'] as List,
      );
    } catch (e) {
      state = GradesState(error: 'Impossible de charger les notes.', subjects: state.subjects, terms: state.terms);
    }
  }
}

final gradesProvider = StateNotifierProvider<GradesNotifier, GradesState>(
  (ref) => GradesNotifier(),
);
