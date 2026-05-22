import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../lib/api'

type ApiRegistration = {
  id: string
  registrationNo: string
  queueNumber: number
  chiefComplaint?: string | null
  patient: {
    id: string
    medicalRecordNo: string
    fullName: string
  }
  clinic: {
    id: string
    code: string
    name: string
  }
}

type EmergencyTriageApi = 'RED' | 'YELLOW' | 'GREEN'

type EmergencyAssessmentStatusApi =
  | 'WAITING_TRIAGE'
  | 'IN_ASSESSMENT'
  | 'TRIAGE_COMPLETED'

type ApiEmergencyAssessment = {
  id: string
  registrationId: string
  triageLevel: EmergencyTriageApi
  chiefComplaint?: string | null
  consciousness?: string | null
  bloodPressure?: string | null
  pulse?: string | null
  respiratoryRate?: string | null
  oxygenSaturation?: string | null
  emergencyNote?: string | null
  status: EmergencyAssessmentStatusApi
  assessedAt?: string | null
}

type EmergencyRow = {
  registrationId: string
  rm: string
  patient: string
  queue: string
  doctor: string
  payerType: 'Umum' | 'BPJS' | 'Asuransi'
  insuranceNo: string
  chiefComplaint: string
  triageLevel: 'Merah' | 'Kuning' | 'Hijau'
  status: 'Menunggu Triage' | 'Dalam Asesmen' | 'Triage Selesai'
}

const REGISTRATION_EDIT_STORAGE_KEY = 'simrs_registration_edit_overrides'

type RegistrationEditOverride = {
  id: string
  rm: string
  patient: string
  nik: string
  service: string
  doctor?: string
  type: string
  payerType?: 'Umum' | 'BPJS' | 'Asuransi'
  insuranceNo?: string
  phone?: string
  address?: string
  gender?: 'Laki-laki' | 'Perempuan' | '-'
  birthDate?: string
  queue: string
  status: 'Menunggu' | 'Terverifikasi' | 'Dilayani' | 'Dibatalkan'
}

const getRegistrationOverride = (
  candidateKeys: Array<string | undefined | null>,
): RegistrationEditOverride | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const currentValue = window.localStorage.getItem(
      REGISTRATION_EDIT_STORAGE_KEY,
    )

    if (!currentValue) {
      return null
    }

    const overrides = JSON.parse(currentValue) as Record<
      string,
      RegistrationEditOverride
    >

    const keys = candidateKeys.filter((key): key is string => Boolean(key))

    for (const key of keys) {
      if (overrides[key]) {
        return overrides[key]
      }
    }

    return null
  } catch (error) {
    console.error('Gagal membaca override pendaftaran untuk IGD:', error)
    return null
  }
}

const normalizeEmergencyPayerType = (
  payerType?: RegistrationEditOverride['payerType'],
): EmergencyRow['payerType'] => {
  if (payerType === 'BPJS') {
    return 'BPJS'
  }

  if (payerType === 'Asuransi') {
    return 'Asuransi'
  }

  return 'Umum'
}

const isCanceledOverride = (override?: RegistrationEditOverride | null) =>
  override?.status === 'Dibatalkan'

function mapTriageLevel(level: EmergencyTriageApi): EmergencyRow['triageLevel'] {
  switch (level) {
    case 'RED':
      return 'Merah'
    case 'YELLOW':
      return 'Kuning'
    case 'GREEN':
      return 'Hijau'
    default:
      return 'Hijau'
  }
}

function mapAssessmentStatus(
  status: EmergencyAssessmentStatusApi,
): EmergencyRow['status'] {
  switch (status) {
    case 'WAITING_TRIAGE':
      return 'Menunggu Triage'
    case 'IN_ASSESSMENT':
      return 'Dalam Asesmen'
    case 'TRIAGE_COMPLETED':
      return 'Triage Selesai'
    default:
      return 'Menunggu Triage'
  }
}

function buildFallbackEmergencyAssessment(
  registration: ApiRegistration,
): ApiEmergencyAssessment {
  return {
    id: `fallback-emergency-assessment-${registration.id}`,
    registrationId: registration.id,
    triageLevel: 'GREEN',
    chiefComplaint: registration.chiefComplaint ?? 'Keluhan belum diisi',
    consciousness: '',
    bloodPressure: '',
    pulse: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    emergencyNote: '',
    status: 'WAITING_TRIAGE',
    assessedAt: null,
  }
}

