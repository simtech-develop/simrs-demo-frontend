import { Link } from 'react-router'
import { getRegistrations } from '../lib/registrationStorage'
import { getOutpatientExams } from '../lib/outpatientStorage'
import { getEmergencyAssessments } from '../lib/emergencyStorage'

function MedicalRecordPage() {
  const registrations = getRegistrations()
  const outpatientExams = getOutpatientExams()
  const emergencyAssessments = getEmergencyAssessments()

  const outpatientRecords = outpatientExams
    .filter((exam) => exam.status === 'Pemeriksaan Selesai')
    .map((exam) => {
      const registration = registrations.find(
        (item) => item.id === exam.registrationId,
      )

      return {
        id: exam.registrationId,
        rm: registration?.rm ?? '-',
        patient: registration?.patient ?? '-',
        service: registration?.service ?? '-',
        summary: exam.workingDiagnosis,
        recordType: 'Rawat Jalan',
        status: 'Tersimpan',
        detailPath: `/rme/detail/${exam.registrationId}`,
      }
    })
    .filter((item) => item.patient !== '-')

  const emergencyRecords = emergencyAssessments
    .filter((assessment) => assessment.status === 'Triage Selesai')
    .map((assessment) => {
      const registration = registrations.find(
        (item) => item.id === assessment.registrationId,
      )

      return {
        id: assessment.registrationId,
        rm: registration?.rm ?? '-',
        patient: registration?.patient ?? '-',
        service: 'IGD',
        summary: `Triage ${assessment.triageLevel}`,
        recordType: 'IGD',
        status: 'Tersimpan',
        detailPath: `/rme/igd/${assessment.registrationId}`,
      }
    })
    .filter((item) => item.patient !== '-')

  const medicalRecords = [...outpatientRecords, ...emergencyRecords]

  const completedRecords = medicalRecords.length
  const uniquePatients = new Set(medicalRecords.map((item) => item.rm)).size
  const activeServices = new Set(medicalRecords.map((item) => item.service)).size
  const emergencyRecordCount = emergencyRecords.length

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
              Ringkasan catatan klinis dari pemeriksaan rawat jalan dan asesmen
              triage IGD yang tersimpan pada prototype SIMRS Type D/C.
            </p>
          </div>

          <div className="rme-status-card">
            <span>Status Modul</span>
            <strong>Aktif</strong>
            <p>Rawat Jalan + IGD</p>
          </div>
        </header>

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
            <span>Layanan Klinik</span>
            <strong>{activeServices}</strong>
            <small>Poli dan IGD</small>
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
                  {medicalRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-table-state">
                        Belum ada rekam medis yang tersimpan.
                      </td>
                    </tr>
                  ) : (
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
                          <span className="rme-status-pill">{record.status}</span>
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
                    ))
                  )}
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
                <p>Pemeriksaan dokter membentuk catatan medis poli.</p>
              </div>

              <div>
                <span>02</span>
                <strong>IGD</strong>
                <p>Triage selesai menghasilkan catatan asesmen gawat darurat.</p>
              </div>

              <div>
                <span>03</span>
                <strong>RME Terintegrasi</strong>
                <p>Catatan layanan terkumpul pada modul rekam medis.</p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default MedicalRecordPage
