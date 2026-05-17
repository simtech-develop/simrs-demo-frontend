import { Link } from 'react-router'
import { getRegistrations } from '../lib/registrationStorage'
import { getOutpatientExams } from '../lib/outpatientStorage'
import { getPharmacyOrders } from '../lib/pharmacyStorage'
import { getCashierBills } from '../lib/cashierStorage'
import { getEmergencyAssessments } from '../lib/emergencyStorage'

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function ReportPage() {
  const registrations = getRegistrations()
  const exams = getOutpatientExams()
  const pharmacyOrders = getPharmacyOrders()
  const cashierBills = getCashierBills()
  const emergencyAssessments = getEmergencyAssessments()

  const completedExams = exams.filter(
    (exam) => exam.status === 'Pemeriksaan Selesai',
  )

  const prescriptionsCreated = exams.filter(
    (exam) => exam.prescriptions.length > 0,
  )

  const readyMedicines = pharmacyOrders.filter(
    (order) => order.status === 'Obat Siap Diambil',
  )

  const paidBills = cashierBills.filter(
    (bill) => bill.status === 'Lunas',
  )

  const totalRevenue = paidBills.reduce(
    (total, bill) => total + bill.totalAmount,
    0,
  )

  const emergencyPatients = registrations.filter(
    (item) => item.service === 'IGD',
  )

  const completedTriage = emergencyAssessments.filter(
    (assessment) => assessment.status === 'Triage Selesai',
  )

  const redTriage = completedTriage.filter(
    (assessment) => assessment.triageLevel === 'Merah',
  )

  const yellowTriage = completedTriage.filter(
    (assessment) => assessment.triageLevel === 'Kuning',
  )

  const greenTriage = completedTriage.filter(
    (assessment) => assessment.triageLevel === 'Hijau',
  )

  const journeyMetrics = [
    {
      label: 'Registrasi Pasien',
      value: registrations.length,
      note: 'Data pasien masuk',
    },
    {
      label: 'Pemeriksaan Poli',
      value: completedExams.length,
      note: 'Pemeriksaan selesai',
    },
    {
      label: 'RME Rawat Jalan',
      value: completedExams.length,
      note: 'Catatan klinis tercatat',
    },
    {
      label: 'Resep Farmasi',
      value: prescriptionsCreated.length,
      note: 'Order obat terkirim',
    },
    {
      label: 'Obat Siap',
      value: readyMedicines.length,
      note: 'Selesai diproses farmasi',
    },
    {
      label: 'Pembayaran Lunas',
      value: paidBills.length,
      note: 'Transaksi selesai',
    },
  ]

  const latestBills = cashierBills
    .map((bill) => {
      const registration = registrations.find(
        (item) => item.id === bill.registrationId,
      )

      return {
        bill,
        registration,
      }
    })
    .filter((item) => item.registration)
    .slice(0, 5)

  return (
    <main className="report-app">
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
          <Link to="/kasir">Kasir</Link>
          <Link className="active" to="/laporan">
            Laporan
          </Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Ringkasan kinerja layanan demo</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="report-content">
        <header className="report-header">
          <div>
            <small>Executive Operational Report</small>
            <h1>Laporan Operasional SIMRS</h1>
            <p>
              Ringkasan terintegrasi dari alur pasien, pelayanan klinis,
              gawat darurat, farmasi, dan transaksi kasir pada prototype SIMRS
              Type D/C.
            </p>
          </div>

          <div className="report-status-card">
            <span>Status Data</span>
            <strong>Live Demo</strong>
            <p>Terhubung dari seluruh modul</p>
          </div>
        </header>

        <section className="report-highlight-grid">
          <article className="report-highlight-card">
            <span>Total Registrasi</span>
            <strong>{registrations.length}</strong>
            <small>Pasien pada data demo</small>
          </article>

          <article className="report-highlight-card">
            <span>Total Pemeriksaan</span>
            <strong>{completedExams.length}</strong>
            <small>Rawat jalan selesai</small>
          </article>

          <article className="report-highlight-card">
            <span>Triage IGD Selesai</span>
            <strong>{completedTriage.length}</strong>
            <small>Asesmen gawat darurat</small>
          </article>

          <article className="report-highlight-card revenue-card">
            <span>Pendapatan Tercatat</span>
            <strong>{formatRupiah(totalRevenue)}</strong>
            <small>Akumulasi pembayaran lunas</small>
          </article>
        </section>

        <section className="report-main-grid">
          <article className="report-panel">
            <div className="report-panel-title">
              <small>Service Journey Funnel</small>
              <h2>Perjalanan Pasien Rawat Jalan</h2>
            </div>

            <div className="journey-funnel-list">
              {journeyMetrics.map((item, index) => (
                <div className="journey-funnel-row" key={item.label}>
                  <div className="journey-step-number">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="journey-step-copy">
                    <strong>{item.label}</strong>
                    <span>{item.note}</span>
                  </div>

                  <div className="journey-step-value">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="report-panel report-coverage-panel">
            <div className="report-panel-title">
              <small>Coverage Summary</small>
              <h2>Cakupan Modul Aktif</h2>
            </div>

            <div className="coverage-list">
              <div>
                <span>Pendaftaran</span>
                <strong>Aktif</strong>
              </div>
              <div>
                <span>Rawat Jalan</span>
                <strong>Aktif</strong>
              </div>
              <div>
                <span>IGD</span>
                <strong>Aktif</strong>
              </div>
              <div>
                <span>RME</span>
                <strong>Aktif</strong>
              </div>
              <div>
                <span>Farmasi</span>
                <strong>Aktif</strong>
              </div>
              <div>
                <span>Kasir</span>
                <strong>Aktif</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="report-panel emergency-report-panel">
          <div className="report-panel-title">
            <small>Emergency Snapshot</small>
            <h2>Ringkasan Layanan IGD</h2>
          </div>

          <div className="emergency-report-grid">
            <article>
              <span>Pasien IGD</span>
              <strong>{emergencyPatients.length}</strong>
              <small>Registrasi layanan gawat darurat</small>
            </article>

            <article>
              <span>Triage Selesai</span>
              <strong>{completedTriage.length}</strong>
              <small>Asesmen telah difinalisasi</small>
            </article>

            <article className="red-emergency-report">
              <span>Prioritas Merah</span>
              <strong>{redTriage.length}</strong>
              <small>Urgensi tinggi</small>
            </article>

            <article className="yellow-emergency-report">
              <span>Prioritas Kuning</span>
              <strong>{yellowTriage.length}</strong>
              <small>Perlu penanganan cepat</small>
            </article>

            <article className="green-emergency-report">
              <span>Prioritas Hijau</span>
              <strong>{greenTriage.length}</strong>
              <small>Stabil / non-kritis</small>
            </article>
          </div>
        </section>

        <section className="report-panel latest-transaction-panel">
          <div className="report-panel-title">
            <small>Financial Snapshot</small>
            <h2>Transaksi Kasir Terakhir</h2>
          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>No. RM</th>
                  <th>Nama Pasien</th>
                  <th>Total Tagihan</th>
                  <th>Status Pembayaran</th>
                </tr>
              </thead>

              <tbody>
                {latestBills.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-table-state">
                      Belum ada transaksi kasir yang terbentuk.
                    </td>
                  </tr>
                ) : (
                  latestBills.map(({ bill, registration }) => (
                    <tr key={bill.registrationId}>
                      <td>{registration?.rm}</td>
                      <td>{registration?.patient}</td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}

export default ReportPage
