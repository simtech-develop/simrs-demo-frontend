import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../lib/api'

type PharmacyOrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELED'

type ApiPharmacyOrder = {
  id: string
  status: PharmacyOrderStatus
  note?: string | null
  createdAt: string
  updatedAt: string
  registrationId: string
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
    registrationNo: string
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

type PharmacyOrderRow = {
  id: string
  registrationId: string
  rm: string
  patient: string
  clinic: string
  itemCount: number
  status: string
  statusClass: string
}

function mapStatus(status: PharmacyOrderStatus) {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Menunggu Diproses',
        className: '',
      }
    case 'PROCESSING':
      return {
        label: 'Sedang Disiapkan',
        className: 'preparing',
      }
    case 'READY':
      return {
        label: 'Obat Siap Diambil',
        className: 'ready',
      }
    case 'COMPLETED':
      return {
        label: 'Selesai',
        className: 'ready',
      }
    case 'CANCELED':
      return {
        label: 'Dibatalkan',
        className: '',
      }
    default:
      return {
        label: 'Menunggu Diproses',
        className: '',
      }
  }
}

function mapOrder(order: ApiPharmacyOrder): PharmacyOrderRow {
  const status = mapStatus(order.status)

  return {
    id: order.id,
    registrationId: order.registrationId,
    rm: order.registration.patient.medicalRecordNo,
    patient: order.registration.patient.fullName,
    clinic: order.registration.clinic.name,
    itemCount: order.items.length,
    status: status.label,
    statusClass: status.className,
  }
}

function PharmacyPage() {
  const [orders, setOrders] = useState<PharmacyOrderRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadPharmacyOrders = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const response = await api.get<ApiPharmacyOrder[]>('/pharmacy-orders')
      setOrders(response.map(mapOrder))
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memuat order farmasi dari backend.'

      setOrders([])
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPharmacyOrders()
  }, [])

  const totalOrders = orders.length

  const totalMedicines = useMemo(
    () => orders.reduce((total, order) => total + order.itemCount, 0),
    [orders],
  )

  const totalProcessed = orders.filter(
    (order) => order.status !== 'Menunggu Diproses',
  ).length

  const totalReady = orders.filter(
    (order) => order.status === 'Obat Siap Diambil',
  ).length

  return (
    <main className="pharmacy-app">
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
          <span>Antrean resep dari backend farmasi</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="pharmacy-content">
        <header className="pharmacy-header">
          <div>
            <small>Modul Penunjang Klinis</small>
            <h1>Farmasi</h1>
            <p>
              Monitoring resep elektronik yang telah terbentuk sebagai order
              farmasi dan siap diproses oleh unit farmasi rumah sakit.
            </p>
          </div>

          <div className="pharmacy-status-card">
            <span>Status Modul</span>
            <strong>Aktif</strong>
            <p>Backend Integrated</p>
          </div>
        </header>

        {loadError && (
          <section className="registration-warning-banner">
            <strong>Order farmasi belum dapat dimuat.</strong>
            <span>{loadError}</span>
          </section>
        )}

        <section className="pharmacy-stat-grid">
          <article className="pharmacy-stat-card">
            <span>Resep Masuk</span>
            <strong>{totalOrders}</strong>
            <small>Order aktif</small>
          </article>

          <article className="pharmacy-stat-card">
            <span>Total Item Obat</span>
            <strong>{totalMedicines}</strong>
            <small>Dari resep dokter</small>
          </article>

          <article className="pharmacy-stat-card">
            <span>Resep Diproses</span>
            <strong>{totalProcessed}</strong>
            <small>Sudah disentuh farmasi</small>
          </article>

          <article className="pharmacy-stat-card">
            <span>Obat Siap Diambil</span>
            <strong>{totalReady}</strong>
            <small>Siap serah pasien</small>
          </article>
        </section>

        <section className="pharmacy-layout">
          <article className="pharmacy-panel">
            <div className="pharmacy-panel-title">
              <small>Prescription Queue</small>
              <h2>Daftar Resep Masuk</h2>
            </div>

            <div className="pharmacy-table-wrapper">
              <table className="pharmacy-table">
                <thead>
                  <tr>
                    <th>No. RM</th>
                    <th>Nama Pasien</th>
                    <th>Poli</th>
                    <th>Item Obat</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={6} className="empty-table-state">
                        Memuat order farmasi dari backend...
                      </td>
                    </tr>
                  )}

                  {!isLoading && orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="empty-table-state">
                        Belum ada resep yang masuk dari pemeriksaan dokter.
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.rm}</td>
                        <td>{order.patient}</td>
                        <td>{order.clinic}</td>
                        <td>{order.itemCount} Obat</td>
                        <td>
                          <span
                            className={`pharmacy-status-pill ${order.statusClass}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            className="detail-registration-link"
                            to={`/farmasi/detail/${order.registrationId}`}
                          >
                            Lihat Resep
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="pharmacy-panel pharmacy-flow-panel">
            <div className="pharmacy-panel-title">
              <small>Alur Farmasi</small>
              <h2>Resep dari Dokter</h2>
            </div>

            <div className="pharmacy-process-flow">
              <div>
                <span>01</span>
                <strong>Pemeriksaan Selesai</strong>
                <p>Dokter menyimpan hasil pemeriksaan pasien.</p>
              </div>

              <div>
                <span>02</span>
                <strong>Order Farmasi Terbentuk</strong>
                <p>Resep diteruskan sebagai order farmasi backend.</p>
              </div>

              <div>
                <span>03</span>
                <strong>Proses Dispensing</strong>
                <p>Farmasi memverifikasi dan menyiapkan obat pasien.</p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default PharmacyPage
