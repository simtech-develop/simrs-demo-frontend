import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../lib/api'

type RegistrationStatusApi =
  | 'WAITING'
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'CANCELED'

type TriageLevelApi = 'RED' | 'YELLOW' | 'GREEN'

type AssessmentStatusApi =
  | 'WAITING_TRIAGE'
  | 'IN_ASSESSMENT'
  | 'TRIAGE_COMPLETED'

type ApiRegistration = {
  id: string
  registrationNo: string
  queueNumber: number
  status: RegistrationStatusApi
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

type ApiEmergencyAssessment = {
  id: string
  registrationId: string
  triageLevel: TriageLevelApi
  chiefComplaint?: string | null
  consciousness?: string | null
  bloodPressure?: string | null
  pulse?: string | null
  respiratoryRate?: string | null
  oxygenSaturation?: string | null
  emergencyNote?: string | null
  status: AssessmentStatusApi
  assessedAt?: string | null
  createdAt: string
  updatedAt: string
}

function displayValue(value?: string | null) {
  return value && value.trim() !== '' ? value : '-'
}

function mapTriageLevel(level: TriageLevelApi) {
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

function mapRegistrationStatus(status: RegistrationStatusApi) {
  switch (status) {
    case 'WAITING':
      return 'Menunggu'
    case 'IN_SERVICE':
      return 'Dalam Pelayanan'
    case 'COMPLETED':
      return 'Selesai'
    case 'CANCELED':
      return 'Dibatalkan'
    default:
      return 'Menunggu'
  }
}

function formatAssessmentDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function EmergencyMedicalRecordDetailPage() {
  const { id } = useParams()

  const [registration, setRegistration] =
    useState<ApiRegistration | null>(null)
  const [assessment, setAssessment] =
    useState<ApiEmergencyAssessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadEmergencyRme = async () => {
    if (!id) {
      setLoadError('ID registrasi IGD tidak tersedia.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError('')

    try {
      const [registrationResponse, assessmentResponse] = await Promise.all([
        api.get<ApiRegistration>(`/registrations/${id}`),
        api.get<ApiEmergencyAssessment>(
          `/emergency-assessments/registration/${id}`,
        ),
      ])

      setRegistration(registrationResponse)
      setAssessment(assessmentResponse)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memuat rekam medis IGD dari backend.'

      setRegistration(null)
      setAssessment(null)
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadEmergencyRme()
  }, [id])

  if (isLoading) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Memuat RME IGD</small>
          <h1>Detail rekam medis IGD sedang disiapkan</h1>
          <p>Mengambil registrasi dan asesmen triage dari backend SIMRS.</p>
        </section>
      </main>
    )
  }

  if (
    !registration ||
    !assessment ||
    assessment.status !== 'TRIAGE_COMPLETED'
  ) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>RME IGD Tidak Ditemukan</small>
          <h1>Rekam medis IGD belum tersedia</h1>
          <p>
            {loadError ||
              'Pastikan triage pasien IGD telah selesai dan tersimpan terlebih dahulu.'}
          </p>
          <Link to="/rme">Kembali ke Daftar RME</Link>
        </section>
      </main>
    )
  }

  const patient = registration.patient
  const triageLevel = mapTriageLevel(assessment.triageLevel)

  return (
    <main className="emergency-rme-detail-app">
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
          <Link to="/igd">IGD</Link>
          <Link className="active" to="/rme">
            RME
          </Link>
          <Link to="/farmasi">Farmasi</Link>
          <Link to="/kasir">Kasir</Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Detail rekam medis triage IGD</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="emergency-rme-detail-content">
        <header className="emergency-rme-detail-header">
          <div className="emergency-rme-detail-heading">
            <Link className="breadcrumb-link" to="/rme">
              ← Kembali ke Daftar RME
            </Link>

            <small>Detail Rekam Medis IGD</small>
            <h1>{patient.fullName}</h1>
            <p>
              Catatan triage dan asesmen awal pasien gawat darurat yang telah
              tersimpan sebagai bagian dari rekam medis elektronik.
            </p>
          </div>

          <div
            className={`emergency-rme-status-card ${triageLevel.toLowerCase()}`}
          >
            <span>Status RME IGD</span>
            <strong>Triage Selesai</strong>
            <p>{triageLevel}</p>
          </div>
        </header>

        <section className="emergency-rme-patient-banner">
          <article>
            <span>No. RM</span>
            <strong>{patient.medicalRecordNo}</strong>
          </article>

          <article>
            <span>Pasien</span>
            <strong>{patient.fullName}</strong>
          </article>

          <article>
            <span>Antrean IGD</span>
            <strong>
              IGD-{String(registration.queueNumber).padStart(3, '0')}
            </strong>
          </article>

          <article>
            <span>Prioritas</span>
            <strong>{triageLevel}</strong>
          </article>
        </section>

        <section className="emergency-rme-detail-grid">
          <article className="emergency-rme-detail-panel">
            <div className="rme-panel-title">
              <small>Subjektif IGD</small>
              <h2>Keluhan & Kesadaran</h2>
            </div>

            <div className="rme-clinical-card">
              <span>Keluhan Utama</span>
              <strong>{displayValue(assessment.chiefComplaint)}</strong>
            </div>

            <div className="rme-clinical-card">
              <span>Tingkat Kesadaran</span>
              <strong>{displayValue(assessment.consciousness)}</strong>
            </div>
          </article>

          <article className="emergency-rme-detail-panel">
            <div className="rme-panel-title">
              <small>Objektif IGD</small>
              <h2>Tanda Vital Triage</h2>
            </div>

            <div className="emergency-rme-vital-grid">
              <div>
                <span>Tekanan Darah</span>
                <strong>{displayValue(assessment.bloodPressure)}</strong>
              </div>

              <div>
                <span>Nadi</span>
                <strong>{displayValue(assessment.pulse)}</strong>
              </div>

              <div>
                <span>Respirasi</span>
                <strong>{displayValue(assessment.respiratoryRate)}</strong>
              </div>

              <div>
                <span>Saturasi Oksigen</span>
                <strong>{displayValue(assessment.oxygenSaturation)}</strong>
              </div>
            </div>
          </article>

          <article className="emergency-rme-detail-panel wide-panel">
            <div className="rme-panel-title">
              <small>Catatan IGD</small>
              <h2>Ringkasan Asesmen Awal</h2>
            </div>

            <div className="emergency-rme-note-card">
              <span>Catatan Petugas</span>
              <strong>{displayValue(assessment.emergencyNote)}</strong>
            </div>
          </article>

          <article className="emergency-rme-detail-panel wide-panel">
            <div className="rme-panel-title">
              <small>Administrasi IGD</small>
              <h2>Informasi Kunjungan</h2>
            </div>

            <div className="rme-assessment-grid">
              <div>
                <span>Nomor Registrasi</span>
                <strong>{registration.registrationNo}</strong>
              </div>

              <div>
                <span>Status Registrasi</span>
                <strong>{mapRegistrationStatus(registration.status)}</strong>
              </div>

              <div>
                <span>Waktu Triage</span>
                <strong>{formatAssessmentDate(assessment.assessedAt)}</strong>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default EmergencyMedicalRecordDetailPage
