import { Link } from 'react-router'

const modules = [
  {
    title: 'Pendaftaran',
    desc: 'Registrasi pasien baru, pasien lama, antrean, dan identifikasi layanan awal.',
  },
  {
    title: 'Rawat Jalan',
    desc: 'Alur pelayanan poli, dokter, tindakan, dan integrasi proses klinis dasar.',
  },
  {
    title: 'IGD',
    desc: 'Pencatatan triase, asesmen awal, status kegawatdaruratan, dan tindak lanjut.',
  },
  {
    title: 'RME',
    desc: 'Rekam Medis Elektronik yang disusun modular untuk kebutuhan klinis rumah sakit.',
  },
  {
    title: 'Farmasi',
    desc: 'Resep, dispensing, stok obat, dan monitoring kebutuhan pelayanan farmasi.',
  },
  {
    title: 'Kasir',
    desc: 'Validasi biaya pelayanan, pembayaran, tagihan pasien, dan laporan transaksi.',
  },
]

const principles = [
  'Modular untuk RS Tipe D dan C',
  'Berbasis arsitektur modern JavaScript',
  'Siap bertumbuh ke integrasi BPJS dan SATUSEHAT',
  'Dirancang untuk demo, pengembangan, dan produk SIMTECH',
]

function App() {
  return (
    <main className="simrs-page">
      <section className="hero">
        <div className="hero-copy">
          <div className="badge">SIMTECH Healthcare Platform</div>

          <h1>
            SIMRS Modern untuk
            <span> Rumah Sakit Tipe D & C</span>
          </h1>

          <p className="hero-description">
            Fondasi awal sistem informasi rumah sakit yang dibangun dari nol
            dengan pendekatan modular, modern, dan siap dikembangkan menjadi
            produk demonstrasi maupun platform implementasi SIMTECH.
          </p>

          <div className="hero-actions">
            <Link className="primary-link" to="/login">Masuk ke Dashboard Demo</Link>
            <button className="secondary-button">Lihat Roadmap Modul</button>
          </div>

          <div className="hero-metrics">
            <div>
              <strong>6</strong>
              <span>Modul Awal</span>
            </div>
            <div>
              <strong>Type D/C</strong>
              <span>Target Rumah Sakit</span>
            </div>
            <div>
              <strong>JS Stack</strong>
              <span>Modern Architecture</span>
            </div>
          </div>
        </div>

        <div className="hero-panel">
          <div className="panel-header">
            <span className="status-dot" />
            <p>SIMRS Development Environment</p>
          </div>

          <div className="hospital-card">
            <div className="hospital-top">
              <div>
                <small>Demo Instance</small>
                <h2>RS SIMTECH Medika</h2>
              </div>
              <span className="active-pill">Active</span>
            </div>

            <div className="queue-grid">
              <div>
                <span>Pasien Hari Ini</span>
                <strong>128</strong>
              </div>
              <div>
                <span>Antrean Poli</span>
                <strong>34</strong>
              </div>
              <div>
                <span>Resep Proses</span>
                <strong>19</strong>
              </div>
              <div>
                <span>Kunjungan IGD</span>
                <strong>11</strong>
              </div>
            </div>
          </div>

          <div className="timeline">
            <div>
              <span />
              <p>Fondasi Infrastruktur Development</p>
              <strong>Selesai</strong>
            </div>
            <div>
              <span />
              <p>Frontend Product Shell</p>
              <strong>Aktif</strong>
            </div>
            <div>
              <span />
              <p>Login & Dashboard Operasional</p>
              <strong>Berikutnya</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="section-card module-section">
          <div className="section-heading">
            <p>Ruang Lingkup Awal</p>
            <h2>Modul Prioritas SIMRS</h2>
          </div>

          <div className="module-grid">
            {modules.map((module) => (
              <article className="module-card" key={module.title}>
                <h3>{module.title}</h3>
                <p>{module.desc}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="section-card principle-section">
          <div className="section-heading">
            <p>Prinsip Pengembangan</p>
            <h2>Arah Produk</h2>
          </div>

          <ul>
            {principles.map((principle) => (
              <li key={principle}>{principle}</li>
            ))}
          </ul>

          <div className="next-step">
            <small>Next Development Step</small>
            <strong>Bangun Login Page dan Layout Dashboard SIMRS</strong>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App