async function ensureEmergencyAssessment(registration: ApiRegistration) {
  try {
    return await api.get<ApiEmergencyAssessment>(
      `/emergency-assessments/registration/${registration.id}`,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : ''

    if (!message.toLowerCase().includes('not found')) {
      console.warn('Gagal membaca asesmen IGD, gunakan fallback:', message)
      return buildFallbackEmergencyAssessment(registration)
    }
  }

  try {
    return await api.post<
      ApiEmergencyAssessment,
      {
        registrationId: string
        chiefComplaint?: string
      }
    >('/emergency-assessments', {
      registrationId: registration.id,
      chiefComplaint: registration.chiefComplaint ?? undefined,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''

    if (
      message.toLowerCase().includes('sudah dibuat') ||
      message.toLowerCase().includes('already') ||
      message.toLowerCase().includes('exists') ||
      message.toLowerCase().includes('duplicate')
    ) {
      console.warn(
        'Asesmen IGD sudah ada, gunakan fallback agar antrean tetap tampil:',
        message,
      )

      return buildFallbackEmergencyAssessment(registration)
    }

    console.warn('Gagal membuat asesmen IGD, gunakan fallback:', message)
    return buildFallbackEmergencyAssessment(registration)
  }
}

const isEmergencyRegistration = (registration: ApiRegistration) => {
  const baseQueue = `IGD-${String(registration.queueNumber).padStart(3, '0')}`
  const override = getRegistrationOverride([
    registration.id,
    registration.patient.medicalRecordNo,
    registration.patient.fullName,
    baseQueue,
  ])

  const service = override?.service || registration.clinic.name
  const clinicCode = registration.clinic.code

  return (
    clinicCode === 'IGD' ||
    service.toLowerCase().includes('igd')
  )
}

function EmergencyPage() {
  const [emergencyPatients, setEmergencyPatients] = useState<EmergencyRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadEmergencyPatients = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const registrations = await api.get<ApiRegistration[]>('/registrations')

      const igdRegistrations = registrations.filter(isEmergencyRegistration)

      const rows = await Promise.all(
        igdRegistrations.map(async (registration) => {
          try {
            const assessment = await ensureEmergencyAssessment(registration)

            const baseQueue = `IGD-${String(registration.queueNumber).padStart(3, '0')}`
            const override = getRegistrationOverride([
              registration.id,
              registration.patient.medicalRecordNo,
              registration.patient.fullName,
              baseQueue,
            ])

            if (isCanceledOverride(override)) {
              return null
            }

            return {
              registrationId: registration.id,
              rm: override?.rm || registration.patient.medicalRecordNo,
              patient: override?.patient || registration.patient.fullName,
              queue:
                override?.queue && override.queue !== '-'
                  ? override.queue
                  : baseQueue,
              doctor: override?.doctor || 'Dokter IGD Belum Ditentukan',
              payerType: normalizeEmergencyPayerType(override?.payerType),
              insuranceNo: override?.insuranceNo || '-',
              chiefComplaint:
                assessment.chiefComplaint ||
                registration.chiefComplaint ||
                'Keluhan belum diisi',
              triageLevel: mapTriageLevel(assessment.triageLevel),
              status: mapAssessmentStatus(assessment.status),
            }
          } catch (error) {
            console.warn('Pasien IGD gagal diproses, dilewati:', error)
            return null
          }
        }),
      )

      setEmergencyPatients(
        rows.filter((row): row is EmergencyRow => Boolean(row)),
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memuat antrean pasien IGD dari backend.'

      setEmergencyPatients([])
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadEmergencyPatients()
  }, [])

  const totalPatients = emergencyPatients.length

  const redPriority = useMemo(
    () =>
      emergencyPatients.filter((item) => item.triageLevel === 'Merah').length,
    [emergencyPatients],
  )

  const yellowPriority = useMemo(
    () =>
      emergencyPatients.filter((item) => item.triageLevel === 'Kuning').length,
    [emergencyPatients],
  )

  const waitingTriage = useMemo(
    () =>
      emergencyPatients.filter((item) => item.status !== 'Triage Selesai')
        .length,
    [emergencyPatients],
  )

  return (
    <main className="emergency-app">
      <aside className="dashboard-sidebar-pro">
        <div className="sidebar-brand-pro">
          <span>SIMRS</span>
          <strong>SIMTECH</strong>
          <p>Type D / C Demo Platform</p>
        </div>

        <nav className="sidebar-menu-pro">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/pendaftaran">Pendaftaran</Link>
          <Link to="/rawat-jalan">Rawat Jalan</Link>
          <Link className="active" to="/igd">
            IGD
          </Link>

          <Link to="/ruang-tindakan">Ruang Tindakan</Link>

          <Link to="/rawat-inap">Rawat Inap</Link>
          <Link to="/rme">RME</Link>
          <Link to="/farmasi">Farmasi</Link>
          <Link to="/kasir">Kasir</Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Monitoring antrean dan triage IGD</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="emergency-content">
        <header className="emergency-header">
          <div>
            <small>Modul Gawat Darurat</small>
            <h1>Instalasi Gawat Darurat</h1>
            <p>
              Monitoring pasien yang masuk melalui layanan IGD, asesmen awal,
              dan klasifikasi prioritas triage sebagai dasar percepatan penanganan.
            </p>
          </div>

          <div className="emergency-status-card">
            <span>Status Modul</span>
            <strong>Aktif</strong>
            <p>Backend Integrated</p>
          </div>
        </header>

        {loadError && (
          <section className="registration-warning-banner">
            <strong>Antrean IGD belum dapat dimuat.</strong>
            <span>{loadError}</span>
          </section>
        )}

        <section className="emergency-stat-grid">
          <article className="emergency-stat-card">
            <span>Pasien Masuk IGD</span>
            <strong>{totalPatients}</strong>
            <small>Data registrasi backend</small>
          </article>

          <article className="emergency-stat-card red-stat">
            <span>Prioritas Merah</span>
            <strong>{redPriority}</strong>
            <small>Urgensi tinggi</small>
          </article>

          <article className="emergency-stat-card yellow-stat">
            <span>Prioritas Kuning</span>
            <strong>{yellowPriority}</strong>
            <small>Perlu penanganan cepat</small>
          </article>

          <article className="emergency-stat-card">
            <span>Menunggu Triage</span>
            <strong>{waitingTriage}</strong>
            <small>Belum final asesmen</small>
          </article>
        </section>

        <section className="emergency-layout">
          <article className="emergency-panel">
            <div className="emergency-panel-title">
              <small>Emergency Queue</small>
              <h2>Daftar Pasien IGD</h2>
            </div>

            <div className="emergency-table-wrapper">
              <table className="emergency-table">
                <thead>
                  <tr>
                    <th>No. RM</th>
                    <th>Nama Pasien</th>
                    <th>Antrean</th>
                    <th>Triage</th>
                    <th>Status Asesmen</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={10} className="empty-table-state">
                        Memuat pasien IGD dari backend...
                      </td>
                    </tr>
                  )}

                  {!isLoading && emergencyPatients.length === 0 && (
                    <tr>
                      <td colSpan={10} className="empty-table-state">
                        Belum ada pasien yang masuk ke layanan IGD.
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    emergencyPatients.map((row) => (
                      <tr key={row.registrationId}>
                        <td>{row.rm}</td>
                        <td>{row.patient}</td>
                        <td>{row.queue}</td>
                        <td>
                          <span
                            className={`triage-pill ${row.triageLevel.toLowerCase()}`}
                          >
                            {row.triageLevel}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`emergency-status-pill ${
                              row.status === 'Dalam Asesmen'
                                ? 'assessing'
                                : row.status === 'Triage Selesai'
                                  ? 'completed'
                                  : ''
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            className="detail-registration-link"
                            to={`/igd/asesmen/${row.registrationId}`}
                          >
                            Mulai Asesmen
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="emergency-panel emergency-flow-panel">
            <div className="emergency-panel-title">
              <small>Alur IGD</small>
              <h2>Triage Pasien</h2>
            </div>

            <div className="emergency-process-flow">
              <div>
                <span>01</span>
                <strong>Pasien Masuk IGD</strong>
                <p>Registrasi pasien diteruskan ke layanan gawat darurat.</p>
              </div>

              <div>
                <span>02</span>
                <strong>Asesmen Awal</strong>
                <p>Petugas mengisi keluhan, kesadaran, dan tanda vital.</p>
              </div>

              <div>
                <span>03</span>
                <strong>Triage Prioritas</strong>
                <p>Pasien diklasifikasikan merah, kuning, atau hijau.</p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default EmergencyPage
