import {
  Document, Page, View, Text, StyleSheet,
} from '@react-pdf/renderer'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const PALETTE = [
  { bg: '#efeeff', border: '#c6bfff', text: '#0f006b' },
  { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  { bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8' },
  { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412' },
  { bg: '#fdf2f8', border: '#f5d0fe', text: '#86198f' },
  { bg: '#f0fdfa', border: '#99f6e4', text: '#115e59' },
  { bg: '#fefce8', border: '#fef08a', text: '#854d0e' },
  { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
]

interface Slot {
  id:           string
  day_of_week:  number
  start_time:   string
  end_time:     string
  room?:        string | null
  subject_name: string
  teacher_first?: string
  teacher_last?:  string
}

interface Props {
  schoolName: string
  className:  string
  slots:      Slot[]
}

const TIME_COL = 58

const s = StyleSheet.create({
  page: {
    fontFamily:      'Helvetica',
    fontSize:        9,
    color:           '#1f2937',
    paddingHorizontal: 28,
    paddingVertical:   24,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection:       'row',
    justifyContent:      'space-between',
    alignItems:          'flex-end',
    borderBottomWidth:   2,
    borderBottomColor:   '#13008a',
    paddingBottom:       8,
    marginBottom:        14,
  },
  schoolName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#13008a' },
  headerSub:  { fontSize: 8,  color: '#6b7280', marginTop: 3 },
  docTitle:   { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#111827', textAlign: 'right' },
  docSub:     { fontSize: 8,  color: '#6b7280', textAlign: 'right', marginTop: 2 },

  table:    { flexDirection: 'column' },
  row:      { flexDirection: 'row' },

  thTime: {
    width: TIME_COL,
    paddingVertical: 6,
    backgroundColor: '#13008a',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#1800ad',
  },
  thDay: {
    paddingVertical: 6,
    backgroundColor: '#13008a',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#1800ad',
  },
  thText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ffffff', textAlign: 'center' },

  tdTime: {
    width: TIME_COL,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tdTimeText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6b7280', textAlign: 'center' },

  tdDay: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    minHeight: 52,
    justifyContent: 'flex-start',
  },

  slotBox: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  slotSubject: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  slotTeacher: { fontSize: 7, color: '#6b7280' },
  slotRoom:    { fontSize: 7, color: '#9ca3af', marginTop: 1 },

  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: '#9ca3af' },
})

export function SchedulePdf({ schoolName, className, slots }: Props) {
  // Palette par matière
  const colorMap: Record<string, number> = {}
  let ci = 0
  for (const slot of slots) {
    if (!(slot.subject_name in colorMap)) colorMap[slot.subject_name] = ci++ % PALETTE.length
  }

  // Créneaux horaires uniques triés
  const timePairs = Array.from(
    new Set(slots.map(s => `${s.start_time}|${s.end_time}`))
  ).sort().map(pair => {
    const [start, end] = pair.split('|')
    return { start, end }
  })

  const usedDays = Array.from(new Set(slots.map(s => s.day_of_week))).sort()

  // Largeur A4 paysage = 841.89pt - marges 56pt = 785pt
  const availWidth = 785
  const dayColWidth = (availWidth - TIME_COL) / usedDays.length

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* En-tête */}
        <View style={s.header}>
          <View>
            <Text style={s.schoolName}>{schoolName}</Text>
            <Text style={s.headerSub}>Classe : {className}</Text>
          </View>
          <View>
            <Text style={s.docTitle}>EMPLOI DU TEMPS</Text>
            <Text style={s.docSub}>{className}</Text>
            <Text style={s.docSub}>Généré le {today}</Text>
          </View>
        </View>

        {/* Tableau */}
        <View style={s.table}>

          {/* En-tête */}
          <View style={s.row}>
            <View style={s.thTime}>
              <Text style={s.thText}>Horaire</Text>
            </View>
            {usedDays.map(d => (
              <View key={d} style={[s.thDay, { width: dayColWidth }]}>
                <Text style={s.thText}>{DAYS[d - 1]}</Text>
              </View>
            ))}
          </View>

          {/* Lignes */}
          {timePairs.map(({ start, end }, rowIdx) => (
            <View key={`${start}-${end}`} style={[s.row, { backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#fafafa' }]}>
              {/* Horaire */}
              <View style={s.tdTime}>
                <Text style={s.tdTimeText}>{start.slice(0, 5)}</Text>
                <Text style={[s.tdTimeText, { marginTop: 1 }]}>—</Text>
                <Text style={s.tdTimeText}>{end.slice(0, 5)}</Text>
              </View>

              {/* Jours */}
              {usedDays.map(day => {
                const slot = slots.find(
                  sl => sl.day_of_week === day && sl.start_time === start && sl.end_time === end
                )
                const pal = slot ? PALETTE[colorMap[slot.subject_name] ?? 0] : null
                return (
                  <View key={day} style={[s.tdDay, { width: dayColWidth }]}>
                    {slot && pal ? (
                      <View style={[s.slotBox, { backgroundColor: pal.bg, borderColor: pal.border }]}>
                        <Text style={[s.slotSubject, { color: pal.text }]}>{slot.subject_name}</Text>
                        {slot.teacher_first ? (
                          <Text style={s.slotTeacher}>{slot.teacher_first} {slot.teacher_last}</Text>
                        ) : null}
                        {slot.room ? (
                          <Text style={s.slotRoom}>Salle {slot.room}</Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                )
              })}
            </View>
          ))}
        </View>

        {/* Pied de page */}
        <View style={s.footer}>
          <Text style={s.footerText}>MyClassLink — Gestion Scolaire Numérique</Text>
          <Text style={s.footerText}>{schoolName} · {className}</Text>
        </View>
      </Page>
    </Document>
  )
}
