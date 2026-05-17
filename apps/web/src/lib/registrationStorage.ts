export type DemoRegistration = {
  id: string
  rm: string
  patient: string
  nik: string
  service: string
  type: string
  queue: string
  status: 'Menunggu' | 'Terverifikasi' | 'Dilayani'
  phone?: string
  email?: string
  guarantor?: string
  guarantorNumber?: string
  birthPlace?: string
  birthDate?: string
  gender?: string
  address?: string
  district?: string
  city?: string
  visitType?: string
  initialComplaint?: string
  createdAt: string
}

const STORAGE_KEY = 'simrs-demo-registrations'

export const defaultRegistrations: DemoRegistration[] = [
  {
    id: 'demo-001',
    rm: 'RM-000241',
    patient: 'Siti Rahmawati',
    nik: '3205**********18',
    service: 'Poli Penyakit Dalam',
    type: 'Pasien Lama',
    queue: 'A-014',
    status: 'Menunggu',
    phone: '0812xxxxxx18',
    guarantor: 'BPJS Kesehatan',
    gender: 'Perempuan',
    visitType: 'Kontrol Ulang',
    initialComplaint: 'Kontrol lanjutan sesuai jadwal poli.',
    createdAt: '2026-05-17T08:12:00.000Z',
  },
  {
    id: 'demo-002',
    rm: 'RM-000978',
    patient: 'Ahmad Fauzan',
    nik: '3205**********42',
    service: 'Poli Anak',
    type: 'Pasien Baru',
    queue: 'B-006',
    status: 'Terverifikasi',
    phone: '0813xxxxxx42',
    guarantor: 'Umum',
    gender: 'Laki-laki',
    visitType: 'Datang Langsung',
    initialComplaint: 'Pemeriksaan awal anak.',
    createdAt: '2026-05-17T08:25:00.000Z',
  },
  {
    id: 'demo-003',
    rm: 'RM-001102',
    patient: 'Dewi Kartika',
    nik: '3205**********73',
    service: 'IGD',
    type: 'Pasien Baru',
    queue: 'IGD-011',
    status: 'Dilayani',
    phone: '0817xxxxxx73',
    guarantor: 'BPJS Kesehatan',
    gender: 'Perempuan',
    visitType: 'IGD',
    initialComplaint: 'Keluhan kegawatdaruratan awal.',
    createdAt: '2026-05-17T08:41:00.000Z',
  },
  {
    id: 'demo-004',
    rm: 'RM-000421',
    patient: 'Rudi Hartono',
    nik: '3205**********55',
    service: 'Poli Bedah',
    type: 'Pasien Lama',
    queue: 'C-009',
    status: 'Menunggu',
    phone: '0819xxxxxx55',
    guarantor: 'Asuransi Swasta',
    gender: 'Laki-laki',
    visitType: 'Kontrol Ulang',
    initialComplaint: 'Evaluasi pasca tindakan.',
    createdAt: '2026-05-17T09:03:00.000Z',
  },
]

export function getRegistrations(): DemoRegistration[] {
  if (typeof window === 'undefined') {
    return defaultRegistrations
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return defaultRegistrations
  }

  try {
    const parsed = JSON.parse(raw) as DemoRegistration[]
    return Array.isArray(parsed) ? parsed : defaultRegistrations
  } catch {
    return defaultRegistrations
  }
}

export function getRegistrationById(id: string): DemoRegistration | undefined {
  return getRegistrations().find((item) => item.id === id)
}

export function saveRegistration(registration: DemoRegistration) {
  const current = getRegistrations()
  const updated = [registration, ...current]

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function clearStoredRegistrations() {
  window.localStorage.removeItem(STORAGE_KEY)
}

export function updateRegistrationStatus(
  id: string,
  status: DemoRegistration['status'],
): DemoRegistration | undefined {
  const current = getRegistrations()

  let updatedRegistration: DemoRegistration | undefined

  const updated = current.map((item) => {
    if (item.id !== id) {
      return item
    }

    updatedRegistration = {
      ...item,
      status,
    }

    return updatedRegistration
  })

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

  return updatedRegistration
}
