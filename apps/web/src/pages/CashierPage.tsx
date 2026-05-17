import { Link } from 'react-router'
import { getRegistrations } from '../lib/registrationStorage'
import { getOutpatientExams } from '../lib/outpatientStorage'
import { getPharmacyOrderByRegistrationId } from '../lib/pharmacyStorage'
import {
  ensureCashierBill,
  getCashierBillByRegistrationId,
} from '../lib/cashierStorage'

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function CashierPage() {
  const registrations = getRegistrations()
  const exams = getOutpatientExams()

  const cashierTransactions = exams
    .filter((exam) => exam.status === 'Pemeriksaan Selesai')
    .map((exam) => {
      const registration = registrations.find(
        (item) => item.id === exam.registrationId,
      )

      const pharmacyOrder = getPharmacyOrderByRegistrationId(
        exam.registrationId,
      )

      const consultationFee = 75000
      const medicineFee = exam.prescriptions.reduce(
        (total, _item) => total + 15000,
        0,
      )

      const bill =
        getCashierBillByRegistrationId(exam.registrationId) ??
        ensureCashierBill(
          exam.registrationId,
          consultationFee,
          medicineFee,
        )

      return {
        exam,
        registration,
        pharmacyOrder,
        bill,
      }
    })
    .filter((item) => item.registration)

  const totalBills = cashierTransactions.length
  const unpaidBills = cashierTransactions.filter(
    (item) => item.bill.status === 'Belum Dibayar',
  ).length
  const paidBills = cashierTransactions.filter(
    (item) => item.bill.status === 'Lunas',
  ).length
  const totalRevenue = cashierTransactions
    .filter((item) => item.bill.status === 'Lunas')
    .reduce((total, item) => total + item.bill.totalAmount, 0)

  return (
    <main className="cashier-app">
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
          <span>Transaksi layanan dan obat pasien</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="cashier-content">
        <header className="cashier-header">
          <div>
            <small>Modul Finansial</small>
            <h1>Kasir</h1>
            <p>
              Monitoring tagihan pelayanan pasien yang terbentuk dari proses
              pemeriksaan rawat jalan dan resep farmasi.
            </p>
          </div>

          <div className="cashier-status-card">
            <span>Status Modul</span>
            <strong>Aktif</strong>
            <p>Terhubung dari layanan poli</p>
          </div>
        </header>

        <section className="cashier-stat-grid">
          <article className="cashier-stat-card">
            <span>Total Tagihan</span>
            <strong>{totalBills}</strong>
            <small>Transaksi pasien</small>
          </article>

          <article className="cashier-stat-card">
            <span>Belum Dibayar</span>
            <strong>{unpaidBills}</strong>
            <small>Menunggu proses kasir</small>
          </article>

          <article className="cashier-stat-card">
            <span>Sudah Lunas</span>
            <strong>{paidBills}</strong>
            <small>Pembayaran selesai</small>
          </article>

          <article className="cashier-stat-card">
            <span>Pendapatan Demo</span>
            <strong>{formatRupiah(totalRevenue)}</strong>
            <small>Akumulasi lunas</small>
          </article>
        </section>

        <section className="cashier-layout">
          <article className="cashier-panel">
            <div className="cashier-panel-title">
              <small>Billing Queue</small>
              <h2>Daftar Tagihan Pasien</h2>
            </div>

            <div className="cashier-table-wrapper">
              <table className="cashier-table">
                <thead>
                  <tr>
                    <th>No. RM</th>
                    <th>Nama Pasien</th>
                    <th>Layanan</th>
                    <th>Farmasi</th>
                    <th>Total Tagihan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {cashierTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-table-state">
                        Belum ada tagihan pasien yang terbentuk.
                      </td>
                    </tr>
                  ) : (
                    cashierTransactions.map(
                      ({ exam, registration, pharmacyOrder, bill }) => (
                        <tr key={exam.registrationId}>
                          <td>{registration?.rm}</td>
                          <td>{registration?.patient}</td>
                          <td>{registration?.service}</td>
                          <td>
                            {pharmacyOrder?.status ?? 'Tidak Ada Resep'}
                          </td>
                          <td>{formatRupiah(bill.totalAmount)}</td>
                          <td>
                            <span
                              className={`cashier-status-pill ${
                                bill.status === 'Sedang Diproses'
                                  ? 'processing'
                                  : bill.status === 'Lunas'
                                    ? 'paid'
                                    : ''
                              }`}
                            >
                              {bill.status}
                            </span>
                          </td>
                          <td>
                            <Link
                              className="detail-registration-link"
                              to={`/kasir/detail/${exam.registrationId}`}
                            >
                              Lihat Tagihan
                            </Link>
                          </td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="cashier-panel cashier-flow-panel">
            <div className="cashier-panel-title">
              <small>Alur Kasir</small>
              <h2>Pembentukan Tagihan</h2>
            </div>

            <div className="cashier-process-flow">
              <div>
                <span>01</span>
                <strong>Pemeriksaan Selesai</strong>
                <p>Biaya konsultasi layanan terbentuk.</p>
              </div>

              <div>
                <span>02</span>
                <strong>Resep Farmasi</strong>
                <p>Item obat menambah komponen tagihan pasien.</p>
              </div>

              <div>
                <span>03</span>
                <strong>Pembayaran Kasir</strong>
                <p>Status transaksi diperbarui sampai lunas.</p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default CashierPage
