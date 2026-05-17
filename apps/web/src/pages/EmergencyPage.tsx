import { Link } from 'react-router'
import { getRegistrations } from '../lib/registrationStorage'
import {
  ensureEmergencyAssessment,
  getEmergencyAssessmentByRegistrationId,
} from '../lib/emergencyStorage'

function EmergencyPage() {
  const registrations = getRegistrations()

  const emergencyPatients = registrations
    .filter((item) => item.service === 'IGD')
    .map((registration) => {
      const assessment =
        getEmergencyAssessmentByRegistrationId(registration.id) ??
        ensureEmergencyAssessment(registration.id)

      return {
        registration,
        assessment,
      }
    })

  const totalPatients = emergencyPatients.length

  const redPriority = emergencyPatients.filter(
    (item) => item.assessment.triageLevel === 'Merah',
  ).length

  const yellowPriority = emergencyPatients.filter(
    (item) => item.assessment.triageLevel === 'Kuning',
  ).length

  const waitingTriage = emergencyPatients.filter(
    (item) => item.assessment.status !== 'Triage Selesai',
  ).length

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
            <p>Triage & asesmen awal</p>
          </div>
        </header>

        <section className="emergency-stat-grid">
          <article className="emergency-stat-card">
            <span>Pasien Masuk IGD</span>
            <strong>{totalPatients}</strong>
            <small>Data registrasi terhubung</small>
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
                  {emergencyPatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-table-state">
                        Belum ada pasien yang masuk ke layanan IGD.
                      </td>
                    </tr>
                  ) : (
                    emergencyPatients.map(({ registration, assessment }) => (
                      <tr key={registration.id}>
                        <td>{registration.rm}</td>
                        <td>{registration.patient}</td>
                        <td>{registration.queue}</td>
                        <td>
                          <span
                            className={`triage-pill ${assessment.triageLevel.toLowerCase()}`}
                          >
                            {assessment.triageLevel}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`emergency-status-pill ${
                              assessment.status === 'Dalam Asesmen'
                                ? 'assessing'
                                : assessment.status === 'Triage Selesai'
                                  ? 'completed'
                                  : ''
                            }`}
                          >
                            {assessment.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            className="detail-registration-link"
                            to={`/igd/asesmen/${registration.id}`}
                          >
                            Mulai Asesmen
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
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
