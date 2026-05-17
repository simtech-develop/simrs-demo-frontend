import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { getRegistrationById } from '../lib/registrationStorage'
import { getOutpatientExamByRegistrationId } from '../lib/outpatientStorage'
import {
  ensurePharmacyOrder,
  updatePharmacyOrderStatus,
  type PharmacyOrder,
} from '../lib/pharmacyStorage'

function PharmacyDetailPage() {
  const { id } = useParams()
  const registration = id ? getRegistrationById(id) : undefined
  const exam = id ? getOutpatientExamByRegistrationId(id) : undefined

  const [order, setOrder] = useState<PharmacyOrder | undefined>(() =>
    id ? ensurePharmacyOrder(id) : undefined,
  )

  if (!registration || !exam || exam.prescriptions.length === 0 || !order) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Resep Tidak Ditemukan</small>
          <h1>Data resep farmasi belum tersedia</h1>
          <p>
            Pastikan dokter sudah menyimpan pemeriksaan dan mengisi resep obat.
          </p>
          <Link to="/farmasi">Kembali ke Farmasi</Link>
        </section>
      </main>
    )
  }

  const changeStatus = (
    status: 'Menunggu Diproses' | 'Sedang Disiapkan' | 'Obat Siap Diambil',
  ) => {
    const updated = updatePharmacyOrderStatus(registration.id, status)
    setOrder(updated)
  }

  return (
    <main className="pharmacy-detail-app">
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
          <span>Detail resep pasien</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="pharmacy-detail-content">
        <header className="pharmacy-detail-header">
          <div className="pharmacy-detail-heading">
            <Link className="breadcrumb-link" to="/farmasi">
              ← Kembali ke Daftar Farmasi
            </Link>

            <small>Detail Resep Farmasi</small>
            <h1>{registration.patient}</h1>
            <p>
              Rincian resep elektronik yang berasal dari pemeriksaan rawat jalan.
            </p>
          </div>

          <div className="pharmacy-detail-status-card">
            <span>Status Resep</span>
            <strong>{order.status}</strong>
            <p>{registration.rm}</p>
          </div>
        </header>

        <section className="pharmacy-workflow-panel">
          <div>
            <small>Workflow Farmasi</small>
            <h2>Perbarui Status Resep</h2>
            <p>
              Simulasikan proses verifikasi dan dispensing obat oleh petugas
              farmasi.
            </p>
          </div>

          <div className="pharmacy-workflow-actions">
            <button
              type="button"
              className={
                order.status === 'Sedang Disiapkan' ? 'active-action' : ''
              }
              onClick={() => changeStatus('Sedang Disiapkan')}
            >
              Mulai Siapkan Obat
            </button>

            <button
              type="button"
              className={
                order.status === 'Obat Siap Diambil' ? 'active-action ready' : ''
              }
              onClick={() => changeStatus('Obat Siap Diambil')}
            >
              Tandai Obat Siap
            </button>

            <button
              type="button"
              className={
                order.status === 'Menunggu Diproses'
                  ? 'active-action pending'
                  : 'pending'
              }
              onClick={() => changeStatus('Menunggu Diproses')}
            >
              Kembalikan ke Menunggu
            </button>
          </div>
        </section>

        <section className="pharmacy-patient-banner">
          <article>
            <span>No. RM</span>
            <strong>{registration.rm}</strong>
          </article>

          <article>
            <span>Pasien</span>
            <strong>{registration.patient}</strong>
          </article>

          <article>
            <span>Poli</span>
            <strong>{registration.service}</strong>
          </article>

          <article>
            <span>Diagnosis</span>
            <strong>{exam.workingDiagnosis}</strong>
          </article>
        </section>

        <section className="pharmacy-detail-panel">
          <div className="pharmacy-panel-title">
            <small>Item Resep</small>
            <h2>Daftar Obat</h2>
          </div>

          <div className="prescription-detail-list">
            {exam.prescriptions.map((item, index) => (
              <article className="prescription-detail-card" key={item.id}>
                <div className="prescription-number">{index + 1}</div>

                <div>
                  <span>Nama Obat</span>
                  <strong>{item.medicineName}</strong>
                </div>

                <div>
                  <span>Dosis</span>
                  <strong>{item.dosage}</strong>
                </div>

                <div>
                  <span>Frekuensi</span>
                  <strong>{item.frequency}</strong>
                </div>

                <div>
                  <span>Jumlah</span>
                  <strong>{item.quantity}</strong>
                </div>

                <div className="wide-prescription-note">
                  <span>Aturan Pakai</span>
                  <strong>{item.instruction || '-'}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

export default PharmacyDetailPage
