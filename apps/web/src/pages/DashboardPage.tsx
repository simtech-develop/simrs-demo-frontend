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
  createdAt: string
  updatedAt: string
  registration: {
    patient: {
      fullName: string
    }
    clinic: {
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
  createdAt: string
  updatedAt: string
  registration: {
    patient: {
      fullName: string
    }
    clinic: {
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
  registration: {
    patient: {
      fullName: string
    }
    clinic: {
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
  createdAt: string
  updatedAt: string
  registration: {
    patient: {
      fullName: string
    }
    clinic: {
      name: string
    }
  }
}

type DashboardActivity = {
  time: string
  unit: string
  activity: string
  status: string
  timestamp: string
}

const quickModules = [
  {
    label: 'Pendaftaran Pasien',
    path: '/pendaftaran',
  },
  {
    label: 'Rawat Jalan',
    path: '/rawat-jalan',
  },
  {
    label: 'IGD',
    path: '/igd',
  },
  {
    label: 'Rekam Medis Elektronik',
    path: '/rme',
  },
  {
    label: 'Farmasi',
    path: '/farmasi',
  },
  {
    label: 'Kasir',
    path: '/kasir',
  },
]

const operationalReadiness = [
  { label: 'Registrasi Pasien & Antrean', status: 'Completed' },
  { label: 'Rawat Jalan & Pemeriksaan', status: 'Completed' },
  { label: 'RME Rawat Jalan & IGD', status: 'Completed' },
  { label: 'Farmasi & Kasir Terintegrasi', status: 'Completed' },
]

function toDateKey(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function formatActivityTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function mapPharmacyStatus(status: PharmacyOrderStatus) {
  switch (status) {
    case 'PENDING':
      return 'Menunggu'
    case 'PROCESSING':
      return 'Proses'
    case 'READY':
      return 'Siap'
    case 'COMPLETED':
      return 'Selesai'
    case 'CANCELED':
      return 'Batal'
    default:
      return 'Aktif'
  }
}

function mapCashierStatus(status: CashierBillStatus) {
  switch (status) {
    case 'UNPAID':
      return 'Pending'
    case 'PAID':
      return 'Lunas'
    case 'CANCELED':
      return 'Batal'
    default:
      return 'Aktif'
  }
}

function mapEmergencyStatus(status: EmergencyAssessmentStatus) {
  switch (status) {
    case 'WAITING_TRIAGE':
      return 'Menunggu'
    case 'IN_ASSESSMENT':
      return 'Asesmen'
    case 'TRIAGE_COMPLETED':
      return 'Selesai'
    default:
      return 'Aktif'
  }
}

function DashboardPage() {
  const [registrations, setRegistrations] = useState<ApiRegistration[]>([])
  const [medicalRecords, setMedicalRecords] = useState<ApiMedicalRecord[]>([])
  const [emergencyAssessments, setEmergencyAssessments] = useState<
    ApiEmergencyAssessment[]
  >([])
  const [pharmacyOrders, setPharmacyOrders] = useState<ApiPharmacyOrder[]>([])
  const [cashierBills, setCashierBills] = useState<ApiCashierBill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadDashboardData = async () => {
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
          : 'Dashboard gagal memuat data backend.'

      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboardData()
  }, [])

  const todayKey = new Date().toISOString().slice(0, 10)

  const todayRegistrations = registrations.filter(
    (registration) => toDateKey(registration.visitDate) === todayKey,
  ).length

  const activeOutpatientQueue = registrations.filter(
    (registration) =>
      registration.clinic.code !== 'IGD' &&
      (registration.status === 'WAITING' ||
        registration.status === 'IN_SERVICE'),
  ).length

  const pendingPharmacyOrders = pharmacyOrders.filter(
    (order) =>
      order.status === 'PENDING' || order.status === 'PROCESSING',
  ).length

  const unpaidCashierBills = cashierBills.filter(
    (bill) => bill.status === 'UNPAID',
  ).length

  const totalPaidRevenue = cashierBills
    .filter((bill) => bill.status === 'PAID')
    .reduce((total, bill) => total + bill.paidAmount, 0)

  const summaryCards = [
    {
      label: 'Pasien Terdaftar Hari Ini',
      value: String(todayRegistrations),
      note: `${registrations.length} total registrasi backend`,
    },
    {
      label: 'Antrean Poli Aktif',
      value: String(activeOutpatientQueue),
      note: 'Pasien rawat jalan menunggu layanan',
    },
    {
      label: 'Resep Menunggu Farmasi',
      value: String(pendingPharmacyOrders),
      note: 'Pending dan sedang diproses',
    },
    {
      label: 'Tagihan Kasir Pending',
      value: String(unpaidCashierBills),
      note: `Pendapatan lunas ${formatRupiah(totalPaidRevenue)}`,
    },
  ]

  const serviceActivities = useMemo(() => {
    const registrationActivities: DashboardActivity[] = registrations.map(
      (registration) => ({
        time: formatActivityTime(registration.createdAt),
        unit: 'Pendaftaran',
        activity: `${registration.patient.fullName} terdaftar ke ${registration.clinic.name}`,
        status:
          registration.clinic.code === 'IGD' ? 'IGD Masuk' : 'Registrasi',
        timestamp: registration.createdAt,
      }),
    )

    const rmeActivities: DashboardActivity[] = medicalRecords.map((record) => ({
      time: formatActivityTime(record.updatedAt),
      unit: 'RME',
      activity: `Rekam medis ${record.registration.patient.fullName} tersimpan`,
      status: 'Tersimpan',
      timestamp: record.updatedAt,
    }))

    const emergencyActivities: DashboardActivity[] = emergencyAssessments.map(
      (assessment) => ({
        time: formatActivityTime(assessment.updatedAt),
        unit: 'IGD',
        activity: `Triage ${assessment.registration.patient.fullName} diperbarui`,
        status: mapEmergencyStatus(assessment.status),
        timestamp: assessment.updatedAt,
      }),
    )

    const pharmacyActivities: DashboardActivity[] = pharmacyOrders.map(
      (order) => ({
        time: formatActivityTime(order.updatedAt),
        unit: 'Farmasi',
        activity: `Order resep ${order.registration.patient.fullName} aktif`,
        status: mapPharmacyStatus(order.status),
        timestamp: order.updatedAt,
      }),
    )

    const cashierActivities: DashboardActivity[] = cashierBills.map((bill) => ({
      time: formatActivityTime(bill.updatedAt),
      unit: 'Kasir',
      activity: `Tagihan ${bill.billNo} pasien ${bill.registration.patient.fullName}`,
      status: mapCashierStatus(bill.status),
      timestamp: bill.updatedAt,
    }))

    return [
      ...registrationActivities,
      ...rmeActivities,
      ...emergencyActivities,
      ...pharmacyActivities,
      ...cashierActivities,
    ]
      .sort(
        (left, right) =>
          new Date(right.timestamp).getTime() -
          new Date(left.timestamp).getTime(),
      )
      .slice(0, 6)
  }, [
    registrations,
    medicalRecords,
    emergencyAssessments,
    pharmacyOrders,
    cashierBills,
  ])

  const backendCoverage = [
    {
      label: 'Pendaftaran',
      status: registrations.length > 0 ? 'Live Data' : 'Ready',
    },
    {
      label: 'RME',
      status:
        medicalRecords.length > 0 || emergencyAssessments.length > 0
          ? 'Live Data'
          : 'Ready',
    },
    {
      label: 'Farmasi',
      status: pharmacyOrders.length > 0 ? 'Live Data' : 'Ready',
    },
    {
      label: 'Kasir',
      status: cashierBills.length > 0 ? 'Live Data' : 'Ready',
    },
  ]

  return (
    <main className="dashboard-app">
      <aside className="dashboard-sidebar-pro">
        <div className="sidebar-brand-pro">
          <span>SIMRS</span>
          <strong>SIMTECH</strong>
          <p>Type D / C Demo Platform</p>
        </div>

        <nav className="sidebar-menu-pro">
          <Link className="active" to="/dashboard">
            Dashboard
          </Link>
          <Link to="/pendaftaran">Pendaftaran</Link>
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
          <span>Environment presentasi produk</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="dashboard-content-pro">
        <header className="dashboard-header-pro">
          <div>
            <small>Dashboard Operasional</small>
            <h1>Selamat datang di SIMRS Type D/C</h1>
            <p>
              Ringkasan operasional aktual yang membaca data registrasi, layanan
              klinis, farmasi, dan kasir langsung dari backend SIMRS Demo.
            </p>
          </div>

          <div className="operator-profile-card">
            <span>Operator Aktif</span>
            <strong>Admin SIMRS</strong>
            <p>{isLoading ? 'Memuat Data...' : 'Backend Terhubung'}</p>
          </div>
        </header>

        {loadError && (
          <section className="registration-warning-banner">
            <strong>Dashboard belum dapat memuat seluruh data.</strong>
            <span>{loadError}</span>
          </section>
        )}

        <section className="dashboard-summary-grid">
          {summaryCards.map((card) => (
            <article className="summary-card-pro" key={card.label}>
              <span>{card.label}</span>
              <strong>{isLoading ? '...' : card.value}</strong>
              <small>{card.note}</small>
            </article>
          ))}
        </section>

        <section className="dashboard-lower-grid">
          <article className="dashboard-panel-pro module-access-panel">
            <div className="dashboard-panel-title">
              <small>Quick Access</small>
              <h2>Modul Prioritas SIMRS</h2>
            </div>

            <div className="module-access-grid">
              {quickModules.map((module) => (
                <Link key={module.label} to={module.path}>
                  {module.label}
                </Link>
              ))}
            </div>
          </article>

          <article className="dashboard-panel-pro activity-monitor-panel">
            <div className="dashboard-panel-title">
              <small>Live Service Activity</small>
              <h2>Aktivitas Pelayanan</h2>
            </div>

            <div className="service-activity-list">
              {isLoading && (
                <div className="service-activity-row">
                  <span>--:--</span>
                  <strong>Sistem</strong>
                  <p>Memuat aktivitas pelayanan dari backend...</p>
                  <em>Loading</em>
                </div>
              )}

              {!isLoading && serviceActivities.length === 0 && (
                <div className="service-activity-row">
                  <span>--:--</span>
                  <strong>Sistem</strong>
                  <p>Belum ada aktivitas layanan tercatat.</p>
                  <em>Empty</em>
                </div>
              )}

              {!isLoading &&
                serviceActivities.map((item) => (
                  <div
                    className="service-activity-row"
                    key={`${item.timestamp}-${item.unit}-${item.activity}`}
                  >
                    <span>{item.time}</span>
                    <strong>{item.unit}</strong>
                    <p>{item.activity}</p>
                    <em>{item.status}</em>
                  </div>
                ))}
            </div>
          </article>
        </section>

        <section className="dashboard-bottom-grid">
          <article className="dashboard-panel-pro readiness-panel">
            <div className="dashboard-panel-title">
              <small>Development Readiness</small>
              <h2>Status Pengembangan</h2>
            </div>

            <div className="readiness-list">
              {operationalReadiness.map((item) => (
                <div className="readiness-row" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.status}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-panel-pro focus-panel">
            <div className="dashboard-panel-title">
              <small>Backend Coverage</small>
              <h2>Modul Terhubung</h2>
            </div>

            <div className="readiness-list">
              {backendCoverage.map((item) => (
                <div className="readiness-row" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.status}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default DashboardPage
