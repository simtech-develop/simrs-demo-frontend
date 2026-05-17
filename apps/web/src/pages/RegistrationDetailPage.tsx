import { useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  getRegistrationById,
  updateRegistrationStatus,
  type DemoRegistration,
} from '../lib/registrationStorage'

function displayValue(value?: string) {
  return value && value.trim() !== '' ? value : '-'
}

function RegistrationDetailPage() {
  const { id } = useParams()
  const [registration, setRegistration] = useState<DemoRegistration | undefined>(
    () => (id ? getRegistrationById(id) : undefined),
  )

  if (!registration) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Data Tidak Ditemukan</small>
          <h1>Registrasi pasien tidak tersedia</h1>
          <p>
            Data yang dipilih belum tersedia atau sudah tidak ada pada data demo.
          </p>
          <Link to="/pendaftaran">Kembali ke Modul Pendaftaran</Link>
        </section>
      </main>
    )
  }

  const printTicket = () => {
    window.print()
  }

  const changeStatus = (status: DemoRegistration['status']) => {
    const updated = updateRegistrationStatus(registration.id, status)

    if (updated) {
      setRegistration(updated)
    }
  }

  return (
    <main className="registration-detail-app">
      <aside className="dashboard-sidebar-pro">
        <div className="sidebar-brand-pro">
          <span>SIMRS</span>
          <strong>SIMTECH</strong>
          <p>Type D / C Demo Platform</p>
        </div>

        <nav className="sidebar-menu-pro">
          <Link to="/dashboard">Dashboard</Link>
          <Link className="active" to="/pendaftaran">
            Pendaftaran
          </Link>
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
          <span>Detail registrasi pasien</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="registration-detail-content">
        <header className="registration-detail-header">
          <div className="registration-detail-heading">
            <Link className="breadcrumb-link" to="/pendaftaran">
              ← Kembali ke Daftar Pendaftaran
            </Link>

            <small>Detail Registrasi</small>
            <h1>{registration.patient}</h1>
            <p>
              Ringkasan data registrasi, antrean, dan tujuan layanan pasien pada
              prototype SIMRS Type D/C.
            </p>
          </div>

          <div className="registration-status-summary-card">
            <span>Status Pendaftaran</span>
            <strong>{registration.status}</strong>
            <p>{registration.queue}</p>
          </div>
        </header>

        <section className="registration-ticket-banner">
          <div>
            <small>Bukti Registrasi Demo</small>
            <strong>{registration.rm}</strong>
            <p>
              Antrean <b>{registration.queue}</b> untuk layanan{' '}
              <b>{registration.service}</b>.
            </p>
          </div>

          <button type="button" onClick={printTicket}>
            Cetak Bukti Antrean Demo
          </button>
        </section>

        <section className="registration-action-panel">
          <div>
            <small>Workflow Registrasi</small>
            <h2>Perbarui Status Pelayanan</h2>
            <p>
              Ubah status registrasi untuk menunjukkan progres layanan loket
              pendaftaran hingga pasien diteruskan ke unit pelayanan.
            </p>
          </div>

          <div className="registration-action-buttons">
            <button
              type="button"
              className={
                registration.status === 'Terverifikasi'
                  ? 'active-action'
                  : ''
              }
              onClick={() => changeStatus('Terverifikasi')}
            >
              Verifikasi Registrasi
            </button>

            <button
              type="button"
              className={
                registration.status === 'Dilayani'
                  ? 'active-action'
                  : ''
              }
              onClick={() => changeStatus('Dilayani')}
            >
              Tandai Dilayani
            </button>

            <button
              type="button"
              className={
                registration.status === 'Menunggu'
                  ? 'active-action waiting-action'
                  : 'waiting-action'
              }
              onClick={() => changeStatus('Menunggu')}
            >
              Kembalikan ke Menunggu
            </button>
          </div>
        </section>

        <section className="registration-detail-grid">
          <article className="detail-panel">
            <div className="detail-panel-title">
              <small>Identitas Pasien</small>
              <h2>Data Utama</h2>
            </div>

            <div className="detail-item-grid">
              <div>
                <span>No. Rekam Medis</span>
                <strong>{registration.rm}</strong>
              </div>
              <div>
                <span>NIK</span>
                <strong>{registration.nik}</strong>
              </div>
              <div>
                <span>Nama Pasien</span>
                <strong>{registration.patient}</strong>
              </div>
              <div>
                <span>Jenis Kelamin</span>
                <strong>{displayValue(registration.gender)}</strong>
              </div>
              <div>
                <span>Tempat Lahir</span>
                <strong>{displayValue(registration.birthPlace)}</strong>
              </div>
              <div>
                <span>Tanggal Lahir</span>
                <strong>{displayValue(registration.birthDate)}</strong>
              </div>
            </div>
          </article>

          <article className="detail-panel">
            <div className="detail-panel-title">
              <small>Administrasi</small>
              <h2>Kunjungan & Penjamin</h2>
            </div>

            <div className="detail-item-grid">
              <div>
                <span>Jenis Pasien</span>
                <strong>{registration.type}</strong>
              </div>
              <div>
                <span>Penjamin</span>
                <strong>{displayValue(registration.guarantor)}</strong>
              </div>
              <div>
                <span>Nomor Kartu Penjamin</span>
                <strong>{displayValue(registration.guarantorNumber)}</strong>
              </div>
              <div>
                <span>Tujuan Layanan</span>
                <strong>{registration.service}</strong>
              </div>
              <div>
                <span>Jenis Kunjungan</span>
                <strong>{displayValue(registration.visitType)}</strong>
              </div>
              <div>
                <span>Status Registrasi</span>
                <strong>{registration.status}</strong>
              </div>
            </div>
          </article>

          <article className="detail-panel wide-panel">
            <div className="detail-panel-title">
              <small>Kontak & Keterangan</small>
              <h2>Informasi Tambahan</h2>
            </div>

            <div className="detail-long-grid">
              <div>
                <span>Nomor HP</span>
                <strong>{displayValue(registration.phone)}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{displayValue(registration.email)}</strong>
              </div>
              <div>
                <span>Alamat</span>
                <strong>
                  {displayValue(
                    [
                      registration.address,
                      registration.district,
                      registration.city,
                    ]
                      .filter(Boolean)
                      .join(', '),
                  )}
                </strong>
              </div>
              <div>
                <span>Keluhan Awal</span>
                <strong>{displayValue(registration.initialComplaint)}</strong>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default RegistrationDetailPage
