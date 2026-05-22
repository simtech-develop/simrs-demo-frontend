import { Link } from 'react-router'

function OperatingRoomPage() {
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
          <span>Ruang tindakan dan operasi</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="outpatient-content">
        <header className="outpatient-header">
          <div>
            <small>Modul Lanjutan IGD</small>
            <h1>Ruang Tindakan / Operasi</h1>
            <p>
              Modul ini digunakan untuk pasien IGD yang membutuhkan tindakan
              segera, prosedur operatif, atau penanganan khusus setelah triage.
            </p>
          </div>

          <div className="outpatient-unit-card">
            <span>Status Modul</span>
            <strong>Persiapan</strong>
            <p>Terhubung dari disposisi IGD</p>
          </div>
        </header>

        <section className="outpatient-stat-grid">
          <article className="outpatient-stat-card">
            <span>Pasien Menunggu Tindakan</span>
            <strong>1</strong>
            <small>Dari disposisi IGD merah</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Prioritas</span>
            <strong>Merah</strong>
            <small>Butuh penanganan segera</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Status Ruang</span>
            <strong>Siapkan</strong>
            <small>Koordinasi tindakan/operasi</small>
          </article>
        </section>

        <section className="outpatient-panel">
          <div className="outpatient-panel-title">
            <small>Persiapan Tindakan</small>
            <h2>Checklist Ruang Tindakan / Operasi</h2>
          </div>

          <div className="outpatient-process-flow">
            <div>
              <span>01</span>
              <strong>Validasi Pasien</strong>
              <p>Pastikan identitas pasien, nomor RM, penjamin, dan status IGD.</p>
            </div>

            <div>
              <span>02</span>
              <strong>Persetujuan Tindakan</strong>
              <p>Siapkan informed consent dan catatan DPJP/operator.</p>
            </div>

            <div>
              <span>03</span>
              <strong>Persiapan Tim & Ruang</strong>
              <p>Koordinasikan dokter, perawat, ruang tindakan/IBS, alat, dan BMHP.</p>
            </div>

            <div>
              <span>04</span>
              <strong>Pasca Tindakan</strong>
              <p>Lanjutkan ke rawat inap, observasi IGD, kasir, farmasi, atau RME.</p>
            </div>
          </div>
        </section>

        <section className="outpatient-panel operating-next-panel">
          <div className="outpatient-panel-title">
            <small>Arah Lanjutan</small>
            <h2>Setelah Tindakan / Operasi</h2>
          </div>

          <div className="operating-next-grid">
            <Link className="operating-next-card primary" to="/rawat-inap">
              <span>01</span>
              <strong>Lanjut Rawat Inap</strong>
              <p>Pasien dipindahkan ke ruang perawatan untuk monitoring lanjutan.</p>
            </Link>

            <Link className="operating-next-card" to="/igd">
              <span>02</span>
              <strong>Kembali Observasi IGD</strong>
              <p>Pasien dipantau kembali di IGD sebelum keputusan akhir.</p>
            </Link>

            <Link className="operating-next-card" to="/farmasi">
              <span>03</span>
              <strong>Lanjut Farmasi</strong>
              <p>Obat dan BMHP diteruskan ke farmasi untuk pelayanan berikutnya.</p>
            </Link>

            <Link className="operating-next-card" to="/kasir">
              <span>04</span>
              <strong>Lanjut Kasir</strong>
              <p>Tindakan, alat, dan layanan masuk proses administrasi biaya.</p>
            </Link>

            <Link className="operating-next-card" to="/rme">
              <span>05</span>
              <strong>Lihat RME</strong>
              <p>Catatan triage, tindakan, dan disposisi masuk rekam medis.</p>
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}

export default OperatingRoomPage
