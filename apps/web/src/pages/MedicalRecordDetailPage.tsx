import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../lib/api'

type ApiMedicalRecord = {
  id: string
  registrationId: string
  anamnesis?: string | null
  physicalExamination?: string | null
  diagnosis?: string | null
  treatmentPlan?: string | null
  prescriptionNote?: string | null
  examinedAt: string
  createdAt: string
  updatedAt: string
  registration: {
    id: string
    registrationNo: string
    visitDate: string
    queueNumber: number
    chiefComplaint?: string | null
    status: 'WAITING' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELED'
    patient: {
      id: string
      medicalRecordNo: string
      nationalId?: string | null
      fullName: string
      gender?: 'MALE' | 'FEMALE'
      birthDate?: string | null
      phone?: string | null
      address?: string | null
    }
    clinic: {
      id: string
      code: string
      name: string
    }
    doctor?: {
      id: string
      fullName: string
    } | null
  }
}

type ParsedClinicalRecord = {
  chiefComplaint: string
  currentHistory: string
  bloodPressure: string
  pulse: string
  temperature: string
  weight: string
  physicalExaminationSummary: string
  diagnosis: string
  carePlan: string
  doctorNote: string
}

function displayValue(value?: string | null) {
  return value && value.trim() !== '' ? value : '-'
}

