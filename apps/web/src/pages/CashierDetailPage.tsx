import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
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

type UiBillStatus = 'Belum Dibayar' | 'Lunas' | 'Dibatalkan'

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function mapBillStatus(status: CashierBillStatus): UiBillStatus {
  switch (status) {
    case 'UNPAID':
      return 'Belum Dibayar'
    case 'PAID':
      return 'Lunas'
    case 'CANCELED':
      return 'Dibatalkan'
    default:
      return 'Belum Dibayar'
  }
}

function mapUiBillStatus(status: UiBillStatus): CashierBillStatus {
  switch (status) {
    case 'Belum Dibayar':
      return 'UNPAID'
    case 'Lunas':
      return 'PAID'
    case 'Dibatalkan':
      return 'CANCELED'
    default:
      return 'UNPAID'
  }
}

function mapPharmacyStatus(status?: ApiPharmacyOrder['status']) {
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

function CashierDetailPage() {
  const { id } = useParams()

  const [bill, setBill] = useState<ApiCashierBill | null>(null)
  const [pharmacyStatus, setPharmacyStatus] = useState('Tidak Ada Resep')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [updateError, setUpdateError] = useState('')

  const loadCashierDetail = async () => {
    if (!id) {
      setLoadError('ID registrasi tidak tersedia.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError('')

    try {
      const billResponse = await api.get<ApiCashierBill>(
        `/cashier-bills/registration/${id}`,
      )

      setBill(billResponse)

      try {
        const pharmacyResponse = await api.get<ApiPharmacyOrder>(
          `/pharmacy-orders/registration/${id}`,
        )

        setPharmacyStatus(mapPharmacyStatus(pharmacyResponse.status))
      } catch {
        setPharmacyStatus('Tidak Ada Resep')
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memuat detail tagihan kasir dari backend.'

      setBill(null)
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadCashierDetail()
  }, [id])

  const uiStatus = bill ? mapBillStatus(bill.status) : 'Belum Dibayar'

  const changeStatus = async (status: UiBillStatus) => {
    if (!bill) {
      return
    }

    setIsUpdating(true)
    setUpdateError('')

    try {
      const response = await api.patch<
        ApiCashierBill,
        {
          status: CashierBillStatus
          paidAmount?: number
        }
      >(`/cashier-bills/${bill.id}/status`, {
        status: mapUiBillStatus(status),
        paidAmount: status === 'Lunas' ? bill.totalAmount : 0,
      })

      setBill(response)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memperbarui status pembayaran.'

      setUpdateError(message)
    } finally {
      setIsUpdating(false)
    }
  }

  const consultationItems = useMemo(
    () =>
      bill?.items.filter(
        (item) =>
          item.itemType === 'SERVICE' || item.itemType === 'REGISTRATION',
      ) ?? [],
    [bill],
  )

  const pharmacyItems = useMemo(
    () => bill?.items.filter((item) => item.itemType === 'PHARMACY') ?? [],
    [bill],
  )

  if (isLoading) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Memuat Tagihan</small>
          <h1>Detail kasir sedang disiapkan</h1>
          <p>Mengambil transaksi tagihan pasien dari backend SIMRS.</p>
        </section>
      </main>
    )
  }

  if (!bill) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Tagihan Tidak Ditemukan</small>
          <h1>Data transaksi kasir belum tersedia</h1>
          <p>
            {loadError ||
              'Pastikan tagihan kasir untuk registrasi ini sudah terbentuk.'}
          </p>
          <Link to="/kasir">Kembali ke Kasir</Link>
        </section>
      </main>
    )
  }

  const registration = bill.registration
  const patient = registration.patient
  const clinic = registration.clinic

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
            <h1>{patient.fullName}</h1>
            <p>
              Rincian biaya pelayanan pasien yang telah tercatat sebagai bill
              kasir pada backend SIMRS Demo.
            </p>
          </div>

          <div className="cashier-detail-status-card">
            <span>Status Pembayaran</span>
            <strong>{uiStatus}</strong>
            <p>{patient.medicalRecordNo}</p>
          </div>
        </header>

        {updateError && (
          <section className="registration-warning-banner">
            <strong>Status pembayaran belum diperbarui.</strong>
            <span>{updateError}</span>
          </section>
        )}

        <section className="cashier-workflow-panel">
          <div>
            <small>Workflow Pembayaran</small>
            <h2>Perbarui Status Transaksi</h2>
            <p>
              Kasir dapat menyelesaikan pembayaran, mengembalikan transaksi ke
              status belum dibayar, atau membatalkan tagihan.
            </p>
          </div>

          <div className="cashier-workflow-actions">
            <button
              type="button"
              disabled={isUpdating}
              className={uiStatus === 'Lunas' ? 'active-action paid' : ''}
              onClick={() => void changeStatus('Lunas')}
            >
              Tandai Lunas
            </button>

            <button
              type="button"
              disabled={isUpdating}
              className={
                uiStatus === 'Belum Dibayar'
                  ? 'active-action pending'
                  : 'pending'
              }
              onClick={() => void changeStatus('Belum Dibayar')}
            >
              Kembalikan ke Belum Dibayar
            </button>

            <button
              type="button"
              disabled={isUpdating}
              className={uiStatus === 'Dibatalkan' ? 'active-action' : ''}
              onClick={() => void changeStatus('Dibatalkan')}
            >
              Batalkan Tagihan
            </button>
          </div>
        </section>

        <section className="cashier-patient-banner">
          <article>
            <span>No. RM</span>
            <strong>{patient.medicalRecordNo}</strong>
          </article>

          <article>
            <span>Pasien</span>
            <strong>{patient.fullName}</strong>
          </article>

          <article>
            <span>Layanan</span>
            <strong>{clinic.name}</strong>
          </article>

          <article>
            <span>Status Farmasi</span>
            <strong>{pharmacyStatus}</strong>
          </article>
        </section>

        <section className="cashier-detail-grid">
          <article className="cashier-detail-panel">
            <div className="cashier-panel-title">
              <small>Komponen Biaya</small>
              <h2>Rincian Tagihan</h2>
            </div>

            <div className="billing-item-list">
              {bill.items.map((item) => (
                <div key={item.id}>
                  <span>
                    {item.itemName} × {item.quantity}
                  </span>
                  <strong>{formatRupiah(item.subtotal)}</strong>
                </div>
              ))}

              <div className="billing-total-row">
                <span>Total Pembayaran</span>
                <strong>{formatRupiah(bill.totalAmount)}</strong>
              </div>
            </div>
          </article>

          <article className="cashier-detail-panel">
            <div className="cashier-panel-title">
              <small>Ringkasan Pembayaran</small>
              <h2>Status Finansial</h2>
            </div>

            <div className="billing-item-list">
              <div>
                <span>Nomor Bill</span>
                <strong>{bill.billNo}</strong>
              </div>

              <div>
                <span>Total Tagihan</span>
                <strong>{formatRupiah(bill.totalAmount)}</strong>
              </div>

              <div>
                <span>Sudah Dibayar</span>
                <strong>{formatRupiah(bill.paidAmount)}</strong>
              </div>

              <div>
                <span>Tanggal Bayar</span>
                <strong>{formatDate(bill.paidAt)}</strong>
              </div>
            </div>
          </article>

          <article className="cashier-detail-panel">
            <div className="cashier-panel-title">
              <small>Komponen Layanan</small>
              <h2>Administrasi & Poli</h2>
            </div>

            <div className="cashier-medicine-list">
              {consultationItems.length === 0 ? (
                <p>Tidak terdapat biaya layanan.</p>
              ) : (
                consultationItems.map((item) => (
                  <div key={item.id}>
                    <span>{item.itemName}</span>
                    <strong>{formatRupiah(item.subtotal)}</strong>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="cashier-detail-panel">
            <div className="cashier-panel-title">
              <small>Komponen Farmasi</small>
              <h2>Biaya Obat</h2>
            </div>

            <div className="cashier-medicine-list">
              {pharmacyItems.length === 0 ? (
                <p>Tidak terdapat item biaya farmasi.</p>
              ) : (
                pharmacyItems.map((item) => (
                  <div key={item.id}>
                    <span>{item.itemName}</span>
                    <strong>{formatRupiah(item.subtotal)}</strong>
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
