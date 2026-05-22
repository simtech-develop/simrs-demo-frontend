import { Link } from 'react-router'

function InpatientPage() {
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
          <Link to="/rawat-jalan">Rawat Jalan</Link>
          <Link to="/igd">IGD</Link>
          <Link to="/ruang-tindakan">Ruang Tindakan</Link>
          <Link to="/rawat-inap">Rawat Inap</Link>
          <Link to="/rme">RME</Link>
          <Link to="/farmasi">Farmasi</Link>
          <Link to="/kasir">Kasir</Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Admission rawat inap</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="outpatient-content">
        <header className="outpatient-header">
          <div>
            <small>Modul Lanjutan IGD</small>
            <h1>Rawat Inap</h1>
            <p>
              Modul ini digunakan untuk proses admisi pasien dari IGD atau poli
              menuju ruang perawatan rawat inap.
            </p>
          </div>

          <div className="outpatient-unit-card">
            <span>Status Modul</span>
            <strong>Demo Ready</strong>
            <p>Terhubung dari disposisi IGD</p>
          </div>
        </header>

        <section className="outpatient-stat-grid">
          <article className="outpatient-stat-card">
            <span>Permintaan Rawat Inap</span>
            <strong>1</strong>
            <small>Dari disposisi IGD</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Status Kamar</span>
            <strong>Perlu Pilih</strong>
            <small>Kelas dan ruang perawatan</small>
          </article>

          <article className="outpatient-stat-card">
            <span>DPJP</span>
            <strong>Belum Final</strong>
            <small>Ditentukan saat admisi</small>
          </article>
        </section>

        <section className="outpatient-panel">
          <div className="outpatient-panel-title">
            <small>Alur Rawat Inap</small>
            <h2>Proses Admisi Pasien</h2>
          </div>

          <div className="outpatient-process-flow">
            <div>
              <span>01</span>
              <strong>Validasi Admission</strong>
              <p>Pastikan pasien, penjamin, diagnosis, dan instruksi rawat inap.</p>
            </div>

            <div>
              <span>02</span>
              <strong>Pilih Kelas & Ruang</strong>
              <p>Tentukan kelas perawatan, ruangan, dan tempat tidur.</p>
            </div>

            <div>
              <span>03</span>
              <strong>Tentukan DPJP</strong>
              <p>Set dokter penanggung jawab pasien rawat inap.</p>
            </div>

            <div>
              <span>04</span>
              <strong>Transfer Pasien</strong>
              <p>Pasien dipindahkan dari IGD ke ruang rawat inap.</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default InpatientPage
