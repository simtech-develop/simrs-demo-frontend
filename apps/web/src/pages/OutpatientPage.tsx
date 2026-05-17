import { Link } from 'react-router'
import { getRegistrations } from '../lib/registrationStorage'

function OutpatientPage() {
  const registrations = getRegistrations()

  const outpatientQueue = registrations.filter(
    (item) => item.status === 'Dilayani' || item.service.includes('Poli'),
  )

  const readyToServe = outpatientQueue.filter(
    (item) => item.status === 'Dilayani',
  ).length

  const activePolyclinics = new Set(
    outpatientQueue
      .map((item) => item.service)
      .filter((service) => service.includes('Poli')),
  ).size

  return (
    <main className="outpatient-app">
      <aside className="dashboard-sidebar-pro">
        <div className="sidebar-brand-pro">
          <span>SIMRS</span>
          <strong>SIMTECH</strong>
          <p>Type D / C Demo Platform</p>
        </div>

        <nav className="sidebar-menu-pro">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/pendaftaran">Pendaftaran</Link>
          <Link className="active" to="/rawat-jalan">
            Rawat Jalan
          </Link>
          <Link to="/igd">IGD</Link>
          <Link to="/rme">RME</Link>
          <Link to="/farmasi">Farmasi</Link>
          <Link to="/kasir">Kasir</Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Antrean layanan poli rawat jalan</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="outpatient-content">
        <header className="outpatient-header">
          <div>
            <small>Modul Klinis Awal</small>
            <h1>Rawat Jalan</h1>
            <p>
              Monitoring pasien yang telah lolos registrasi dan siap diteruskan
              ke pelayanan poli, pemeriksaan awal, dan proses medis lanjutan.
            </p>
          </div>

          <div className="outpatient-unit-card">
            <span>Unit Aktif</span>
            <strong>Poli Rawat Jalan</strong>
            <p>Queue Monitoring Demo</p>
          </div>
        </header>

        <section className="outpatient-stat-grid">
          <article className="outpatient-stat-card">
            <span>Pasien Siap Diperiksa</span>
            <strong>{readyToServe}</strong>
            <small>Status dilayani</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Poli Aktif</span>
            <strong>{activePolyclinics}</strong>
            <small>Berdasarkan antrean masuk</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Total Antrian Rawat Jalan</span>
            <strong>{outpatientQueue.length}</strong>
            <small>Data registrasi terhubung</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Integrasi Modul</span>
            <strong>Live</strong>
            <small>Dari pendaftaran pasien</small>
          </article>
        </section>

        <section className="outpatient-grid">
          <article className="outpatient-panel">
            <div className="outpatient-panel-title">
              <small>Queue Board</small>
              <h2>Antrean Pasien Rawat Jalan</h2>
            </div>

            <div className="outpatient-table-wrapper">
              <table className="outpatient-table">
                <thead>
                  <tr>
                    <th>Antrean</th>
                    <th>No. RM</th>
                    <th>Nama Pasien</th>
                    <th>Tujuan Poli</th>
                    <th>Status Registrasi</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {outpatientQueue.map((row) => (
                    <tr key={row.id}>
                      <td>{row.queue}</td>
                      <td>{row.rm}</td>
                      <td>{row.patient}</td>
                      <td>{row.service}</td>
                      <td>
                        <span
                          className={`registration-status ${
                            row.status === 'Menunggu'
                              ? 'waiting'
                              : row.status === 'Terverifikasi'
                                ? 'verified'
                                : 'served'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="start-exam-button-link"
                          to={`/rawat-jalan/pemeriksaan/${row.id}`}
                        >
                          Mulai Pemeriksaan
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="outpatient-panel outpatient-flow-panel">
            <div className="outpatient-panel-title">
              <small>Alur Rawat Jalan</small>
              <h2>Proses Setelah Registrasi</h2>
            </div>

            <div className="outpatient-process-flow">
              <div>
                <span>01</span>
                <strong>Pasien Masuk Poli</strong>
                <p>Data pasien diterima dari modul pendaftaran.</p>
              </div>

              <div>
                <span>02</span>
                <strong>Pemeriksaan Dokter</strong>
                <p>Asesmen klinis, diagnosis awal, dan tindakan medis.</p>
              </div>

              <div>
                <span>03</span>
                <strong>Teruskan ke RME / Farmasi</strong>
                <p>Hasil pelayanan menjadi dasar rekam medis dan resep.</p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default OutpatientPage
