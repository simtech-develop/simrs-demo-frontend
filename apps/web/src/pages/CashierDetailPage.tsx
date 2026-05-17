import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { getRegistrationById } from '../lib/registrationStorage'
import { getOutpatientExamByRegistrationId } from '../lib/outpatientStorage'
import { getPharmacyOrderByRegistrationId } from '../lib/pharmacyStorage'
import {
  ensureCashierBill,
  updateCashierBillStatus,
  type CashierBill,
} from '../lib/cashierStorage'

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function CashierDetailPage() {
  const { id } = useParams()
  const registration = id ? getRegistrationById(id) : undefined
  const exam = id ? getOutpatientExamByRegistrationId(id) : undefined
  const pharmacyOrder = id ? getPharmacyOrderByRegistrationId(id) : undefined

  const consultationFee = 75000
  const medicineFee =
    exam?.prescriptions.reduce((total, _item) => total + 15000, 0) ?? 0

  const [bill, setBill] = useState<CashierBill | undefined>(() =>
    id ? ensureCashierBill(id, consultationFee, medicineFee) : undefined,
  )

  if (!registration || !exam || !bill) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Tagihan Tidak Ditemukan</small>
          <h1>Data transaksi kasir belum tersedia</h1>
          <p>
            Pastikan pasien telah menyelesaikan pemeriksaan rawat jalan.
          </p>
          <Link to="/kasir">Kembali ke Kasir</Link>
        </section>
      </main>
    )
  }

  const changeStatus = (
    status: 'Belum Dibayar' | 'Sedang Diproses' | 'Lunas',
  ) => {
    const updated = updateCashierBillStatus(registration.id, status)

    if (updated) {
      setBill(updated)
    }
  }

  return (
    <main className="cashier-detail-app">
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
          <Link to="/farmasi">Farmasi</Link>
          <Link className="active" to="/kasir">
            Kasir
          </Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Detail transaksi pasien</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="cashier-detail-content">
        <header className="cashier-detail-header">
          <div className="cashier-detail-heading">
            <Link className="breadcrumb-link" to="/kasir">
              ← Kembali ke Daftar Kasir
            </Link>

            <small>Detail Tagihan Pasien</small>
            <h1>{registration.patient}</h1>
            <p>
              Rincian biaya pelayanan pasien berdasarkan pemeriksaan poli dan
              resep yang tercatat pada alur farmasi.
            </p>
          </div>

          <div className="cashier-detail-status-card">
            <span>Status Pembayaran</span>
            <strong>{bill.status}</strong>
            <p>{registration.rm}</p>
          </div>
        </header>

        <section className="cashier-workflow-panel">
          <div>
            <small>Workflow Pembayaran</small>
            <h2>Perbarui Status Transaksi</h2>
            <p>
              Simulasikan proses verifikasi tagihan dan penyelesaian pembayaran
              pasien di kasir.
            </p>
          </div>

          <div className="cashier-workflow-actions">
            <button
              type="button"
              className={
                bill.status === 'Sedang Diproses' ? 'active-action' : ''
              }
              onClick={() => changeStatus('Sedang Diproses')}
            >
              Proses Pembayaran
            </button>

            <button
              type="button"
              className={bill.status === 'Lunas' ? 'active-action paid' : ''}
              onClick={() => changeStatus('Lunas')}
            >
              Tandai Lunas
            </button>

            <button
              type="button"
              className={
                bill.status === 'Belum Dibayar'
                  ? 'active-action pending'
                  : 'pending'
              }
              onClick={() => changeStatus('Belum Dibayar')}
            >
              Kembalikan ke Belum Dibayar
            </button>
          </div>
        </section>

        <section className="cashier-patient-banner">
          <article>
            <span>No. RM</span>
            <strong>{registration.rm}</strong>
          </article>

          <article>
            <span>Pasien</span>
            <strong>{registration.patient}</strong>
          </article>

          <article>
            <span>Layanan</span>
            <strong>{registration.service}</strong>
          </article>

          <article>
            <span>Status Farmasi</span>
            <strong>{pharmacyOrder?.status ?? 'Tidak Ada Resep'}</strong>
          </article>
        </section>

        <section className="cashier-detail-grid">
          <article className="cashier-detail-panel">
            <div className="cashier-panel-title">
              <small>Komponen Biaya</small>
              <h2>Rincian Tagihan</h2>
            </div>

            <div className="billing-item-list">
              <div>
                <span>Biaya Konsultasi Poli</span>
                <strong>{formatRupiah(bill.consultationFee)}</strong>
              </div>

              <div>
                <span>Biaya Obat Farmasi</span>
                <strong>{formatRupiah(bill.medicineFee)}</strong>
              </div>

              <div className="billing-total-row">
                <span>Total Pembayaran</span>
                <strong>{formatRupiah(bill.totalAmount)}</strong>
              </div>
            </div>
          </article>

          <article className="cashier-detail-panel">
            <div className="cashier-panel-title">
              <small>Rincian Obat</small>
              <h2>Komponen Farmasi</h2>
            </div>

            <div className="cashier-medicine-list">
              {exam.prescriptions.length === 0 ? (
                <p>Tidak terdapat resep obat.</p>
              ) : (
                exam.prescriptions.map((item) => (
                  <div key={item.id}>
                    <span>{item.medicineName}</span>
                    <strong>{item.quantity}</strong>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default CashierDetailPage
