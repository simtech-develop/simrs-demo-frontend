import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

const demoRoles = [
  'Admin SIMRS',
  'Petugas Pendaftaran',
  'Dokter Poli',
  'Farmasi',
  'Kasir',
]

function LoginPage() {
  const navigate = useNavigate()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate('/dashboard')
  }

  return (
    <main className="login-page">
      <section className="login-showcase">
        <Link to="/" className="login-back-link">
          ← Kembali ke halaman utama
        </Link>

        <div className="login-brand-block">
          <span className="login-brand-badge">SIMTECH Healthcare Platform</span>

          <h1>
            Akses Awal
            <strong> SIMRS Type D & C</strong>
          </h1>

          <p>
            Portal demonstrasi untuk memperlihatkan arah pengembangan SIMRS modern
            yang dibangun secara modular, berorientasi pelayanan rumah sakit, dan
            siap dikembangkan bertahap menuju sistem operasional yang utuh.
          </p>
        </div>

        <div className="login-highlight-grid">
          <article>
            <small>Demo Instance</small>
            <strong>RS SIMTECH Medika</strong>
            <span>Lingkungan pengembangan dan presentasi produk.</span>
          </article>

          <article>
            <small>Target Produk</small>
            <strong>Rumah Sakit Tipe D / C</strong>
            <span>Fondasi untuk pelayanan, klinis, farmasi, dan kasir.</span>
          </article>
        </div>

        <div className="login-role-panel">
          <small>Role yang Disiapkan</small>

          <div className="login-role-list">
            {demoRoles.map((role) => (
              <span key={role}>{role}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="login-form-area">
        <div className="login-card-pro">
          <header>
            <small>Secure Demo Access</small>
            <h2>Masuk ke Dashboard SIMRS</h2>
            <p>
              Gunakan akun demonstrasi sementara untuk melanjutkan ke rancangan
              awal dashboard operasional.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="login-form-pro">
            <label>
              <span>Username</span>
              <input
                type="text"
                defaultValue="admin.simrs"
                placeholder="Masukkan username"
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                defaultValue="demo-simrs"
                placeholder="Masukkan password"
              />
            </label>

            <div className="login-form-options">
              <label className="login-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Ingat sesi demonstrasi</span>
              </label>

              <span className="prototype-pill">Prototype Mode</span>
            </div>

            <button type="submit">Masuk ke Dashboard</button>
          </form>

          <aside className="demo-account-note">
            <strong>Akun demo sementara</strong>
            <div>
              <span>Username</span>
              <code>admin.simrs</code>
            </div>
            <div>
              <span>Password</span>
              <code>demo-simrs</code>
            </div>
          </aside>

          <p className="login-disclaimer">
            Autentikasi ini masih bersifat antarmuka demonstrasi. Mekanisme
            login, otorisasi berbasis role, dan integrasi backend akan dibangun
            pada fase berikutnya.
          </p>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
