import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../lib/api'

type RegistrationStatus =
  | 'WAITING'
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'CANCELED'

type ApiRegistration = {
  id: string
  registrationNo: string
  visitDate: string
  queueNumber: number
  chiefComplaint?: string | null
  status: RegistrationStatus
  createdAt: string
  updatedAt: string
  patient: {
    id: string
    medicalRecordNo: string
    fullName: string
  }
  clinic: {
    id: string
    code: string
    name: string
  }
}

type ApiMedicalRecord = {
  id: string
  registrationId: string
  diagnosis?: string | null
  prescriptionNote?: string | null
  examinedAt: string
  createdAt: string
  updatedAt: string
  registration: {
    id: string
    patient: {
      id: string
      medicalRecordNo: string
      fullName: string
    }
    clinic: {
      id: string
      code: string
      name: string
    }
  }
}

type EmergencyAssessmentStatus =
  | 'WAITING_TRIAGE'
  | 'IN_ASSESSMENT'
  | 'TRIAGE_COMPLETED'

type EmergencyTriageLevel = 'RED' | 'YELLOW' | 'GREEN'

type ApiEmergencyAssessment = {
  id: string
  registrationId: string
  triageLevel: EmergencyTriageLevel
  status: EmergencyAssessmentStatus
  assessedAt?: string | null
  createdAt: string
  updatedAt: string
  registration: {
    id: string
    patient: {
      id: string
      medicalRecordNo: string
      fullName: string
    }
    clinic: {
      id: string
      code: string
      name: string
    }
  }
}

type PharmacyOrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELED'

type ApiPharmacyOrder = {
  id: string
  registrationId: string
  status: PharmacyOrderStatus
  createdAt: string
  updatedAt: string
  items: Array<{
    id: string
    medicineName: string
    dosage: string
    frequency: string
    quantity: string
    instruction?: string | null
  }>
  registration: {
    id: string
    patient: {
      id: string
      medicalRecordNo: string
      fullName: string
    }
    clinic: {
      id: string
      code: string
      name: string
    }
  }
}

type CashierBillStatus = 'UNPAID' | 'PAID' | 'CANCELED'

