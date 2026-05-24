import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

Font.register({
  family: 'Helvetica',
  fonts: [],
})

const colors = {
  dark:    '#1f2937',
  mid:     '#6b7280',
  light:   '#f9fafb',
  border:  '#e5e7eb',
  green:   '#15803d',
  red:     '#b91c1c',
  blue:    '#1d4ed8',
  purple:  '#7c3aed',
  stripe:  '#f3f4f6',
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: colors.dark,
    paddingHorizontal: 32,
    paddingVertical: 28,
    backgroundColor: '#ffffff',
  },

  // ── En-tête ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: colors.dark,
    paddingBottom: 10,
    marginBottom: 12,
  },
  schoolName: { fontSize: 13, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1 },
  schoolSub:  { fontSize: 8, color: colors.mid, marginTop: 2 },
  docTitle:   { fontSize: 15, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'right' },
  docSub:     { fontSize: 9, color: colors.mid, textAlign: 'right', marginTop: 2 },

  // ── Bandeau élève ─────────────────────────────────────────────────────────
  studentBand: {
    flexDirection: 'row',
    backgroundColor: colors.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  studentCol: { flex: 1 },
  labelText:  { color: colors.mid, width: 80, fontSize: 8 },
  valueText:  { fontFamily: 'Helvetica-Bold', flex: 1 },
  row:        { flexDirection: 'row', marginBottom: 4, alignItems: 'center' },

  // ── Résumé (3 cases) ──────────────────────────────────────────────────────
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  summaryBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 7, color: colors.mid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 22, fontFamily: 'Helvetica-Bold' },
  summaryUnit:  { fontSize: 7, color: colors.mid, marginTop: 2 },

  // ── Tableau matières ──────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.dark,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 0,
  },
  thText: { color: '#ffffff', fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableRowAlt: { backgroundColor: colors.stripe },
  tableFooter: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderTopWidth: 2,
    borderTopColor: colors.dark,
    borderRadius: 4,
    marginBottom: 10,
  },
  tdSubject:  { flex: 3 },
  tdCoeff:    { flex: 1, textAlign: 'center' },
  tdAvg:      { flex: 1.5, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  tdAppreciation: { flex: 2.5 },

  // ── Absences ──────────────────────────────────────────────────────────────
  sectionTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: colors.mid, letterSpacing: 0.5, marginBottom: 5 },
  absRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  absBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 8,
  },
  absLabel: { fontSize: 7, color: colors.mid },
  absValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginTop: 2 },

  // ── Conseil de classe ──────────────────────────────────────────────────────
  councilBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  councilHead: { backgroundColor: colors.dark, paddingHorizontal: 10, paddingVertical: 5 },
  councilHeadText: { color: '#ffffff', fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  councilBody: { padding: 10 },
  councilRow:  { flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' },
  councilLabel:{ width: 70, color: colors.mid, fontSize: 8 },
  councilValue:{ flex: 1, fontSize: 8 },

  // ── Signatures ─────────────────────────────────────────────────────────────
  sigRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  sigBox: { flex: 1, borderTopWidth: 2, borderTopColor: colors.border, paddingTop: 5, alignItems: 'center' },
  sigLabel: { fontSize: 7, color: colors.mid, marginTop: 2 },
  sigSub:   { fontSize: 7, color: '#9ca3af' },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  footerText: { fontSize: 7, color: '#9ca3af' },
})

function appreciation(avg: number | null): string {
  if (avg === null) return '—'
  if (avg >= 16) return 'Très Bien'
  if (avg >= 14) return 'Bien'
  if (avg >= 12) return 'Assez Bien'
  if (avg >= 10) return 'Passable'
  if (avg >= 8)  return 'Insuffisant'
  return 'Très Insuffisant'
}

function avgColor(avg: number | null): string {
  if (avg === null) return colors.mid
  return avg >= 10 ? colors.green : colors.red
}

function ordinal(n: number): string {
  return n === 1 ? `${n}er` : `${n}ème`
}

interface BulletinPdfProps {
  student:         any
  term:            any
  school:          any
  subjects:        any[]
  general_average: any
  class_average:   any
  rank:            any
  attendance:      any
  council:         any
}

