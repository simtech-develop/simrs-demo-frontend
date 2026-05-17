export type PrescriptionItem = {
  id: string
  medicineName: string
  dosage: string
  frequency: string
  quantity: string
  instruction: string
}

export type OutpatientExam = {
  registrationId: string
  chiefComplaint: string
  currentHistory: string
  bloodPressure: string
  pulse: string
  temperature: string
  weight: string
  workingDiagnosis: string
  carePlan: string
  doctorNote: string
  prescriptions: PrescriptionItem[]
  status: 'Draft' | 'Pemeriksaan Selesai'
  updatedAt: string
}

const STORAGE_KEY = 'simrs-demo-outpatient-exams'

export function getOutpatientExams(): OutpatientExam[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as OutpatientExam[]

    return Array.isArray(parsed)
      ? parsed.map((item) => ({
          ...item,
          prescriptions: item.prescriptions ?? [],
        }))
      : []
  } catch {
    return []
  }
}

export function getOutpatientExamByRegistrationId(
  registrationId: string,
): OutpatientExam | undefined {
  return getOutpatientExams().find(
    (item) => item.registrationId === registrationId,
  )
}

export function saveOutpatientExam(exam: OutpatientExam) {
  const current = getOutpatientExams()
  const exists = current.some(
    (item) => item.registrationId === exam.registrationId,
  )

  const updated = exists
    ? current.map((item) =>
        item.registrationId === exam.registrationId ? exam : item,
      )
    : [exam, ...current]

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}
