import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../lib/api'

type CashierBillStatus = 'UNPAID' | 'PAID' | 'CANCELED'

type ApiCashierBill = {
  id: string
  billNo: string
  status: CashierBillStatus
  totalAmount: number
  paidAmount: number
  note?: string | null
  paidAt?: string | null
  createdAt: string
  updatedAt: string
  registrationId: string
  items: Array<{
    id: string
    itemName: string
    itemType: string
    quantity: number
    unitPrice: number
    subtotal: number
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

type ApiPharmacyOrder = {
  id: string
  registrationId: string
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELED'
}

type CashierTransactionRow = {
  id: string
  registrationId: string
  rm: string
  patient: string
  service: string
  pharmacyStatus: string
  totalAmount: number
  status: string
  statusClass: string
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

function mapPharmacyStatus(
  status?: ApiPharmacyOrder['status'],
): string {
  switch (status) {
    case 'PENDING':
      return 'Menunggu Diproses'
    case 'PROCESSING':
      return 'Sedang Disiapkan'
    case 'READY':
      return 'Obat Siap Diambil'
    case 'COMPLETED':
      return 'Selesai'
    case 'CANCELED':
      return 'Dibatalkan'
    default:
      return 'Tidak Ada Resep'
  }
}

function CashierPage() {
  const [transactions, setTransactions] = useState<CashierTransactionRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadCashierTransactions = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const [bills, pharmacyOrders] = await Promise.all([
        api.get<ApiCashierBill[]>('/cashier-bills'),
        api.get<ApiPharmacyOrder[]>('/pharmacy-orders'),
      ])

      const pharmacyOrderMap = new Map(
        pharmacyOrders.map((order) => [order.registrationId, order]),
      )

      const rows = bills.map((bill) => {
        const billStatus = mapBillStatus(bill.status)
        const pharmacyOrder = pharmacyOrderMap.get(bill.registrationId)

        return {
          id: bill.id,
          registrationId: bill.registrationId,
          rm: bill.registration.patient.medicalRecordNo,
          patient: bill.registration.patient.fullName,
          service: bill.registration.clinic.name,
          pharmacyStatus: mapPharmacyStatus(pharmacyOrder?.status),
          totalAmount: bill.totalAmount,
          status: billStatus.label,
          statusClass: billStatus.className,
        }
      })

      setTransactions(rows)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memuat data tagihan kasir dari backend.'

      setTransactions([])
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadCashierTransactions()
  }, [])

  const totalBills = transactions.length

  const unpaidBills = transactions.filter(
    (item) => item.status === 'Belum Dibayar',
  ).length

  const paidBills = transactions.filter(
    (item) => item.status === 'Lunas',
  ).length

  const totalRevenue = useMemo(
    () =>
      transactions
        .filter((item) => item.status === 'Lunas')
        .reduce((total, item) => total + item.totalAmount, 0),
    [transactions],
  )

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
          <Link to="/ruang-tindakan">Ruang Tindakan</Link>
          <Link to="/rawat-inap">Rawat Inap</Link>
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
              Monitoring tagihan pelayanan pasien yang telah terbentuk dan
              tersimpan pada backend SIMRS Demo.
            </p>
          </div>

          <div className="cashier-status-card">
            <span>Status Modul</span>
            <strong>Aktif</strong>
            <p>Backend Integrated</p>
          </div>
        </header>

        {loadError && (
          <section className="registration-warning-banner">
            <strong>Tagihan kasir belum dapat dimuat.</strong>
            <span>{loadError}</span>
          </section>
        )}

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
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="empty-table-state">
                        Memuat tagihan pasien dari backend...
                      </td>
                    </tr>
                  )}

                  {!isLoading && transactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-table-state">
                        Belum ada tagihan pasien yang terbentuk.
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.rm}</td>
                        <td>{transaction.patient}</td>
                        <td>{transaction.service}</td>
                        <td>{transaction.pharmacyStatus}</td>
                        <td>{formatRupiah(transaction.totalAmount)}</td>
                        <td>
                          <span
                            className={`cashier-status-pill ${transaction.statusClass}`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            className="detail-registration-link"
                            to={`/kasir/detail/${transaction.registrationId}`}
                          >
                            Lihat Tagihan
                          </Link>
                        </td>
                      </tr>
                    ))}
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
                <strong>Layanan Selesai</strong>
                <p>Komponen biaya layanan dibentuk sebagai tagihan.</p>
              </div>

              <div>
                <span>02</span>
                <strong>Resep Farmasi</strong>
                <p>Status order farmasi ikut terlihat pada antrean kasir.</p>
              </div>

              <div>
                <span>03</span>
                <strong>Pembayaran Kasir</strong>
                <p>Status tagihan diperbarui sampai lunas.</p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default CashierPage