export function BulletinPdf({
  student, term, school, subjects,
  general_average, class_average, rank,
  attendance, council,
}: BulletinPdfProps) {
  const genAvg  = general_average != null ? parseFloat(String(general_average)) : null
  const clsAvg  = class_average   != null ? parseFloat(String(class_average))   : null
  const rankNum = rank             != null ? parseInt(String(rank), 10)          : null

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <Document
      title={`Bulletin — ${student.last_name} ${student.first_name} — ${term?.name ?? ''}`}
      author={school?.school_name ?? 'ClassLink'}
      creator="ClassLink"
    >
      <Page size="A4" style={s.page}>

        {/* ── En-tête ────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.schoolName}>{school?.school_name ?? 'Établissement'}</Text>
            {school?.address     && <Text style={s.schoolSub}>{school.address}</Text>}
            {school?.phone       && <Text style={s.schoolSub}>Tél : {school.phone}</Text>}
            {school?.email       && <Text style={s.schoolSub}>{school.email}</Text>}
            {school?.motto       && <Text style={{ ...s.schoolSub, fontStyle: 'italic' }}>{school.motto}</Text>}
          </View>
          <View>
            <Text style={s.docTitle}>Bulletin de Notes</Text>
            <Text style={s.docSub}>{term?.name ?? ''}</Text>
            <Text style={s.docSub}>Année scolaire {student.year_name ?? '—'}</Text>
          </View>
        </View>

        {/* ── Infos élève ────────────────────────────────────────────── */}
        <View style={s.studentBand}>
          <View style={s.studentCol}>
            <View style={s.row}>
              <Text style={s.labelText}>Nom &amp; Prénom</Text>
              <Text style={s.valueText}>{student.last_name?.toUpperCase()} {student.first_name}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.labelText}>N° Matricule</Text>
              <Text style={s.valueText}>{student.student_number ?? '—'}</Text>
            </View>
            {student.date_of_birth && (
              <View style={s.row}>
                <Text style={s.labelText}>Né(e) le</Text>
                <Text style={{ flex: 1 }}>{new Date(student.date_of_birth).toLocaleDateString('fr-FR')}</Text>
              </View>
            )}
          </View>
          <View style={s.studentCol}>
            <View style={s.row}>
              <Text style={s.labelText}>Classe</Text>
              <Text style={s.valueText}>{student.class_name ?? '—'}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.labelText}>Niveau</Text>
              <Text style={{ flex: 1 }}>{student.level_name ?? '—'}</Text>
            </View>
          </View>
        </View>

        {/* ── Résumé ─────────────────────────────────────────────────── */}
        <View style={s.summaryRow}>
          <View style={{ ...s.summaryBox, borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}>
            <Text style={s.summaryLabel}>Moyenne générale</Text>
            <Text style={{ ...s.summaryValue, color: avgColor(genAvg) }}>
              {genAvg !== null ? genAvg.toFixed(2) : '—'}
            </Text>
            <Text style={s.summaryUnit}>/20</Text>
          </View>
          <View style={s.summaryBox}>
            <Text style={s.summaryLabel}>Rang de classe</Text>
            <Text style={{ ...s.summaryValue, color: colors.dark }}>
              {rankNum !== null ? ordinal(rankNum) : '—'}
            </Text>
            <Text style={s.summaryUnit}>élève(s)</Text>
          </View>
          <View style={s.summaryBox}>
            <Text style={s.summaryLabel}>Moyenne de classe</Text>
            <Text style={{ ...s.summaryValue, color: avgColor(clsAvg) }}>
              {clsAvg !== null ? clsAvg.toFixed(2) : '—'}
            </Text>
            <Text style={s.summaryUnit}>/20</Text>
          </View>
        </View>

        {/* ── Tableau matières ────────────────────────────────────────── */}
        <View style={s.tableHeader}>
          <Text style={{ ...s.thText, flex: 3 }}>Matière</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'center' }}>Coeff.</Text>
          <Text style={{ ...s.thText, flex: 1.5, textAlign: 'center' }}>Moy. /20</Text>
          <Text style={{ ...s.thText, flex: 2.5 }}>Appréciation</Text>
        </View>

        {subjects.length === 0 ? (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: colors.mid, fontStyle: 'italic' }}>Aucune note enregistrée pour ce trimestre.</Text>
          </View>
        ) : (
          subjects.map((sub: any, i: number) => {
            const avg = sub.subject_avg != null ? parseFloat(String(sub.subject_avg)) : null
            return (
              <View key={sub.subject_id} style={[s.tableRow, i % 2 !== 0 ? s.tableRowAlt : {}]}>
                <Text style={{ ...s.tdSubject, fontFamily: 'Helvetica-Bold' }}>{sub.subject_name}</Text>
                <Text style={{ ...s.tdCoeff,  color: colors.mid }}>{sub.coefficient}</Text>
                <Text style={{ ...s.tdAvg,    color: avgColor(avg) }}>{avg !== null ? avg.toFixed(2) : '—'}</Text>
                <Text style={{ ...s.tdAppreciation, fontStyle: 'italic', color: colors.mid }}>{appreciation(avg)}</Text>
              </View>
            )
          })
        )}

        <View style={s.tableFooter}>
          <Text style={{ flex: 3, fontFamily: 'Helvetica-Bold', textAlign: 'right', paddingRight: 8 }}>Moyenne générale</Text>
          <Text style={{ flex: 1 }}></Text>
          <Text style={{ flex: 1.5, textAlign: 'center', fontFamily: 'Helvetica-Bold', fontSize: 12, color: avgColor(genAvg) }}>
            {genAvg !== null ? genAvg.toFixed(2) : '—'}
          </Text>
          <Text style={{ flex: 2.5, fontStyle: 'italic', fontFamily: 'Helvetica-Bold', color: avgColor(genAvg) }}>
            {appreciation(genAvg)}
          </Text>
        </View>

        {/* ── Absences ────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Absences &amp; Retards — {term?.name ?? ''}</Text>
        <View style={s.absRow}>
          <View style={s.absBox}>
            <Text style={s.absLabel}>Absences totales</Text>
            <Text style={{ ...s.absValue, color: attendance.absent > 0 ? colors.red : colors.green }}>
              {attendance.absent}
            </Text>
            <Text style={s.absLabel}>séance(s)</Text>
          </View>
          <View style={s.absBox}>
            <Text style={s.absLabel}>Retards</Text>
            <Text style={{ ...s.absValue, color: attendance.late > 0 ? '#c2410c' : colors.green }}>
              {attendance.late}
            </Text>
            <Text style={s.absLabel}>retard(s)</Text>
          </View>
          <View style={s.absBox}>
            <Text style={s.absLabel}>Non justifiées</Text>
            <Text style={{ ...s.absValue, color: attendance.unjustified > 0 ? colors.red : colors.green }}>
              {attendance.unjustified}
            </Text>
            <Text style={s.absLabel}>absence(s)</Text>
          </View>
        </View>

        {/* ── Décision du conseil ─────────────────────────────────────── */}
        {council && (
          <View style={s.councilBox}>
            <View style={s.councilHead}>
              <Text style={s.councilHeadText}>Décision du conseil de classe</Text>
            </View>
            <View style={s.councilBody}>
              {council.decision && (
                <View style={s.councilRow}>
                  <Text style={s.councilLabel}>Décision</Text>
                  <Text style={{ ...s.councilValue, fontFamily: 'Helvetica-Bold' }}>{council.decision}</Text>
                </View>
              )}
              {council.appreciation && (
                <View style={s.councilRow}>
                  <Text style={s.councilLabel}>Appréciation</Text>
                  <Text style={{ ...s.councilValue, fontStyle: 'italic' }}>« {council.appreciation} »</Text>
                </View>
              )}
              {council.council_comment && (
                <View style={s.councilRow}>
                  <Text style={s.councilLabel}>Commentaire</Text>
                  <Text style={s.councilValue}>{council.council_comment}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Signatures ─────────────────────────────────────────────── */}
        <View style={s.sigRow}>
          <View style={s.sigBox}>
            <View style={{ height: 40 }} />
            <Text style={s.sigLabel}>Cachet &amp; Signature Direction</Text>
            {school?.principal_name && <Text style={s.sigSub}>{school.principal_name}</Text>}
          </View>
          <View style={s.sigBox}>
            <View style={{ height: 40 }} />
            <Text style={s.sigLabel}>Signature Parent / Tuteur</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={{ ...s.sigSub, marginBottom: 4 }}>{today}</Text>
            <View style={{ height: 36 }} />
            <Text style={s.sigLabel}>Date</Text>
          </View>
        </View>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Bulletin généré par ClassLink · {today}
          </Text>
        </View>

      </Page>
    </Document>
  )
}
