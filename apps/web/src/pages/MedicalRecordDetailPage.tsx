import { Link, useParams } from 'react-router'
import { getRegistrationById } from '../lib/registrationStorage'
import { getOutpatientExamByRegistrationId } from '../lib/outpatientStorage'

function displayValue(value?: string) {
  return value && value.trim() !== '' ? value : '-'
}

function MedicalRecordDetailPage() {
  const { id } = useParams()
  const registration = id ? getRegistrationById(id) : undefined
  const exam = id ? getOutpatientExamByRegistrationId(id) : undefined

  if (!registration || !exam) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>RME Tidak Ditemukan</small>
          <h1>Rekam medis pasien belum tersedia</h1>
          <p>
            Pastikan pemeriksaan rawat jalan sudah disimpan terlebih dahulu.
          </p>
          <Link to="/rme">Kembali ke Daftar RME</Link>
        </section>
      </main>
    )
  }

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
            <h1>{registration.patient}</h1>
            <p>
              Catatan klinis hasil pemeriksaan rawat jalan yang telah tersimpan
              sebagai rekam medis elektronik pada prototype SIMRS.
            </p>
          </div>

          <div className="rme-detail-status-card">
            <span>Status RME</span>
            <strong>Tersimpan</strong>
            <p>{registration.rm}</p>
          </div>
        </header>

        <section className="rme-patient-banner">
          <article>
            <span>No. RM</span>
            <strong>{registration.rm}</strong>
          </article>
          <article>
            <span>Pasien</span>
            <strong>{registration.patient}</strong>
          </article>
          <article>
            <span>Poli</span>
            <strong>{registration.service}</strong>
          </article>
          <article>
            <span>Penjamin</span>
            <strong>{displayValue(registration.guarantor)}</strong>
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
              <strong>{exam.chiefComplaint}</strong>
            </div>

            <div className="rme-clinical-card">
              <span>Riwayat Penyakit Sekarang</span>
              <strong>{exam.currentHistory}</strong>
            </div>
          </article>

          <article className="rme-detail-panel">
            <div className="rme-panel-title">
              <small>Objektif</small>
              <h2>Tanda Vital</h2>
            </div>

            <div className="rme-vital-grid">
              <div>
                <span>Tekanan Darah</span>
                <strong>{exam.bloodPressure}</strong>
              </div>
              <div>
                <span>Nadi</span>
                <strong>{exam.pulse}</strong>
              </div>
              <div>
                <span>Suhu</span>
                <strong>{exam.temperature}</strong>
              </div>
              <div>
                <span>Berat Badan</span>
                <strong>{exam.weight}</strong>
              </div>
            </div>
          </article>

          <article className="rme-detail-panel wide-panel">
            <div className="rme-panel-title">
              <small>Assessment & Plan</small>
              <h2>Kesimpulan Pemeriksaan</h2>
            </div>

            <div className="rme-assessment-grid">
              <div>
                <span>Diagnosis Kerja</span>
                <strong>{exam.workingDiagnosis}</strong>
              </div>
              <div>
                <span>Rencana Tindak Lanjut</span>
                <strong>{exam.carePlan}</strong>
              </div>
              <div>
                <span>Catatan Dokter</span>
                <strong>{displayValue(exam.doctorNote)}</strong>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default MedicalRecordDetailPage