type ApiCashierBill = {
  id: string
  billNo: string
  status: CashierBillStatus
  totalAmount: number
  paidAmount: number
  paidAt?: string | null
  createdAt: string
  updatedAt: string
  registrationId: string
  registration: {
    id: string
    patient: {
      id: string
      medicalRecordNo: string
      fullName: string
    }
    clinic: {
      id: string
      code: string
      name: string
    }
  }
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function mapBillStatus(status: CashierBillStatus) {
  switch (status) {
    case 'UNPAID':
      return {
        label: 'Belum Dibayar',
        className: '',
      }
    case 'PAID':
      return {
        label: 'Lunas',
        className: 'paid',
      }
    case 'CANCELED':
      return {
        label: 'Dibatalkan',
        className: '',
      }
    default:
      return {
        label: 'Belum Dibayar',
        className: '',
      }
  }
}

function ReportPage() {
  const [registrations, setRegistrations] = useState<ApiRegistration[]>([])
  const [medicalRecords, setMedicalRecords] = useState<ApiMedicalRecord[]>([])
  const [emergencyAssessments, setEmergencyAssessments] = useState<
    ApiEmergencyAssessment[]
  >([])
  const [pharmacyOrders, setPharmacyOrders] = useState<ApiPharmacyOrder[]>([])
  const [cashierBills, setCashierBills] = useState<ApiCashierBill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadReportData = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const [
        registrationsResponse,
        medicalRecordsResponse,
        emergencyAssessmentsResponse,
        pharmacyOrdersResponse,
        cashierBillsResponse,
      ] = await Promise.all([
        api.get<ApiRegistration[]>('/registrations'),
        api.get<ApiMedicalRecord[]>('/medical-records'),
        api.get<ApiEmergencyAssessment[]>('/emergency-assessments'),
        api.get<ApiPharmacyOrder[]>('/pharmacy-orders'),
        api.get<ApiCashierBill[]>('/cashier-bills'),
      ])

      setRegistrations(registrationsResponse)
      setMedicalRecords(medicalRecordsResponse)
      setEmergencyAssessments(emergencyAssessmentsResponse)
      setPharmacyOrders(pharmacyOrdersResponse)
      setCashierBills(cashierBillsResponse)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Laporan gagal memuat data backend.'

      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadReportData()
  }, [])

  const outpatientRegistrations = registrations.filter(
    (registration) => registration.clinic.code !== 'IGD',
  )

  const emergencyPatients = registrations.filter(
    (registration) => registration.clinic.code === 'IGD',
  )

  const completedOutpatientRecords = medicalRecords.length

  const completedTriage = emergencyAssessments.filter(
    (assessment) => assessment.status === 'TRIAGE_COMPLETED',
  )

  const redTriage = completedTriage.filter(
    (assessment) => assessment.triageLevel === 'RED',
  )

  const yellowTriage = completedTriage.filter(
    (assessment) => assessment.triageLevel === 'YELLOW',
  )

  const greenTriage = completedTriage.filter(
    (assessment) => assessment.triageLevel === 'GREEN',
  )

  const prescriptionsCreated = pharmacyOrders.length

  const readyMedicines = pharmacyOrders.filter(
    (order) => order.status === 'READY' || order.status === 'COMPLETED',
  )

  const pendingMedicines = pharmacyOrders.filter(
    (order) => order.status === 'PENDING' || order.status === 'PROCESSING',
  )

  const paidBills = cashierBills.filter((bill) => bill.status === 'PAID')
  const unpaidBills = cashierBills.filter((bill) => bill.status === 'UNPAID')

  const totalRevenue = paidBills.reduce(
    (total, bill) => total + bill.paidAmount,
    0,
  )

  const totalOutstanding = unpaidBills.reduce(
    (total, bill) => total + bill.totalAmount,
    0,
  )

  const journeyMetrics = [
    {
      label: 'Registrasi Pasien',
      value: registrations.length,
      note: 'Total kunjungan tercatat',
    },
    {
      label: 'Rawat Jalan',
      value: outpatientRegistrations.length,
      note: 'Registrasi layanan poli',
    },
    {
      label: 'RME Rawat Jalan',
      value: completedOutpatientRecords,
      note: 'Catatan klinis tersimpan',
    },
    {
      label: 'Resep Farmasi',
      value: prescriptionsCreated,
      note: 'Order farmasi terbentuk',
    },
    {
      label: 'Obat Siap / Selesai',
      value: readyMedicines.length,
      note: 'Dispensing farmasi lanjut',
    },
    {
      label: 'Pembayaran Lunas',
      value: paidBills.length,
      note: 'Transaksi kasir selesai',
    },
  ]

  const latestBills = useMemo(
    () =>
      [...cashierBills]
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime(),
        )
        .slice(0, 5),
    [cashierBills],
  )

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
          <Link to="/ruang-tindakan">Ruang Tindakan</Link>
          <Link to="/rawat-inap">Rawat Inap</Link>
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
              Ringkasan terintegrasi dari alur pasien, pelayanan klinis, IGD,
              farmasi, dan transaksi kasir berdasarkan data backend SIMRS Demo.
            </p>
          </div>

          <div className="report-status-card">
            <span>Status Data</span>
            <strong>{isLoading ? 'Loading' : 'Live Backend'}</strong>
            <p>Terhubung dari seluruh modul</p>
          </div>
        </header>

        {loadError && (
          <section className="registration-warning-banner">
            <strong>Laporan belum dapat dimuat sempurna.</strong>
            <span>{loadError}</span>
          </section>
        )}

        <section className="report-highlight-grid">
          <article className="report-highlight-card">
            <span>Total Registrasi</span>
            <strong>{isLoading ? '...' : registrations.length}</strong>
            <small>Seluruh registrasi backend</small>
          </article>

          <article className="report-highlight-card">
            <span>Total RME Rawat Jalan</span>
            <strong>{isLoading ? '...' : completedOutpatientRecords}</strong>
            <small>Catatan klinis pemeriksaan poli</small>
          </article>

          <article className="report-highlight-card">
            <span>Triage IGD Selesai</span>
            <strong>{isLoading ? '...' : completedTriage.length}</strong>
            <small>Asesmen gawat darurat final</small>
          </article>

          <article className="report-highlight-card revenue-card">
            <span>Pendapatan Tercatat</span>
            <strong>{isLoading ? '...' : formatRupiah(totalRevenue)}</strong>
            <small>Akumulasi pembayaran lunas</small>
          </article>
        </section>

        <section className="report-main-grid">
          <article className="report-panel">
            <div className="report-panel-title">
              <small>Service Journey Funnel</small>
              <h2>Perjalanan Pasien Terintegrasi</h2>
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
                    {isLoading ? '...' : item.value}
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
              <strong>{isLoading ? '...' : emergencyPatients.length}</strong>
              <small>Registrasi layanan gawat darurat</small>
            </article>

            <article>
              <span>Triage Selesai</span>
              <strong>{isLoading ? '...' : completedTriage.length}</strong>
              <small>Asesmen telah difinalisasi</small>
            </article>

            <article className="red-emergency-report">
              <span>Prioritas Merah</span>
              <strong>{isLoading ? '...' : redTriage.length}</strong>
              <small>Urgensi tinggi</small>
            </article>

            <article className="yellow-emergency-report">
              <span>Prioritas Kuning</span>
              <strong>{isLoading ? '...' : yellowTriage.length}</strong>
              <small>Perlu penanganan cepat</small>
            </article>

            <article className="green-emergency-report">
              <span>Prioritas Hijau</span>
              <strong>{isLoading ? '...' : greenTriage.length}</strong>
              <small>Stabil / non-kritis</small>
            </article>
          </div>
        </section>

        <section className="report-main-grid">
          <article className="report-panel">
            <div className="report-panel-title">
              <small>Pharmacy Snapshot</small>
              <h2>Status Order Farmasi</h2>
            </div>

            <div className="coverage-list">
              <div>
                <span>Total Order Farmasi</span>
                <strong>{isLoading ? '...' : pharmacyOrders.length}</strong>
              </div>
              <div>
                <span>Menunggu / Diproses</span>
                <strong>{isLoading ? '...' : pendingMedicines.length}</strong>
              </div>
              <div>
                <span>Siap / Selesai</span>
                <strong>{isLoading ? '...' : readyMedicines.length}</strong>
              </div>
            </div>
          </article>

          <article className="report-panel">
            <div className="report-panel-title">
              <small>Financial Snapshot</small>
              <h2>Status Tagihan Kasir</h2>
            </div>

            <div className="coverage-list">
              <div>
                <span>Total Bill Kasir</span>
                <strong>{isLoading ? '...' : cashierBills.length}</strong>
              </div>
              <div>
                <span>Belum Dibayar</span>
                <strong>{isLoading ? '...' : unpaidBills.length}</strong>
              </div>
              <div>
                <span>Piutang Outstanding</span>
                <strong>
                  {isLoading ? '...' : formatRupiah(totalOutstanding)}
                </strong>
              </div>
            </div>
          </article>
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
                  <th>No. Bill</th>
                  <th>No. RM</th>
                  <th>Nama Pasien</th>
                  <th>Total Tagihan</th>
                  <th>Status Pembayaran</th>
                </tr>
              </thead>

              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="empty-table-state">
                      Memuat transaksi kasir backend...
                    </td>
                  </tr>
                )}

                {!isLoading && latestBills.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-table-state">
                      Belum ada transaksi kasir yang terbentuk.
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  latestBills.map((bill) => {
                    const billStatus = mapBillStatus(bill.status)

                    return (
                      <tr key={bill.id}>
                        <td>{bill.billNo}</td>
                        <td>
                          {bill.registration.patient.medicalRecordNo}
                        </td>
                        <td>{bill.registration.patient.fullName}</td>
                        <td>{formatRupiah(bill.totalAmount)}</td>
                        <td>
                          <span
                            className={`cashier-status-pill ${billStatus.className}`}
                          >
                            {billStatus.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}

export default ReportPage
