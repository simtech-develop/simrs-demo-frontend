import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'

type PharmacyStatus =
  | 'Order Masuk'
  | 'Diverifikasi Farmasi'
  | 'Obat Disiapkan'
  | 'Obat Siap Diambil'
  | 'Obat Diserahkan'
  | 'Tidak Diambil'

type BillingItem = {
  source: string
  category: string
  itemName: string
  quantity: number
  unitPrice: number
}

type CashierPayment = {
  patientName?: string
  medicalRecordNo?: string
  guarantor?: 'Umum' | 'BPJS' | 'Asuransi Lain'
  insuranceNumber?: string
  paymentStatus?: string
  medicinePaymentApproval?: string
  isMedicinePaymentApproved?: boolean
  items?: BillingItem[]
  savedAt?: string
}

type PharmacyQueuePatient = {
  id: string
  medicalRecordNo: string
  patientName: string
  sourceUnit: string
  guarantor: string
  cashierStatus: string
  medicineApproval: string
  pharmacyStatus: PharmacyStatus
  medicineItems: BillingItem[]
}

const cashierPaymentStorageKey = 'simrs_cashier_payment_demo'
const pharmacyQueueStorageKey = 'simrs_pharmacy_queue_demo'
const pharmacyDispenseStorageKey = 'simrs_pharmacy_dispense_demo'

const readStorage = <T,>(key: string): T | null => {
  try {
    const rawValue = window.localStorage.getItem(key)

    if (!rawValue) {
      return null
    }

    return JSON.parse(rawValue) as T
  } catch (error) {
    console.error(`Gagal membaca ${key}:`, error)
    return null
  }
}

const isMedicineItem = (item: BillingItem) =>
  item.category.toLowerCase().includes('obat') ||
  item.source.toLowerCase().includes('farmasi')


