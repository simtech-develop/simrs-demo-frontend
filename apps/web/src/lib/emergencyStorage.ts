export type EmergencyTriageLevel = 'Merah' | 'Kuning' | 'Hijau'

export type EmergencyAssessmentStatus =
  | 'Menunggu Triage'
  | 'Dalam Asesmen'
  | 'Triage Selesai'

export type EmergencyAssessment = {
  registrationId: string
  triageLevel: EmergencyTriageLevel
  chiefComplaint: string
  consciousness: string
  bloodPressure: string
  pulse: string
  respiratoryRate: string
  oxygenSaturation: string
  emergencyNote: string
  status: EmergencyAssessmentStatus
  updatedAt: string
}

const STORAGE_KEY = 'simrs-demo-emergency-assessments'

export function getEmergencyAssessments(): EmergencyAssessment[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as EmergencyAssessment[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getEmergencyAssessmentByRegistrationId(
  registrationId: string,
): EmergencyAssessment | undefined {
  return getEmergencyAssessments().find(
    (item) => item.registrationId === registrationId,
  )
}

export function ensureEmergencyAssessment(
  registrationId: string,
): EmergencyAssessment {
  const existing = getEmergencyAssessmentByRegistrationId(registrationId)

  if (existing) {
    return existing
  }

  const created: EmergencyAssessment = {
    registrationId,
    triageLevel: 'Hijau',
    chiefComplaint: '',
    consciousness: '',
    bloodPressure: '',
    pulse: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    emergencyNote: '',
    status: 'Menunggu Triage',
    updatedAt: new Date().toISOString(),
  }

  const updated = [created, ...getEmergencyAssessments()]
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

  return created
}

export function saveEmergencyAssessment(
  assessment: EmergencyAssessment,
): EmergencyAssessment {
  const current = getEmergencyAssessments()
  const exists = current.some(
    (item) => item.registrationId === assessment.registrationId,
  )

  const updated = exists
    ? current.map((item) =>
        item.registrationId === assessment.registrationId ? assessment : item,
      )
    : [assessment, ...current]

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

  return assessment
}
