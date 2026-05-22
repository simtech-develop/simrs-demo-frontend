import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
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

type ApiMedicalRecord = {
  id: string
  registrationId: string
  diagnosis?: string | null
}

type UiPharmacyStatus =
  | 'Menunggu Diproses'
  | 'Sedang Disiapkan'
  | 'Obat Siap Diambil'
  | 'Selesai'
  | 'Dibatalkan'

function displayValue(value?: string | null) {
  return value && value.trim() !== '' ? value : '-'
}

function mapStatus(status: PharmacyOrderStatus): UiPharmacyStatus {
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
      return 'Menunggu Diproses'
  }
}

function mapUiStatusToApi(status: UiPharmacyStatus): PharmacyOrderStatus {
  switch (status) {
    case 'Menunggu Diproses':
      return 'PENDING'
    case 'Sedang Disiapkan':
      return 'PROCESSING'
    case 'Obat Siap Diambil':
      return 'READY'
    case 'Selesai':
      return 'COMPLETED'
    case 'Dibatalkan':
      return 'CANCELED'
    default:
      return 'PENDING'
  }
}

function PharmacyDetailPage() {
  const { id } = useParams()

  const [order, setOrder] = useState<ApiPharmacyOrder | null>(null)
  const [diagnosis, setDiagnosis] = useState<string>('-')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [updateError, setUpdateError] = useState('')

  const loadPharmacyDetail = async () => {
    if (!id) {
      setLoadError('ID registrasi tidak tersedia.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError('')

    try {
      const pharmacyOrderResponse = await api.get<ApiPharmacyOrder>(
        `/pharmacy-orders/registration/${id}`,
      )

      setOrder(pharmacyOrderResponse)

      try {
        const medicalRecordResponse = await api.get<ApiMedicalRecord>(
          `/medical-records/registration/${id}`,
        )

        setDiagnosis(medicalRecordResponse.diagnosis ?? '-')
      } catch {
        setDiagnosis('-')
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memuat detail resep farmasi dari backend.'

      setOrder(null)
      setDiagnosis('-')
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPharmacyDetail()
  }, [id])

  const changeStatus = async (status: UiPharmacyStatus) => {
    if (!order) {
      return
    }

    setIsUpdating(true)
    setUpdateError('')

    try {
      const response = await api.patch<
        ApiPharmacyOrder,
        { status: PharmacyOrderStatus }
      >(`/pharmacy-orders/${order.id}/status`, {
        status: mapUiStatusToApi(status),
      })

      setOrder(response)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memperbarui status resep farmasi.'

      setUpdateError(message)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Memuat Resep</small>
          <h1>Detail farmasi sedang disiapkan</h1>
          <p>Mengambil order resep pasien dari backend SIMRS.</p>
        </section>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Resep Tidak Ditemukan</small>
          <h1>Data resep farmasi belum tersedia</h1>
          <p>
            {loadError ||
              'Pastikan dokter sudah menyimpan pemeriksaan dan mengisi resep obat.'}
          </p>
          <Link to="/farmasi">Kembali ke Farmasi</Link>
        </section>
      </main>
    )
  }

  const registration = order.registration
  const patient = registration.patient
  const clinic = registration.clinic
  const uiStatus = mapStatus(order.status)

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
          <Link to="/ruang-tindakan">Ruang Tindakan</Link>
          <Link to="/rawat-inap">Rawat Inap</Link>
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
            <h1>{patient.fullName}</h1>
            <p>
              Rincian resep elektronik yang telah terbentuk sebagai order
              farmasi pada backend SIMRS Demo.
            </p>
          </div>

          <div className="pharmacy-detail-status-card">
            <span>Status Resep</span>
            <strong>{uiStatus}</strong>
            <p>{patient.medicalRecordNo}</p>
          </div>
        </header>

        {updateError && (
          <section className="registration-warning-banner">
            <strong>Status resep belum diperbarui.</strong>
            <span>{updateError}</span>
          </section>
        )}

        <section className="pharmacy-workflow-panel">
          <div>
            <small>Workflow Farmasi</small>
            <h2>Perbarui Status Resep</h2>
            <p>
              Proses order farmasi dari antrean resep masuk hingga obat siap
              diserahkan kepada pasien.
            </p>
          </div>

          <div className="pharmacy-workflow-actions">
            <button
              type="button"
              disabled={isUpdating}
              className={
                uiStatus === 'Sedang Disiapkan' ? 'active-action' : ''
              }
              onClick={() => void changeStatus('Sedang Disiapkan')}
            >
              Mulai Siapkan Obat
            </button>

            <button
              type="button"
              disabled={isUpdating}
              className={
                uiStatus === 'Obat Siap Diambil'
                  ? 'active-action ready'
                  : ''
              }
              onClick={() => void changeStatus('Obat Siap Diambil')}
            >
              Tandai Obat Siap
            </button>

            <button
              type="button"
              disabled={isUpdating}
              className={
                uiStatus === 'Menunggu Diproses'
                  ? 'active-action pending'
                  : 'pending'
              }
              onClick={() => void changeStatus('Menunggu Diproses')}
            >
              Kembalikan ke Menunggu
            </button>
          </div>
        </section>

        <section className="pharmacy-patient-banner">
          <article>
            <span>No. RM</span>
            <strong>{patient.medicalRecordNo}</strong>
          </article>

          <article>
            <span>Pasien</span>
            <strong>{patient.fullName}</strong>
          </article>

          <article>
            <span>Poli</span>
            <strong>{clinic.name}</strong>
          </article>

          <article>
            <span>Diagnosis</span>
            <strong>{displayValue(diagnosis)}</strong>
          </article>
        </section>

        <section className="pharmacy-detail-panel">
          <div className="pharmacy-panel-title">
            <small>Item Resep</small>
            <h2>Daftar Obat</h2>
          </div>

          <div className="prescription-detail-list">
            {order.items.map((item, index) => (
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
                  <strong>{displayValue(item.instruction)}</strong>
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
