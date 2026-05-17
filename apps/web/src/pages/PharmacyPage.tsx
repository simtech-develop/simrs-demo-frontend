import { Link } from 'react-router'
import { getRegistrations } from '../lib/registrationStorage'
import { getOutpatientExams } from '../lib/outpatientStorage'
import {
  ensurePharmacyOrder,
  getPharmacyOrderByRegistrationId,
} from '../lib/pharmacyStorage'

function PharmacyPage() {
  const registrations = getRegistrations()
  const exams = getOutpatientExams()

  const pharmacyOrders = exams
    .filter(
      (exam) =>
        exam.status === 'Pemeriksaan Selesai' &&
        exam.prescriptions.length > 0,
    )
    .map((exam) => {
      const registration = registrations.find(
        (item) => item.id === exam.registrationId,
      )

      const order =
        getPharmacyOrderByRegistrationId(exam.registrationId) ??
        ensurePharmacyOrder(exam.registrationId)

      return {
        exam,
        registration,
        order,
      }
    })
    .filter((item) => item.registration)

  const totalOrders = pharmacyOrders.length

  const totalMedicines = pharmacyOrders.reduce(
    (total, item) => total + item.exam.prescriptions.length,
    0,
  )

  const totalProcessed = pharmacyOrders.filter(
    (item) => item.order.status !== 'Menunggu Diproses',
  ).length

  const totalReady = pharmacyOrders.filter(
    (item) => item.order.status === 'Obat Siap Diambil',
  ).length

  return (
    <main className="pharmacy-app">
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
          <Link to="/rme">RME</Link>
          <Link className="active" to="/farmasi">
            Farmasi
          </Link>
          <Link to="/kasir">Kasir</Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Antrean resep dari poli rawat jalan</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="pharmacy-content">
        <header className="pharmacy-header">
          <div>
            <small>Modul Penunjang Klinis</small>
            <h1>Farmasi</h1>
            <p>
              Monitoring resep elektronik yang diteruskan dari pemeriksaan
              dokter untuk diproses oleh unit farmasi rumah sakit.
            </p>
          </div>

          <div className="pharmacy-status-card">
            <span>Status Modul</span>
            <strong>Aktif</strong>
            <p>Terhubung dari Rawat Jalan</p>
          </div>
        </header>

        <section className="pharmacy-stat-grid">
          <article className="pharmacy-stat-card">
            <span>Resep Masuk</span>
            <strong>{totalOrders}</strong>
            <small>Order aktif</small>
          </article>

          <article className="pharmacy-stat-card">
            <span>Total Item Obat</span>
            <strong>{totalMedicines}</strong>
            <small>Dari resep dokter</small>
          </article>

          <article className="pharmacy-stat-card">
            <span>Resep Diproses</span>
            <strong>{totalProcessed}</strong>
            <small>Sudah disentuh farmasi</small>
          </article>

          <article className="pharmacy-stat-card">
            <span>Obat Siap Diambil</span>
            <strong>{totalReady}</strong>
            <small>Siap serah pasien</small>
          </article>
        </section>

        <section className="pharmacy-layout">
          <article className="pharmacy-panel">
            <div className="pharmacy-panel-title">
              <small>Prescription Queue</small>
              <h2>Daftar Resep Masuk</h2>
            </div>

            <div className="pharmacy-table-wrapper">
              <table className="pharmacy-table">
                <thead>
                  <tr>
                    <th>No. RM</th>
                    <th>Nama Pasien</th>
                    <th>Poli</th>
                    <th>Item Obat</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {pharmacyOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-table-state">
                        Belum ada resep yang masuk dari pemeriksaan dokter.
                      </td>
                    </tr>
                  ) : (
                    pharmacyOrders.map(({ exam, registration, order }) => (
                      <tr key={exam.registrationId}>
                        <td>{registration?.rm}</td>
                        <td>{registration?.patient}</td>
                        <td>{registration?.service}</td>
                        <td>{exam.prescriptions.length} Obat</td>
                        <td>
                          <span
                            className={`pharmacy-status-pill ${
                              order.status === 'Sedang Disiapkan'
                                ? 'preparing'
                                : order.status === 'Obat Siap Diambil'
                                  ? 'ready'
                                  : ''
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            className="detail-registration-link"
                            to={`/farmasi/detail/${exam.registrationId}`}
                          >
                            Lihat Resep
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="pharmacy-panel pharmacy-flow-panel">
            <div className="pharmacy-panel-title">
              <small>Alur Farmasi</small>
              <h2>Resep dari Dokter</h2>
            </div>

            <div className="pharmacy-process-flow">
              <div>
                <span>01</span>
                <strong>Pemeriksaan Selesai</strong>
                <p>Dokter menyimpan hasil pemeriksaan pasien.</p>
              </div>

              <div>
                <span>02</span>
                <strong>Resep Masuk Farmasi</strong>
                <p>Obat yang diresepkan muncul sebagai antrean farmasi.</p>
              </div>

              <div>
                <span>03</span>
                <strong>Proses Dispensing</strong>
                <p>Farmasi memverifikasi dan menyiapkan obat.</p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default PharmacyPage
