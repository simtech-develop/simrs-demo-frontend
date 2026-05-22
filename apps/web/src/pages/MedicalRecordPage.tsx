import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
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
    status: 'WAITING' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELED'
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
    doctor?: {
      id: string
      fullName: string
    } | null
  }
}

type EmergencyAssessmentStatusApi =
  | 'WAITING_TRIAGE'
  | 'IN_ASSESSMENT'
  | 'TRIAGE_COMPLETED'

type EmergencyTriageLevelApi = 'RED' | 'YELLOW' | 'GREEN'

type ApiEmergencyAssessment = {
  id: string
  registrationId: string
  triageLevel: EmergencyTriageLevelApi
  chiefComplaint?: string | null
  consciousness?: string | null
  bloodPressure?: string | null
  pulse?: string | null
  respiratoryRate?: string | null
  oxygenSaturation?: string | null
  emergencyNote?: string | null
  status: EmergencyAssessmentStatusApi
  assessedAt?: string | null
  createdAt: string
  updatedAt: string
  registration: {
    id: string
    registrationNo: string
    status: 'WAITING' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELED'
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
}

type MedicalRecordRow = {
  id: string
  registrationId: string
  rm: string
  patient: string
  service: string
  summary: string
  recordType: 'Rawat Jalan' | 'IGD'
  status: string
  detailPath: string
}

function buildOutpatientSummary(record: ApiMedicalRecord) {
  if (record.diagnosis && record.diagnosis.trim() !== '') {
    return record.diagnosis
  }

  if (record.anamnesis && record.anamnesis.trim() !== '') {
    return record.anamnesis.split('\n')[0]
  }

  return 'Catatan klinis rawat jalan tersimpan'
}

function buildEmergencySummary(record: ApiEmergencyAssessment) {
  if (record.emergencyNote && record.emergencyNote.trim() !== '') {
    return record.emergencyNote
  }

  if (record.chiefComplaint && record.chiefComplaint.trim() !== '') {
    return record.chiefComplaint
  }

  return 'Triage IGD selesai'
}

function mapMedicalRecord(record: ApiMedicalRecord): MedicalRecordRow {
  return {
    id: record.id,
    registrationId: record.registrationId,
    rm: record.registration.patient.medicalRecordNo,
    patient: record.registration.patient.fullName,
    service: record.registration.clinic.name,
    summary: buildOutpatientSummary(record),
    recordType: 'Rawat Jalan',
    status: 'Tersimpan',
    detailPath: `/rme/detail/${record.registrationId}`,
  }
}

function mapEmergencyRecord(
  assessment: ApiEmergencyAssessment,
): MedicalRecordRow {
  return {
    id: assessment.id,
    registrationId: assessment.registrationId,
    rm: assessment.registration.patient.medicalRecordNo,
    patient: assessment.registration.patient.fullName,
    service: assessment.registration.clinic.name,
    summary: buildEmergencySummary(assessment),
    recordType: 'IGD',
    status: 'Triage Selesai',
    detailPath: `/rme/igd/${assessment.registrationId}`,
  }
}

function MedicalRecordPage() {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadMedicalRecords = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const [outpatientRecords, emergencyAssessments] = await Promise.all([
        api.get<ApiMedicalRecord[]>('/medical-records'),
        api.get<ApiEmergencyAssessment[]>('/emergency-assessments'),
      ])

      const outpatientRows = outpatientRecords.map(mapMedicalRecord)

      const emergencyRows = emergencyAssessments
        .filter((assessment) => assessment.status === 'TRIAGE_COMPLETED')
        .map(mapEmergencyRecord)

      setMedicalRecords([...outpatientRows, ...emergencyRows])
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memuat daftar rekam medis dari backend.'

      setMedicalRecords([])
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadMedicalRecords()
  }, [])

  const completedRecords = medicalRecords.length

  const uniquePatients = useMemo(
    () => new Set(medicalRecords.map((item) => item.rm)).size,
    [medicalRecords],
  )

  const emergencyRecordCount = medicalRecords.filter(
    (item) => item.recordType === 'IGD',
  ).length

  const outpatientRecordCount = medicalRecords.filter(
    (item) => item.recordType === 'Rawat Jalan',
  ).length

  return (
    <main className="rme-app">
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
          <Link to="/ruang-tindakan">Ruang Tindakan</Link>
          <Link to="/rawat-inap">Rawat Inap</Link>
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
          <span>Rekam medis rawat jalan dan IGD</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="rme-content">
        <header className="rme-header">
          <div>
            <small>Modul Klinis</small>
            <h1>Rekam Medis Elektronik</h1>
            <p>
              Ringkasan catatan klinis rawat jalan dan triage IGD yang telah
              tersimpan pada backend SIMRS Demo.
            </p>
          </div>

          <div className="rme-status-card">
            <span>Status Modul</span>
            <strong>Aktif</strong>
            <p>Backend Integrated</p>
          </div>
        </header>

        {loadError && (
          <section className="registration-warning-banner">
            <strong>Data RME belum dapat dimuat.</strong>
            <span>{loadError}</span>
          </section>
        )}

        <section className="rme-stat-grid">
          <article className="rme-stat-card">
            <span>Total RME</span>
            <strong>{completedRecords}</strong>
            <small>Catatan klinis tersimpan</small>
          </article>

          <article className="rme-stat-card">
            <span>Pasien Tercatat</span>
            <strong>{uniquePatients}</strong>
            <small>No. RM unik</small>
          </article>

          <article className="rme-stat-card">
            <span>RME Rawat Jalan</span>
            <strong>{outpatientRecordCount}</strong>
            <small>Hasil pemeriksaan poli</small>
          </article>

          <article className="rme-stat-card">
            <span>RME IGD</span>
            <strong>{emergencyRecordCount}</strong>
            <small>Triage selesai</small>
          </article>
        </section>

        <section className="rme-layout">
          <article className="rme-panel">
            <div className="rme-panel-title">
              <small>Clinical Records</small>
              <h2>Daftar Rekam Medis Pasien</h2>
            </div>

            <div className="rme-table-wrapper">
              <table className="rme-table">
                <thead>
                  <tr>
                    <th>No. RM</th>
                    <th>Nama Pasien</th>
                    <th>Jenis RME</th>
                    <th>Unit Layanan</th>
                    <th>Ringkasan Klinis</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="empty-table-state">
                        Memuat rekam medis dari backend...
                      </td>
                    </tr>
                  )}

                  {!isLoading && medicalRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-table-state">
                        Belum ada rekam medis yang tersimpan.
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    medicalRecords.map((record) => (
                      <tr key={`${record.recordType}-${record.id}`}>
                        <td>{record.rm}</td>
                        <td>{record.patient}</td>
                        <td>
                          <span
                            className={`record-type-pill ${
                              record.recordType === 'IGD' ? 'emergency' : ''
                            }`}
                          >
                            {record.recordType}
                          </span>
                        </td>
                        <td>{record.service}</td>
                        <td>{record.summary}</td>
                        <td>
                          <span className="rme-status-pill">
                            {record.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            className="detail-registration-link"
                            to={record.detailPath}
                          >
                            Lihat RME
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rme-panel rme-flow-panel">
            <div className="rme-panel-title">
              <small>Alur RME</small>
              <h2>Sumber Rekam Medis</h2>
            </div>

            <div className="rme-process-flow">
              <div>
                <span>01</span>
                <strong>Rawat Jalan</strong>
                <p>Pemeriksaan dokter membentuk catatan medis pasien.</p>
              </div>

              <div>
                <span>02</span>
                <strong>IGD</strong>
                <p>Triage selesai membentuk rekam medis IGD awal.</p>
              </div>

              <div>
                <span>03</span>
                <strong>Detail Klinis</strong>
                <p>Data ditinjau melalui halaman detail RME sesuai layanan.</p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default MedicalRecordPage