function PharmacyPage() {
  const [cashierPayment, setCashierPayment] = useState<CashierPayment | null>(
    null,
  )
  const [selectedQueuePatientId, setSelectedQueuePatientId] =
    useState<string>('cashier-patient')
  const [pharmacyStatus, setPharmacyStatus] =
    useState<PharmacyStatus>('Order Masuk')
  const [pharmacyNote, setPharmacyNote] = useState(
    'Order obat dibaca dari data kasir setelah pembayaran atau verifikasi penjamin selesai.',
  )
  const [isSaved, setIsSaved] = useState(false)

  const reloadPharmacyQueue = () => {
    setCashierPayment(readStorage<CashierPayment>(cashierPaymentStorageKey))
    setIsSaved(false)
  }

  useEffect(() => {
    reloadPharmacyQueue()
  }, [])

  const pharmacyQueuePatients = useMemo<PharmacyQueuePatient[]>(() => {
    const queueFromCashier =
      readStorage<PharmacyQueuePatient[]>(pharmacyQueueStorageKey) || []

    if (queueFromCashier.length > 0) {
      return queueFromCashier.filter((patient) => patient.medicineItems.length > 0)
    }

    if (!cashierPayment) {
      return []
    }

    const medicineItems = (cashierPayment.items || []).filter(isMedicineItem)

    if (medicineItems.length === 0) {
      return []
    }

    const medicineApproved =
      cashierPayment.isMedicinePaymentApproved ||
      cashierPayment.medicinePaymentApproval === 'Setuju Bayar Obat' ||
      cashierPayment.guarantor === 'BPJS' ||
      cashierPayment.guarantor === 'Asuransi Lain'

    return [
      {
        id: `${cashierPayment.medicalRecordNo || 'RM'}-${cashierPayment.savedAt || Date.now()}`,
        medicalRecordNo: cashierPayment.medicalRecordNo || '-',
        patientName: cashierPayment.patientName || '-',
        sourceUnit: 'Kasir',
        guarantor: cashierPayment.guarantor || 'Umum',
        cashierStatus: cashierPayment.paymentStatus || '-',
        medicineApproval: medicineApproved ? 'Disetujui' : 'Tidak Disetujui',
        pharmacyStatus: medicineApproved ? 'Order Masuk' : 'Tidak Diambil',
        medicineItems,
      },
    ]
  }, [cashierPayment])

  const selectedQueuePatient =
    pharmacyQueuePatients.find(
      (patient) => patient.id === selectedQueuePatientId,
    ) || pharmacyQueuePatients[0]

  const selectedMedicineItems = selectedQueuePatient?.medicineItems || []

  const canProcessPharmacy =
    selectedQueuePatient &&
    selectedQueuePatient.pharmacyStatus !== 'Tidak Diambil' &&
    selectedMedicineItems.length > 0

  const saveDispense = () => {
    if (!selectedQueuePatient) {
      return
    }

    const payload = {
      patientName: selectedQueuePatient.patientName,
      medicalRecordNo: selectedQueuePatient.medicalRecordNo,
      guarantor: selectedQueuePatient.guarantor,
      cashierStatus: selectedQueuePatient.cashierStatus,
      medicineApproval: selectedQueuePatient.medicineApproval,
      pharmacyStatus,
      pharmacyNote,
      medicineItems: selectedMedicineItems,
      savedAt: new Date().toISOString(),
    }

    window.localStorage.setItem(
      pharmacyDispenseStorageKey,
      JSON.stringify(payload),
    )

    setIsSaved(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="outpatient-app">
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
          <span>Antrean farmasi dari kasir</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="outpatient-content">
        <header className="outpatient-header">
          <div>
            <small>Modul Penunjang Klinis</small>
            <h1>Farmasi</h1>
            <p>
              Farmasi menerima pasien dari Kasir setelah pembayaran,
              verifikasi penjamin, dan persetujuan pengambilan obat selesai.
            </p>
          </div>

          <div className="outpatient-unit-card">
            <span>Status Farmasi</span>
            <strong>{pharmacyStatus}</strong>
            <p>
              {selectedQueuePatient
                ? selectedQueuePatient.cashierStatus
                : 'Belum ada pasien'}
            </p>
          </div>
        </header>

        {isSaved && (
          <section className="registration-success-banner">
            <strong>Status farmasi tersimpan.</strong>
            <span>
              Data pengambilan obat pasien sudah dicatat dari antrean farmasi.
            </span>
          </section>
        )}

        <section className="outpatient-stat-grid">
          <article className="outpatient-stat-card">
            <span>Pasien Farmasi</span>
            <strong>{pharmacyQueuePatients.length}</strong>
            <small>Dari kasir</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Total Item Obat</span>
            <strong>{selectedMedicineItems.length}</strong>
            <small>Pasien terpilih</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Status Kasir</span>
            <strong>
              {selectedQueuePatient?.cashierStatus || 'Belum ada data'}
            </strong>
            <small>Pembayaran / penjamin</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Penjamin</span>
            <strong>{selectedQueuePatient?.guarantor || '-'}</strong>
            <small>{selectedQueuePatient?.medicineApproval || '-'}</small>
          </article>
        </section>

        <section className="outpatient-panel pharmacy-queue-panel">
          <div className="outpatient-panel-title">
            <small>Prescription Queue</small>
            <h2>Daftar Pasien Masuk Farmasi</h2>
            <p>
              Pasien muncul di sini setelah transaksi kasir selesai dan pasien
              menyetujui pengambilan obat di Farmasi RS.
            </p>
          </div>

          {pharmacyQueuePatients.length > 0 ? (
            <div className="pharmacy-queue-table-wrap">
              <table className="pharmacy-queue-table">
                <thead>
                  <tr>
                    <th>No. RM</th>
                    <th>Nama Pasien</th>
                    <th>Sumber</th>
                    <th>Penjamin</th>
                    <th>Status Kasir</th>
                    <th>Persetujuan Obat</th>
                    <th>Item</th>
                    <th>Status Farmasi</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pharmacyQueuePatients.map((patient) => (
                    <tr
                      className={
                        selectedQueuePatient?.id === patient.id ? 'active' : ''
                      }
                      key={patient.id}
                    >
                      <td>{patient.medicalRecordNo}</td>
                      <td>{patient.patientName}</td>
                      <td>{patient.sourceUnit}</td>
                      <td>{patient.guarantor}</td>
                      <td>{patient.cashierStatus}</td>
                      <td>{patient.medicineApproval}</td>
                      <td>{patient.medicineItems.length} item</td>
                      <td>
                        <span className="pharmacy-status-pill">
                          {patient.pharmacyStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedQueuePatientId(patient.id)
                            setPharmacyStatus(patient.pharmacyStatus)
                            setIsSaved(false)
                          }}
                        >
                          Pilih Pasien
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="cashier-empty-state">
              Belum ada pasien dari Kasir. Selesaikan pembayaran/verifikasi
              penjamin di modul Kasir, lalu klik Muat Ulang Order.
            </div>
          )}
        </section>

        <section className="outpatient-panel pharmacy-patient-panel">
          <div className="outpatient-panel-title">
            <small>Data Resep</small>
            <h2>Pasien dan Status Pembayaran</h2>
          </div>

          <div className="pharmacy-info-grid">
            <div>
              <span>No. Rekam Medis</span>
              <strong>{selectedQueuePatient?.medicalRecordNo || '-'}</strong>
            </div>
            <div>
              <span>Nama Pasien</span>
              <strong>{selectedQueuePatient?.patientName || '-'}</strong>
            </div>
            <div>
              <span>Sumber Order</span>
              <strong>{selectedQueuePatient?.sourceUnit || '-'}</strong>
            </div>
            <div>
              <span>Status Kasir</span>
              <strong>{selectedQueuePatient?.cashierStatus || '-'}</strong>
            </div>
          </div>
        </section>

        <section className="outpatient-panel pharmacy-order-panel">
          <div className="outpatient-panel-title">
            <small>Order Farmasi</small>
            <h2>Detail Obat Pasien</h2>
            <p>
              Detail obat dibaca dari item obat pada transaksi kasir pasien
              terpilih.
            </p>
          </div>

          {selectedMedicineItems.length > 0 ? (
            <div className="pharmacy-medicine-list">
              {selectedMedicineItems.map((item, index) => (
                <article key={`${item.itemName}-${index}`}>
                  <small>Obat {index + 1}</small>
                  <strong>{item.itemName}</strong>
                  <span>Qty: {item.quantity}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="cashier-empty-state">
              Tidak ada item obat untuk pasien ini, atau pasien tidak mengambil
              obat di Farmasi RS.
            </div>
          )}
        </section>

        <section className="outpatient-panel pharmacy-process-panel">
          <div className="outpatient-panel-title">
            <small>Proses Farmasi</small>
            <h2>Verifikasi dan Pengambilan Obat</h2>
          </div>

          {!canProcessPharmacy && (
            <div className="pharmacy-warning-card">
              Pasien belum dapat diproses di Farmasi karena tidak ada item obat
              atau pasien tidak mengambil obat melalui Farmasi RS.
            </div>
          )}

          <div className="pharmacy-status-buttons">
            {(
              [
                'Order Masuk',
                'Diverifikasi Farmasi',
                'Obat Disiapkan',
                'Obat Siap Diambil',
                'Obat Diserahkan',
              ] as PharmacyStatus[]
            ).map((status) => (
              <button
                className={pharmacyStatus === status ? 'active' : ''}
                key={status}
                onClick={() => {
                  setPharmacyStatus(status)
                  setIsSaved(false)
                }}
                type="button"
                disabled={!canProcessPharmacy}
              >
                {status}
              </button>
            ))}
          </div>

          <label className="pharmacy-note-field">
            <span>Catatan Farmasi</span>
            <textarea
              value={pharmacyNote}
              onChange={(event) => {
                setPharmacyNote(event.target.value)
                setIsSaved(false)
              }}
              rows={3}
            />
          </label>

          <div className="pharmacy-action-bar">
            <button
              type="button"
              onClick={saveDispense}
              disabled={!canProcessPharmacy}
            >
              Simpan Status Farmasi
            </button>

            <button type="button" onClick={reloadPharmacyQueue}>
              Muat Ulang Order
            </button>

            <Link to="/rme">Lihat RME</Link>
          </div>
        </section>
      </section>
    </main>
  )
}

export default PharmacyPage
