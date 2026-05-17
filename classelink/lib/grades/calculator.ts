import type { Appreciation, DropoutRiskLevel } from '@/types'

interface GradeEntry {
  value: number
  maxValue: number
  coefficient: number
}

interface SubjectAverage {
  subjectId: string
  subjectName: string
  average: number
  coefficient: number
}

interface StudentStats {
  absenceRate: number      // 0 à 1
  generalAverage: number   // 0 à 20
  averageTrend: number     // différence par rapport au trimestre précédent
}

export function normalizeGrade(value: number, maxValue: number): number {
  return (value / maxValue) * 20
}

export function calculateSubjectAverage(grades: GradeEntry[]): number {
  if (grades.length === 0) return 0
  const totalWeight = grades.reduce((sum, g) => sum + g.coefficient, 0)
  if (totalWeight === 0) return 0
  const totalWeighted = grades.reduce(
    (sum, g) => sum + normalizeGrade(g.value, g.maxValue) * g.coefficient,
    0
  )
  return parseFloat((totalWeighted / totalWeight).toFixed(2))
}

export function calculateGeneralAverage(subjectAverages: SubjectAverage[]): number {
  if (subjectAverages.length === 0) return 0
  const totalCoeff = subjectAverages.reduce((sum, s) => sum + s.coefficient, 0)
  if (totalCoeff === 0) return 0
  const totalWeighted = subjectAverages.reduce((sum, s) => sum + s.average * s.coefficient, 0)
  return parseFloat((totalWeighted / totalCoeff).toFixed(2))
}

export function getAppreciation(average: number): Appreciation {
  if (average >= 16) return 'Très Bien'
  if (average >= 14) return 'Bien'
  if (average >= 12) return 'Assez Bien'
  if (average >= 10) return 'Passable'
  if (average >= 7) return 'Insuffisant'
  return 'Très Insuffisant'
}

export function getMention(average: number): string {
  if (average >= 18) return 'Félicitations du Conseil'
  if (average >= 16) return 'Compliments du Conseil'
  if (average >= 14) return 'Encouragements du Conseil'
  return ''
}

export function getRank(averages: number[], studentAverage: number): number {
  const sorted = [...averages].sort((a, b) => b - a)
  return sorted.indexOf(studentAverage) + 1
}

export function getClassStats(averages: number[]) {
  if (averages.length === 0) return null
  const sorted = [...averages].sort((a, b) => b - a)
  const sum = averages.reduce((a, b) => a + b, 0)
  return {
    classAverage: parseFloat((sum / averages.length).toFixed(2)),
    highest: sorted[0],
    lowest: sorted[sorted.length - 1],
    passing: averages.filter(a => a >= 10).length,
    total: averages.length,
    passingRate: parseFloat(((averages.filter(a => a >= 10).length / averages.length) * 100).toFixed(1)),
  }
}

export function calculateDropoutRisk(stats: StudentStats): {
  level: DropoutRiskLevel
  score: number
  factors: string[]
} {
  let score = 0
  const factors: string[] = []

  if (stats.absenceRate > 0.2) {
    score += 40
    factors.push(`Taux d'absence élevé (${Math.round(stats.absenceRate * 100)}%)`)
  } else if (stats.absenceRate > 0.1) {
    score += 20
    factors.push(`Taux d'absence modéré (${Math.round(stats.absenceRate * 100)}%)`)
  }

  if (stats.generalAverage < 7) {
    score += 40
    factors.push(`Moyenne générale très faible (${stats.generalAverage}/20)`)
  } else if (stats.generalAverage < 10) {
    score += 20
    factors.push(`Moyenne générale insuffisante (${stats.generalAverage}/20)`)
  }

  if (stats.averageTrend < -2) {
    score += 20
    factors.push(`Baisse significative de la moyenne (${stats.averageTrend.toFixed(1)} pts)`)
  }

  const level: DropoutRiskLevel = score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW'

  return { level, score, factors }
}
