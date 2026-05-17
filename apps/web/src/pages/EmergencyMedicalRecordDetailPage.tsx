import { Link, useParams } from 'react-router'
import { getRegistrationById } from '../lib/registrationStorage'
import { getEmergencyAssessmentByRegistrationId } from '../lib/emergencyStorage'

function displayValue(value?: string) {
  return value && value.trim() !== '' ? value : '-'
}

function EmergencyMedicalRecordDetailPage() {
  const { id } = useParams()
  const registration = id ? getRegistrationById(id) : undefined
  const assessment = id
    ? getEmergencyAssessmentByRegistrationId(id)
    : undefined

  if (!registration || !assessment || assessment.status !== 'Triage Selesai') {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>RME IGD Tidak Ditemukan</small>
          <h1>Rekam medis IGD belum tersedia</h1>
          <p>
            Pastikan triage pasien IGD telah selesai dan tersimpan terlebih dahulu.
          </p>
          <Link to="/rme">Kembali ke Daftar RME</Link>
        </section>
      </main>
    )
  }

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
            <h1>{registration.patient}</h1>
            <p>
              Catatan triage dan asesmen awal pasien gawat darurat yang telah
              tersimpan sebagai bagian dari rekam medis elektronik.
            </p>
          </div>

          <div
            className={`emergency-rme-status-card ${assessment.triageLevel.toLowerCase()}`}
          >
            <span>Status RME IGD</span>
            <strong>Triage Selesai</strong>
            <p>{assessment.triageLevel}</p>
          </div>
        </header>

        <section className="emergency-rme-patient-banner">
          <article>
            <span>No. RM</span>
            <strong>{registration.rm}</strong>
          </article>

          <article>
            <span>Pasien</span>
            <strong>{registration.patient}</strong>
          </article>

          <article>
            <span>Antrean IGD</span>
            <strong>{registration.queue}</strong>
          </article>

          <article>
            <span>Prioritas</span>
            <strong>{assessment.triageLevel}</strong>
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
              <strong>{assessment.chiefComplaint}</strong>
            </div>

            <div className="rme-clinical-card">
              <span>Tingkat Kesadaran</span>
              <strong>{assessment.consciousness}</strong>
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
                <strong>{assessment.bloodPressure}</strong>
              </div>

              <div>
                <span>Nadi</span>
                <strong>{assessment.pulse}</strong>
              </div>

              <div>
                <span>Respirasi</span>
                <strong>{assessment.respiratoryRate}</strong>
              </div>

              <div>
                <span>Saturasi Oksigen</span>
                <strong>{assessment.oxygenSaturation}</strong>
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
        </section>
      </section>
    </main>
  )
}

export default EmergencyMedicalRecordDetailPage