function formatDate(value?: string | null) {
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

function extractLineValue(source: string | null | undefined, label: string) {
  if (!source) {
    return ''
  }

  const line = source
    .split('\n')
    .find((item) => item.trim().startsWith(`${label}:`))

  return line ? line.replace(`${label}:`, '').trim() : ''
}

function parseMedicalRecord(record: ApiMedicalRecord): ParsedClinicalRecord {
  const chiefComplaint =
    extractLineValue(record.anamnesis, 'Keluhan Utama') ||
    record.registration.chiefComplaint ||
    record.anamnesis ||
    ''

  const currentHistory = extractLineValue(
    record.anamnesis,
    'Riwayat Penyakit Sekarang',
  )

  const bloodPressure = extractLineValue(
    record.physicalExamination,
    'Tekanan Darah',
  )

  const pulse = extractLineValue(record.physicalExamination, 'Nadi')
  const temperature = extractLineValue(record.physicalExamination, 'Suhu')
  const weight = extractLineValue(record.physicalExamination, 'Berat Badan')

  const hasStructuredVital =
    bloodPressure !== '' ||
    pulse !== '' ||
    temperature !== '' ||
    weight !== ''

  const carePlan =
    extractLineValue(record.treatmentPlan, 'Rencana Tindak Lanjut') ||
    record.treatmentPlan ||
    ''

  const doctorNote = extractLineValue(record.treatmentPlan, 'Catatan Dokter')

  return {
    chiefComplaint,
    currentHistory,
    bloodPressure,
    pulse,
    temperature,
    weight,
    physicalExaminationSummary: hasStructuredVital
      ? ''
      : record.physicalExamination ?? '',
    diagnosis: record.diagnosis ?? '',
    carePlan,
    doctorNote,
  }
}

function MedicalRecordDetailPage() {
  const { id } = useParams()
  const [medicalRecord, setMedicalRecord] =
    useState<ApiMedicalRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadMedicalRecord = async () => {
    if (!id) {
      setLoadError('ID registrasi tidak tersedia.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError('')

    try {
      const response = await api.get<ApiMedicalRecord>(
        `/medical-records/registration/${id}`,
      )

      setMedicalRecord(response)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memuat detail rekam medis dari backend.'

      setMedicalRecord(null)
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadMedicalRecord()
  }, [id])

  const parsedRecord = useMemo(
    () => (medicalRecord ? parseMedicalRecord(medicalRecord) : null),
    [medicalRecord],
  )

  if (isLoading) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Memuat RME</small>
          <h1>Detail rekam medis sedang diproses</h1>
          <p>Mengambil catatan klinis pasien dari backend SIMRS.</p>
        </section>
      </main>
    )
  }

  if (!medicalRecord || !parsedRecord) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>RME Tidak Ditemukan</small>
          <h1>Rekam medis pasien belum tersedia</h1>
          <p>
            {loadError ||
              'Pastikan pemeriksaan rawat jalan sudah disimpan terlebih dahulu.'}
          </p>
          <Link to="/rme">Kembali ke Daftar RME</Link>
        </section>
      </main>
    )
  }

  const registration = medicalRecord.registration
  const patient = registration.patient
  const clinic = registration.clinic

  return (
    <main className="rme-detail-app">
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
          <span>Detail rekam medis pasien</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="rme-detail-content">
        <header className="rme-detail-header">
          <div className="rme-detail-heading">
            <Link className="breadcrumb-link" to="/rme">
              ← Kembali ke Daftar RME
            </Link>

            <small>Detail Rekam Medis</small>
            <h1>{patient.fullName}</h1>
            <p>
              Catatan klinis hasil pemeriksaan yang telah tersimpan sebagai rekam
              medis elektronik pada backend SIMRS Demo.
            </p>
          </div>

          <div className="rme-detail-status-card">
            <span>Status RME</span>
            <strong>Tersimpan</strong>
            <p>{patient.medicalRecordNo}</p>
          </div>
        </header>

        <section className="rme-patient-banner">
          <article>
            <span>No. RM</span>
            <strong>{patient.medicalRecordNo}</strong>
          </article>

          <article>
            <span>Pasien</span>
            <strong>{patient.fullName}</strong>
          </article>

          <article>
            <span>Poli</span>
            <strong>{clinic.name}</strong>
          </article>

          <article>
            <span>Tanggal Pemeriksaan</span>
            <strong>{formatDate(medicalRecord.examinedAt)}</strong>
          </article>
        </section>

        <section className="rme-detail-grid">
          <article className="rme-detail-panel">
            <div className="rme-panel-title">
              <small>Subjektif</small>
              <h2>Anamnesis</h2>
            </div>

            <div className="rme-clinical-card">
              <span>Keluhan Utama</span>
              <strong>{displayValue(parsedRecord.chiefComplaint)}</strong>
            </div>

            <div className="rme-clinical-card">
              <span>Riwayat Penyakit Sekarang</span>
              <strong>{displayValue(parsedRecord.currentHistory)}</strong>
            </div>
          </article>

          <article className="rme-detail-panel">
            <div className="rme-panel-title">
              <small>Objektif</small>
              <h2>Tanda Vital</h2>
            </div>

            {parsedRecord.physicalExaminationSummary ? (
              <div className="rme-clinical-card">
                <span>Pemeriksaan Fisik</span>
                <strong>
                  {displayValue(parsedRecord.physicalExaminationSummary)}
                </strong>
              </div>
            ) : (
              <div className="rme-vital-grid">
                <div>
                  <span>Tekanan Darah</span>
                  <strong>{displayValue(parsedRecord.bloodPressure)}</strong>
                </div>

                <div>
                  <span>Nadi</span>
                  <strong>{displayValue(parsedRecord.pulse)}</strong>
                </div>

                <div>
                  <span>Suhu</span>
                  <strong>{displayValue(parsedRecord.temperature)}</strong>
                </div>

                <div>
                  <span>Berat Badan</span>
                  <strong>{displayValue(parsedRecord.weight)}</strong>
                </div>
              </div>
            )}
          </article>

          <article className="rme-detail-panel wide-panel">
            <div className="rme-panel-title">
              <small>Assessment & Plan</small>
              <h2>Kesimpulan Pemeriksaan</h2>
            </div>

            <div className="rme-assessment-grid">
              <div>
                <span>Diagnosis Kerja</span>
                <strong>{displayValue(parsedRecord.diagnosis)}</strong>
              </div>

              <div>
                <span>Rencana Tindak Lanjut</span>
                <strong>{displayValue(parsedRecord.carePlan)}</strong>
              </div>

              <div>
                <span>Catatan Dokter</span>
                <strong>{displayValue(parsedRecord.doctorNote)}</strong>
              </div>
            </div>
          </article>

          <article className="rme-detail-panel wide-panel">
            <div className="rme-panel-title">
              <small>Administrasi Klinik</small>
              <h2>Informasi Registrasi</h2>
            </div>

            <div className="rme-assessment-grid">
              <div>
                <span>Nomor Registrasi</span>
                <strong>{registration.registrationNo}</strong>
              </div>

              <div>
                <span>Nomor Antrean</span>
                <strong>
                  {clinic.code}-
                  {String(registration.queueNumber).padStart(3, '0')}
                </strong>
              </div>

              <div>
                <span>Dokter</span>
                <strong>
                  {displayValue(registration.doctor?.fullName ?? '-')}
                </strong>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default MedicalRecordDetailPage
