import { Link } from 'react-router'

const summaryCards = [
  {
    label: 'Pasien Terdaftar Hari Ini',
    value: '128',
    note: '+12 dibanding kemarin',
  },
  {
    label: 'Antrean Poli Aktif',
    value: '34',
    note: '6 poli sedang berjalan',
  },
  {
    label: 'Resep Menunggu Farmasi',
    value: '19',
    note: 'Prioritas dispensing',
  },
  {
    label: 'Tagihan Kasir Pending',
    value: '11',
    note: 'Perlu validasi transaksi',
  },
]

const quickModules = [
  'Pendaftaran Pasien',
  'Rawat Jalan',
  'IGD',
  'Rekam Medis Elektronik',
  'Farmasi',
  'Kasir',
]

const serviceActivities = [
  {
    time: '08:12',
    unit: 'Pendaftaran',
    activity: 'Pasien baru berhasil diregistrasi',
    status: 'Selesai',
  },
  {
    time: '08:25',
    unit: 'Poli Penyakit Dalam',
    activity: 'Kunjungan rawat jalan masuk antrean dokter',
    status: 'Aktif',
  },
  {
    time: '08:41',
    unit: 'Farmasi',
    activity: 'Resep elektronik diterima dari poli',
    status: 'Proses',
  },
  {
    time: '09:03',
    unit: 'Kasir',
    activity: 'Tagihan pelayanan pasien diperbarui',
    status: 'Review',
  },
]

const operationalReadiness = [
  { label: 'Frontend Shell', status: 'Completed' },
  { label: 'Routing Login & Dashboard', status: 'Completed' },
  { label: 'Master Pasien', status: 'Next Build' },
  { label: 'Database & Backend API', status: 'Planned' },
]

function DashboardPage() {
  return (
    <main className="dashboard-app">
      <aside className="dashboard-sidebar-pro">
        <div className="sidebar-brand-pro">
          <span>SIMRS</span>
          <strong>SIMTECH</strong>
          <p>Type D / C Demo Platform</p>
        </div>

        <nav className="sidebar-menu-pro">
          <a className="active" href="#">
            Dashboard
          </a>
          <Link to="/pendaftaran">Pendaftaran</Link>
          <Link to="/rawat-jalan">Rawat Jalan</Link>
          <Link to="/igd">IGD</Link>
          <Link to="/rme">RME</Link>
          <Link to="/farmasi">Farmasi</Link>
          <Link to="/kasir">Kasir</Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Environment presentasi produk</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="dashboard-content-pro">
        <header className="dashboard-header-pro">
          <div>
            <small>Dashboard Operasional</small>
            <h1>Selamat datang di SIMRS Type D/C</h1>
            <p>
              Ringkasan awal pelayanan rumah sakit, progres modul, dan aktivitas
              operasional yang akan berkembang menjadi dashboard nyata SIMRS.
            </p>
          </div>

          <div className="operator-profile-card">
            <span>Operator Aktif</span>
            <strong>Admin SIMRS</strong>
            <p>Super User Demo</p>
          </div>
        </header>

        <section className="dashboard-summary-grid">
          {summaryCards.map((card) => (
            <article className="summary-card-pro" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.note}</small>
            </article>
          ))}
        </section>

        <section className="dashboard-lower-grid">
          <article className="dashboard-panel-pro module-access-panel">
            <div className="dashboard-panel-title">
              <small>Quick Access</small>
              <h2>Modul Prioritas SIMRS</h2>
            </div>

            <div className="module-access-grid">
              {quickModules.map((module) => (
                <button key={module}>{module}</button>
              ))}
            </div>
          </article>

          <article className="dashboard-panel-pro activity-monitor-panel">
            <div className="dashboard-panel-title">
              <small>Live Service Activity</small>
              <h2>Aktivitas Pelayanan</h2>
            </div>

            <div className="service-activity-list">
              {serviceActivities.map((item) => (
                <div className="service-activity-row" key={`${item.time}-${item.unit}`}>
                  <span>{item.time}</span>
                  <strong>{item.unit}</strong>
                  <p>{item.activity}</p>
                  <em>{item.status}</em>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="dashboard-bottom-grid">
          <article className="dashboard-panel-pro readiness-panel">
            <div className="dashboard-panel-title">
              <small>Development Readiness</small>
              <h2>Status Pengembangan</h2>
            </div>

            <div className="readiness-list">
              {operationalReadiness.map((item) => (
                <div className="readiness-row" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.status}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-panel-pro focus-panel">
            <div className="dashboard-panel-title">
              <small>Next Focus</small>
              <h2>Build Selanjutnya</h2>
            </div>

            <div className="focus-card">
              <strong>Modul Pendaftaran Pasien</strong>
              <p>
                Tahap berikutnya adalah membangun halaman pendaftaran pasien
                sebagai modul pertama yang benar-benar fungsional dalam SIMRS.
              </p>

              <ul>
                <li>Input pasien baru</li>
                <li>Pencarian pasien lama</li>
                <li>Nomor rekam medis sementara</li>
                <li>Antrean kunjungan rawat jalan</li>
              </ul>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default DashboardPage
