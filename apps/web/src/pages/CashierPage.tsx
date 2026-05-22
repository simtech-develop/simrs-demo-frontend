import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'

type PaymentStatus =
  | 'Belum Dibayar'
  | 'Verifikasi Penjamin'
  | 'Dibayar'
  | 'Klaim / Penjamin'

type GuarantorType = 'Umum' | 'BPJS' | 'Asuransi Lain'

type MedicinePaymentApproval =
  | 'Belum Dipilih'
  | 'Setuju Bayar Obat'
  | 'Tidak Setuju Bayar Obat'

type BillingItem = {
  source: string
  category: string
  itemName: string
  quantity: number
  unitPrice: number
}

type BillingPayload = {
  patientName?: string
  medicalRecordNo?: string
  guarantor?: GuarantorType
  insuranceNumber?: string
  paymentStatus?: PaymentStatus
  serviceUnit?: string
  items?: BillingItem[]
  totalBilling?: number
  savedAt?: string
}

type InpatientAdmissionBilling = {
  patientName?: string
  medicalRecordNo?: string
  guarantor?: GuarantorType
  insuranceNumber?: string
  careClass?: string
  ward?: string
  bed?: string
  dpjp?: string
  admissionStatus?: string
  estimatedDeposit?: number
}

type InpatientDailyCareBilling = {
  patientName?: string
  medicalRecordNo?: string
  guarantor?: GuarantorType
  ward?: string
  bed?: string
  dpjp?: string
  dailyRoomCost?: number
  doctorVisitCost?: number
  nursingActionCost?: number
  pharmacyCost?: number
}

type OperatingRoomBilling = {
  guarantor?: GuarantorType
  items?: BillingItem[]
}

type CashierQueuePatient = {
  id: string
  medicalRecordNo: string
  patientName: string
  sourceUnit: string
  guarantor: GuarantorType
  paymentStatus: PaymentStatus
  insuranceNumber: string
  items: BillingItem[]
}

const operatingCostStorageKey = 'simrs_operating_room_costs'
const inpatientAdmissionStorageKey = 'simrs_inpatient_admission_demo'
const inpatientDailyCareStorageKey = 'simrs_inpatient_daily_care_demo'
const rmeCashierBillingStorageKey = 'simrs_rme_cashier_billing_demo'
const cashierPaymentStorageKey = 'simrs_cashier_payment_demo'
const pharmacyQueueStorageKey = 'simrs_pharmacy_queue_demo'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)

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

function CashierPage() {
  const [operatingBilling, setOperatingBilling] =
    useState<OperatingRoomBilling | null>(null)
  const [admissionBilling, setAdmissionBilling] =
    useState<InpatientAdmissionBilling | null>(null)
  const [dailyCareBilling, setDailyCareBilling] =
    useState<InpatientDailyCareBilling | null>(null)
  const [rmeBilling, setRmeBilling] = useState<BillingPayload | null>(null)
  const [selectedCashierPatientId, setSelectedCashierPatientId] =
    useState<string>('rme-patient')
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>('Belum Dibayar')
  const [medicineApproval, setMedicineApproval] =
    useState<MedicinePaymentApproval>('Belum Dipilih')
  const [cashierNote, setCashierNote] = useState(
    'Pasien diproses administrasi kasir sebelum lanjut farmasi.',
  )
  const [isSaved, setIsSaved] = useState(false)

  const reloadBilling = () => {
    setOperatingBilling(readStorage<OperatingRoomBilling>(operatingCostStorageKey))
    setAdmissionBilling(
      readStorage<InpatientAdmissionBilling>(inpatientAdmissionStorageKey),
    )
    setDailyCareBilling(
      readStorage<InpatientDailyCareBilling>(inpatientDailyCareStorageKey),
    )
    setRmeBilling(readStorage<BillingPayload>(rmeCashierBillingStorageKey))
    setIsSaved(false)
  }

  useEffect(() => {
    reloadBilling()
  }, [])

  const inpatientItems = useMemo<BillingItem[]>(() => {
    const items: BillingItem[] = []

    operatingBilling?.items?.forEach((item) => {
      items.push({
        ...item,
        source: item.source || 'Ruang Tindakan / Operasi',
      })
    })

    if (dailyCareBilling) {
      items.push(
        {
          source: 'Rawat Inap',
          category: 'Kamar',
          itemName: `Biaya kamar ${dailyCareBilling.ward || '-'}`,
          quantity: 1,
          unitPrice: dailyCareBilling.dailyRoomCost || 0,
        },
        {
          source: 'Rawat Inap',
          category: 'Visite Dokter',
          itemName: `Visite ${dailyCareBilling.dpjp || 'DPJP'}`,
          quantity: 1,
          unitPrice: dailyCareBilling.doctorVisitCost || 0,
        },
        {
          source: 'Rawat Inap',
          category: 'Tindakan Perawat',
          itemName: 'Tindakan dan monitoring perawat',
          quantity: 1,
          unitPrice: dailyCareBilling.nursingActionCost || 0,
        },
        {
          source: 'Rawat Inap',
          category: 'Obat / Farmasi',
          itemName: 'Obat dan farmasi rawat inap',
          quantity: 1,
          unitPrice: dailyCareBilling.pharmacyCost || 0,
        },
      )
    }

    return items
  }, [dailyCareBilling, operatingBilling])

  const cashierQueuePatients = useMemo<CashierQueuePatient[]>(() => {
    const queue: CashierQueuePatient[] = []

    if (rmeBilling?.medicalRecordNo || rmeBilling?.patientName) {
      queue.push({
        id: 'rme-patient',
        medicalRecordNo: rmeBilling.medicalRecordNo || 'RM-RME-DEMO',
        patientName: rmeBilling.patientName || 'Pasien RME',
        sourceUnit: rmeBilling.serviceUnit || 'RME Rawat Jalan',
        guarantor: rmeBilling.guarantor || 'Umum',
        paymentStatus: rmeBilling.paymentStatus || 'Belum Dibayar',
        insuranceNumber: rmeBilling.insuranceNumber || '-',
        items: rmeBilling.items || [],
      })
    }

    if (inpatientItems.length > 0) {
      queue.push({
        id: 'inpatient-patient',
        medicalRecordNo:
          admissionBilling?.medicalRecordNo ||
          dailyCareBilling?.medicalRecordNo ||
          'RM-INAP-DEMO',
        patientName:
          admissionBilling?.patientName ||
          dailyCareBilling?.patientName ||
          'Pasien Rawat Inap',
        sourceUnit: 'IGD / Ruang Tindakan / Rawat Inap',
        guarantor:
          admissionBilling?.guarantor ||
          dailyCareBilling?.guarantor ||
          operatingBilling?.guarantor ||
          'Umum',
        paymentStatus: 'Belum Dibayar',
        insuranceNumber: admissionBilling?.insuranceNumber || '-',
        items: inpatientItems,
      })
    }

    queue.push(
      {
        id: 'demo-kasir-001',
        medicalRecordNo: 'RM-2026-821518',
        patientName: 'Ujang',
        sourceUnit: 'Rawat Jalan',
        guarantor: 'Umum',
        paymentStatus: 'Dibayar',
        insuranceNumber: '-',
        items: [
          {
            source: 'Rawat Jalan',
            category: 'Konsultasi',
            itemName: 'Konsultasi dokter umum',
            quantity: 1,
            unitPrice: 75000,
          },
          {
            source: 'Farmasi',
            category: 'Obat',
            itemName: 'Obat rawat jalan',
            quantity: 1,
            unitPrice: 40000,
          },
        ],
      },
      {
        id: 'demo-kasir-002',
        medicalRecordNo: 'RM-2026-288316',
        patientName: 'Juminten',
        sourceUnit: 'IGD',
        guarantor: 'BPJS',
        paymentStatus: 'Klaim / Penjamin',
        insuranceNumber: '0009876543210',
        items: [
          {
            source: 'IGD',
            category: 'Tindakan',
            itemName: 'Tindakan IGD ringan',
            quantity: 1,
            unitPrice: 90000,
          },
          {
            source: 'Farmasi',
            category: 'Obat',
            itemName: 'Obat IGD',
            quantity: 1,
            unitPrice: 45000,
          },
        ],
      },
    )

    return queue
  }, [
    admissionBilling,
    dailyCareBilling,
    inpatientItems,
    operatingBilling?.guarantor,
    rmeBilling,
  ])

  const selectedCashierPatient =
    cashierQueuePatients.find(
      (patient) => patient.id === selectedCashierPatientId,
    ) || cashierQueuePatients[0]

  const selectedBillingItems = selectedCashierPatient?.items || []

  const selectedTotalBilling = selectedBillingItems.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  )

  const selectedMedicineTotal = selectedBillingItems
    .filter((item) => item.category.toLowerCase().includes('obat'))
    .reduce((total, item) => total + item.quantity * item.unitPrice, 0)

  const isMedicineRejected =
    medicineApproval === 'Tidak Setuju Bayar Obat'

  const selectedPaymentReceiptItems = isMedicineRejected
    ? selectedBillingItems.filter(
        (item) => !item.category.toLowerCase().includes('obat'),
      )
    : selectedBillingItems

  const selectedPaymentReceiptTotal = selectedPaymentReceiptItems.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  )

  const selectedPatientResponsibility =
    selectedCashierPatient?.guarantor === 'BPJS'
      ? 0
      : selectedCashierPatient?.guarantor === 'Asuransi Lain'
        ? Math.round(selectedTotalBilling * 0.2)
        : selectedTotalBilling

  const selectedGuarantorResponsibility =
    selectedTotalBilling - selectedPatientResponsibility

  const isGeneralPatient = selectedCashierPatient?.guarantor === 'Umum'

  const isMedicinePaymentApproved =
    medicineApproval === 'Setuju Bayar Obat'

  const canContinueToPharmacy =
    medicineApproval === 'Setuju Bayar Obat'

  const pharmacyBlockedReason =
    medicineApproval === 'Tidak Setuju Bayar Obat'
      ? isGeneralPatient
        ? 'Pasien umum tidak setuju menebus obat di RS. Farmasi tidak dapat dilanjutkan.'
        : 'Pasien/keluarga tidak setuju mengambil obat melalui penjamin di RS. Farmasi tidak dapat dilanjutkan.'
      : medicineApproval === 'Belum Dipilih'
        ? isGeneralPatient
          ? 'Pilih persetujuan pembayaran obat terlebih dahulu.'
          : 'Pilih persetujuan pengambilan obat melalui penjamin terlebih dahulu.'
        : ''

  const isPaymentCompleted =
    paymentStatus === 'Dibayar' || paymentStatus === 'Klaim / Penjamin'

  const canPrintPrescription =
    isPaymentCompleted &&
    (!isGeneralPatient || medicineApproval !== 'Belum Dipilih')

  const printPaymentReceipt = () => {
    const receiptWindow = window.open('', '_blank', 'width=900,height=700')

    if (!receiptWindow) {
      return
    }

    const rows = selectedPaymentReceiptItems
      .map(
        (item) => `
          <tr>
            <td>${item.source}</td>
            <td>${item.category}</td>
            <td>${item.itemName}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.unitPrice)}</td>
            <td>${formatCurrency(item.quantity * item.unitPrice)}</td>
          </tr>
        `,
      )
      .join('')

    receiptWindow.document.write(`
      <html>
        <head>
          <title>Struk Pembayaran SIMRS</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 28px;
              color: #111827;
            }
            h1 {
              margin: 0 0 4px;
              font-size: 24px;
            }
            h2 {
              margin-top: 24px;
              font-size: 18px;
            }
            .meta {
              margin-top: 18px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px 18px;
              font-size: 13px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
              font-size: 13px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px;
              text-align: left;
            }
            th {
              background: #f3f4f6;
            }
            .summary {
              margin-top: 18px;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
            }
            .summary div {
              border: 1px solid #d1d5db;
              padding: 10px;
              border-radius: 8px;
            }
            .summary span {
              display: block;
              color: #6b7280;
              font-size: 12px;
            }
            .summary strong {
              display: block;
              font-size: 16px;
              margin-top: 4px;
            }
            .note {
              margin-top: 16px;
              border: 1px solid #f59e0b;
              background: #fffbeb;
              color: #92400e;
              padding: 12px;
              border-radius: 8px;
              font-size: 13px;
              line-height: 1.5;
            }
            .footer {
              margin-top: 34px;
              display: flex;
              justify-content: space-between;
              font-size: 13px;
            }
            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>RS SIMTECH Medika</h1>
          <div>Struk Pembayaran Pasien</div>

          <div class="meta">
            <div><strong>No. RM:</strong> ${selectedCashierPatient?.medicalRecordNo || '-'}</div>
            <div><strong>Nama Pasien:</strong> ${selectedCashierPatient?.patientName || '-'}</div>
            <div><strong>Penjamin:</strong> ${selectedCashierPatient?.guarantor || '-'}</div>
            <div><strong>Status:</strong> ${paymentStatus}</div>
            <div><strong>No. Kartu/SEP/Polis:</strong> ${selectedCashierPatient?.insuranceNumber || '-'}</div>
            <div><strong>Tanggal:</strong> ${new Date().toLocaleString('id-ID')}</div>
          </div>

          <h2>Rincian Tagihan</h2>
          <table>
            <thead>
              <tr>
                <th>Sumber</th>
                <th>Kategori</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Harga</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="summary">
            <div>
              <span>Total Tagihan</span>
              <strong>${formatCurrency(selectedPaymentReceiptTotal)}</strong>
            </div>
            <div>
              <span>Dibayar Pasien</span>
              <strong>${formatCurrency(
                selectedCashierPatient?.guarantor === 'BPJS'
                  ? 0
                  : selectedCashierPatient?.guarantor === 'Asuransi Lain'
                    ? Math.round(selectedPaymentReceiptTotal * 0.2)
                    : selectedPaymentReceiptTotal,
              )}</strong>
            </div>
            <div>
              <span>Penjamin / Klaim</span>
              <strong>${formatCurrency(
                selectedPaymentReceiptTotal -
                  (selectedCashierPatient?.guarantor === 'BPJS'
                    ? 0
                    : selectedCashierPatient?.guarantor === 'Asuransi Lain'
                      ? Math.round(selectedPaymentReceiptTotal * 0.2)
                      : selectedPaymentReceiptTotal),
              )}</strong>
            </div>
          </div>

          ${
            isMedicineRejected
              ? '<div class="note"><strong>Keterangan:</strong> Pasien/keluarga tidak menebus obat di RS. Item obat tidak dimasukkan ke struk pembayaran. Resep dokter tetap dapat dicetak untuk pembelian obat di luar RS.</div>'
              : ''
          }

          <div class="footer">
            <div>Petugas Kasir</div>
            <div>Pasien / Keluarga</div>
          </div>

          <script>
            window.print()
          </script>
        </body>
      </html>
    `)

    receiptWindow.document.close()
  }

  const printPrescriptionReceipt = () => {
    const prescriptionWindow = window.open('', '_blank', 'width=850,height=760')

    if (!prescriptionWindow) {
      return
    }

    const doctorName =
      selectedCashierPatient?.sourceUnit?.includes('RME') ||
      selectedCashierPatient?.sourceUnit?.includes('Rawat Jalan')
        ? 'dr. Rina Marlina'
        : 'DPJP / Dokter Pemeriksa'

    const doctorNote =
      selectedCashierPatient?.sourceUnit?.includes('RME') ||
      selectedCashierPatient?.sourceUnit?.includes('Rawat Jalan')
        ? 'Istirahat cukup, minum obat sesuai aturan pakai, kontrol ulang bila keluhan tidak membaik.'
        : 'Obat diberikan sesuai instruksi dokter dan kondisi klinis pasien.'

    const parsePrescriptionDetail = (itemName: string) => {
      const parts = itemName
        .split(' - ')
        .map((part) => part.trim())
        .filter(Boolean)

      return {
        medicineName: parts[0] || itemName,
        form: parts[1] || '-',
        dose: parts[2] || '-',
        frequency: parts[3] || '-',
        amount: parts[4] || '-',
        instruction: parts.slice(5).join(' - ') || '-',
      }
    }

    const medicineRows = selectedBillingItems
      .filter((item) => item.category.toLowerCase().includes('obat'))
      .map((item) => {
        const prescription = parsePrescriptionDetail(item.itemName)

        return `
          <tr>
            <td>${prescription.medicineName}</td>
            <td>${prescription.form}</td>
            <td>${prescription.dose}</td>
            <td>${prescription.frequency}</td>
            <td>${prescription.amount}</td>
            <td>${prescription.instruction}</td>
          </tr>
        `
      })
      .join('')

    prescriptionWindow.document.write(`
      <html>
        <head>
          <title>Resep Dokter SIMRS</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 28px;
              color: #111827;
            }
            h1 {
              margin: 0 0 4px;
              font-size: 24px;
            }
            .subtitle {
              font-size: 15px;
              margin-bottom: 18px;
            }
            .meta {
              margin-top: 18px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px 18px;
              font-size: 13px;
            }
            .section-title {
              margin-top: 24px;
              font-size: 16px;
              font-weight: 700;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
              font-size: 13px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #f3f4f6;
            }
            .note {
              margin-top: 16px;
              border: 1px solid #d1d5db;
              padding: 12px;
              border-radius: 8px;
              font-size: 13px;
              line-height: 1.5;
            }
            .note strong {
              display: block;
              margin-bottom: 6px;
            }
            .footer {
              margin-top: 38px;
              display: flex;
              justify-content: space-between;
              gap: 32px;
              font-size: 13px;
            }
            .signature {
              width: 220px;
              text-align: center;
            }
            .signature-space {
              height: 56px;
            }
            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>RS SIMTECH Medika</h1>
          <div class="subtitle">Bukti Resep Dokter / Pengambilan Obat</div>

          <div class="meta">
            <div><strong>No. RM:</strong> ${selectedCashierPatient?.medicalRecordNo || '-'}</div>
            <div><strong>Nama Pasien:</strong> ${selectedCashierPatient?.patientName || '-'}</div>
            <div><strong>Penjamin:</strong> ${selectedCashierPatient?.guarantor || '-'}</div>
            <div><strong>Status Obat:</strong> ${isGeneralPatient ? medicineApproval : 'Mengikuti Penjamin'}</div>
            <div><strong>Dokter:</strong> ${doctorName}</div>
            <div><strong>Tanggal:</strong> ${new Date().toLocaleString('id-ID')}</div>
          </div>

          <div class="section-title">Daftar Obat</div>
          <table>
            <thead>
              <tr>
                <th>Nama Obat</th>
                <th>Bentuk</th>
                <th>Dosis</th>
                <th>Frekuensi</th>
                <th>Jumlah</th>
                <th>Aturan Pakai</th>
              </tr>
            </thead>
            <tbody>
              ${
                medicineRows ||
                '<tr><td colspan="6">Tidak ada item obat pada transaksi ini.</td></tr>'
              }
            </tbody>
          </table>

          <div class="note">
            <strong>Catatan Dokter</strong>
            ${doctorNote}
          </div>

          <div class="note">
            <strong>Keterangan</strong>
            ${
              isGeneralPatient && medicineApproval === 'Tidak Setuju Bayar Obat'
                ? 'Pasien tidak menebus obat di Farmasi RS. Resep ini dapat digunakan untuk pembelian obat di luar RS sesuai ketentuan yang berlaku.'
                : 'Resep ini digunakan untuk proses pengambilan obat di Farmasi RS setelah pembayaran atau verifikasi penjamin selesai.'
            }
          </div>

          <div class="footer">
            <div class="signature">
              <div>Dokter Pemeriksa</div>
              <div class="signature-space"></div>
              <div>${doctorName}</div>
            </div>

            <div class="signature">
              <div>Pasien / Keluarga</div>
              <div class="signature-space"></div>
              <div>${selectedCashierPatient?.patientName || '-'}</div>
            </div>
          </div>

          <script>
            window.print()
          </script>
        </body>
      </html>
    `)

    prescriptionWindow.document.close()
  }

  const sendSelectedPatientToPharmacy = () => {
    if (!selectedCashierPatient) {
      return
    }

    const medicineItems = selectedBillingItems.filter((item) =>
      item.category.toLowerCase().includes('obat') ||
      item.source.toLowerCase().includes('farmasi')
    )

    const isPaymentCleared =
      paymentStatus === 'Dibayar' || paymentStatus === 'Klaim / Penjamin'

    const isMedicineAllowed =
      !isGeneralPatient || medicineApproval === 'Setuju Bayar Obat'

    if (!isPaymentCleared || !isMedicineAllowed || medicineItems.length === 0) {
      return
    }

    const payload = {
      id: `${selectedCashierPatient.medicalRecordNo}-${Date.now()}`,
      patientName: selectedCashierPatient.patientName,
      medicalRecordNo: selectedCashierPatient.medicalRecordNo,
      sourceUnit: selectedCashierPatient.sourceUnit,
      guarantor: selectedCashierPatient.guarantor,
      insuranceNumber: selectedCashierPatient.insuranceNumber,
      cashierStatus: paymentStatus,
      medicineApproval: isGeneralPatient
        ? medicineApproval
        : medicineApproval === 'Setuju Bayar Obat'
          ? 'Setuju Ambil Obat Melalui Penjamin'
          : medicineApproval === 'Tidak Setuju Bayar Obat'
            ? 'Tidak Setuju Ambil Obat Melalui Penjamin'
            : 'Belum Dipilih',
      pharmacyStatus: 'Order Masuk',
      medicineItems,
      sentAt: new Date().toISOString(),
    }

    const existingQueue = (() => {
      try {
        const rawValue = window.localStorage.getItem(pharmacyQueueStorageKey)
        return rawValue ? JSON.parse(rawValue) : []
      } catch {
        return []
      }
    })()

    const nextQueue = [
      payload,
      ...existingQueue.filter(
        (item: { medicalRecordNo?: string }) =>
          item.medicalRecordNo !== selectedCashierPatient.medicalRecordNo,
      ),
    ]

    window.localStorage.setItem(
      pharmacyQueueStorageKey,
      JSON.stringify(nextQueue),
    )

    window.location.href = '/farmasi'
  }

  const savePayment = () => {
    const payload = {
      patientName: selectedCashierPatient?.patientName || '-',
      medicalRecordNo: selectedCashierPatient?.medicalRecordNo || '-',
      guarantor: selectedCashierPatient?.guarantor || 'Umum',
      insuranceNumber: selectedCashierPatient?.insuranceNumber || '-',
      totalBilling: selectedTotalBilling,
      patientResponsibility: selectedPatientResponsibility,
      guarantorResponsibility: selectedGuarantorResponsibility,
      paymentStatus,
      medicinePaymentApproval: isGeneralPatient
        ? medicineApproval
        : medicineApproval === 'Setuju Bayar Obat'
          ? 'Setuju Ambil Obat Melalui Penjamin'
          : medicineApproval === 'Tidak Setuju Bayar Obat'
            ? 'Tidak Setuju Ambil Obat Melalui Penjamin'
            : 'Belum Dipilih',
      isMedicinePaymentApproved,
      cashierNote,
      items: selectedBillingItems,
      savedAt: new Date().toISOString(),
    }

    window.localStorage.setItem(cashierPaymentStorageKey, JSON.stringify(payload))

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
          <Link to="/farmasi">Farmasi</Link>
          <Link className="active" to="/kasir">
            Kasir
          </Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Pembayaran dan penjamin</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="outpatient-content">
        <header className="outpatient-header">
          <div>
            <small>Modul Finansial</small>
            <h1>Kasir</h1>
            <p>
              Daftar pasien masuk kasir, pilih pasien, proses administrasi,
              pembayaran, penjamin, dan persetujuan pembayaran obat.
            </p>
          </div>

          <div className="outpatient-unit-card">
            <span>Status Transaksi</span>
            <strong>{paymentStatus}</strong>
            <p>{selectedCashierPatient?.guarantor || '-'}</p>
          </div>
        </header>

        {isSaved && (
          <section className="registration-success-banner">
            <strong>Transaksi kasir tersimpan.</strong>
            <span>
              Pembayaran/verifikasi pasien sudah disimpan. Jika sudah selesai,
              pasien dapat dilanjutkan ke farmasi.
            </span>
          </section>
        )}

        <section className="outpatient-stat-grid">
          <article className="outpatient-stat-card">
            <span>Total Tagihan</span>
            <strong>{formatCurrency(selectedTotalBilling)}</strong>
            <small>{selectedCashierPatient?.sourceUnit || '-'}</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Penjamin</span>
            <strong>{selectedCashierPatient?.guarantor || '-'}</strong>
            <small>{selectedCashierPatient?.insuranceNumber || '-'}</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Obat</span>
            <strong>{formatCurrency(selectedMedicineTotal)}</strong>
            <small>
              {isGeneralPatient
                ? medicineApproval
                : 'Mengikuti skema penjamin'}
            </small>
          </article>
        </section>

        <section className="outpatient-panel cashier-queue-panel">
          <div className="outpatient-panel-title">
            <small>Billing Queue</small>
            <h2>Daftar Pasien Masuk Kasir</h2>
            <p>
              Pilih pasien yang akan dilakukan transaksi atau proses
              administratif.
            </p>
          </div>

          <div className="cashier-queue-table-wrap">
            <table className="cashier-queue-table">
              <thead>
                <tr>
                  <th>No. RM</th>
                  <th>Nama Pasien</th>
                  <th>Asal Tagihan</th>
                  <th>Penjamin</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {cashierQueuePatients.map((patient) => {
                  const total = patient.items.reduce(
                    (sum, item) => sum + item.quantity * item.unitPrice,
                    0,
                  )

                  return (
                    <tr
                      className={
                        selectedCashierPatient?.id === patient.id ? 'active' : ''
                      }
                      key={patient.id}
                    >
                      <td>{patient.medicalRecordNo}</td>
                      <td>{patient.patientName}</td>
                      <td>{patient.sourceUnit}</td>
                      <td>{patient.guarantor}</td>
                      <td>{formatCurrency(total)}</td>
                      <td>
                        <span className="cashier-queue-status-pill">
                          {patient.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCashierPatientId(patient.id)
                            setPaymentStatus(patient.paymentStatus)
                            setMedicineApproval('Belum Dipilih')
                            setIsSaved(false)
                          }}
                        >
                          Lihat Tagihan
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="outpatient-panel cashier-patient-panel">
          <div className="outpatient-panel-title">
            <small>Detail Transaksi</small>
            <h2>Identitas dan Penjamin</h2>
          </div>

          <div className="cashier-info-grid">
            <div>
              <span>No. Rekam Medis</span>
              <strong>{selectedCashierPatient?.medicalRecordNo || '-'}</strong>
            </div>
            <div>
              <span>Nama Pasien</span>
              <strong>{selectedCashierPatient?.patientName || '-'}</strong>
            </div>
            <div>
              <span>Asal Tagihan</span>
              <strong>{selectedCashierPatient?.sourceUnit || '-'}</strong>
            </div>
            <div>
              <span>No. Kartu / SEP / Polis</span>
              <strong>{selectedCashierPatient?.insuranceNumber || '-'}</strong>
            </div>
          </div>
        </section>

        <section className="outpatient-panel cashier-billing-panel">
          <div className="outpatient-panel-title">
            <small>Rincian Tagihan</small>
            <h2>Komponen Biaya Pasien</h2>
          </div>

          <div className="cashier-table-wrap">
            <table className="cashier-billing-table">
              <thead>
                <tr>
                  <th>Sumber</th>
                  <th>Kategori</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Harga</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedBillingItems.map((item, index) => (
                  <tr key={`${item.source}-${item.itemName}-${index}`}>
                    <td>{item.source}</td>
                    <td>{item.category}</td>
                    <td>{item.itemName}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cashier-summary-grid">
            <div>
              <span>Total Tagihan</span>
              <strong>{formatCurrency(selectedTotalBilling)}</strong>
            </div>
            <div>
              <span>Dibayar Pasien</span>
              <strong>{formatCurrency(selectedPatientResponsibility)}</strong>
            </div>
            <div>
              <span>Penjamin / Klaim</span>
              <strong>{formatCurrency(selectedGuarantorResponsibility)}</strong>
            </div>
          </div>
        </section>

        <section className="outpatient-panel cashier-payment-panel">
          <div className="outpatient-panel-title">
            <small>Status Kasir</small>
            <h2>Pembayaran dan Verifikasi Administratif</h2>
          </div>

          <div className="cashier-status-buttons">
            {(
              [
                'Belum Dibayar',
                'Verifikasi Penjamin',
                'Dibayar',
                'Klaim / Penjamin',
              ] as PaymentStatus[]
            ).map((status) => (
              <button
                className={paymentStatus === status ? 'active' : ''}
                key={status}
                onClick={() => {
                  setPaymentStatus(status)
                  setIsSaved(false)
                }}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>

          <div className="cashier-medicine-approval-panel">
            <div>
              <small>PERSETUJUAN OBAT</small>
              <h3>
                {isGeneralPatient
                  ? 'Persetujuan Pembayaran Obat Pasien Umum'
                  : 'Persetujuan Pengambilan Obat Melalui Penjamin'}
              </h3>
              <p>
                {isGeneralPatient
                  ? 'Untuk pasien umum, keluarga/pasien perlu menyetujui atau menolak pembayaran obat sebelum dilanjutkan ke farmasi.'
                  : 'Untuk BPJS atau asuransi lain, keluarga/pasien tetap perlu menyetujui pengambilan obat di Farmasi RS melalui skema penjamin.'}
              </p>
            </div>

            <div className="cashier-medicine-approval-buttons">
              <button
                className={
                  medicineApproval === 'Setuju Bayar Obat' ? 'active' : ''
                }
                type="button"
                onClick={() => {
                  setMedicineApproval('Setuju Bayar Obat')
                  setIsSaved(false)
                }}
              >
                {isGeneralPatient
                  ? 'Setuju Pembayaran Obat'
                  : 'Setuju Ambil Obat'}
              </button>
              <button
                className={
                  medicineApproval === 'Tidak Setuju Bayar Obat'
                    ? 'danger active'
                    : 'danger'
                }
                type="button"
                onClick={() => {
                  setMedicineApproval('Tidak Setuju Bayar Obat')
                  setIsSaved(false)
                }}
              >
                {isGeneralPatient
                  ? 'Tidak Setuju Pembayaran Obat'
                  : 'Tidak Setuju Ambil Obat'}
              </button>
            </div>
          </div>

          {!canContinueToPharmacy && pharmacyBlockedReason && (
            <div className="cashier-pharmacy-blocked-note">
              {pharmacyBlockedReason}
            </div>
          )}

          <label className="cashier-note-field">
            <span>Catatan Kasir</span>
            <textarea
              value={cashierNote}
              onChange={(event) => {
                setCashierNote(event.target.value)
                setIsSaved(false)
              }}
              rows={3}
            />
          </label>

          <div className="cashier-action-bar">
            <button type="button" onClick={savePayment}>
              Simpan Pembayaran
            </button>

            <button
              type="button"
              className="cashier-print-button"
              onClick={printPaymentReceipt}
              disabled={!isPaymentCompleted}
            >
              Cetak Struk Pembayaran
            </button>

            <button
              type="button"
              className="cashier-print-button prescription"
              onClick={printPrescriptionReceipt}
              disabled={!canPrintPrescription}
            >
              Cetak Resep
            </button>

            <button type="button" onClick={reloadBilling}>
              Muat Ulang Tagihan
            </button>

            {canContinueToPharmacy ? (
              <button
                type="button"
                className="cashier-pharmacy-link"
                onClick={sendSelectedPatientToPharmacy}
              >
                Lanjut Farmasi Ambil Obat
              </button>
            ) : (
              <button
                type="button"
                className="cashier-pharmacy-link disabled"
                disabled
                title={pharmacyBlockedReason}
              >
                Lanjut Farmasi Ambil Obat
              </button>
            )}

            <Link to="/rme">Lihat RME</Link>
          </div>
        </section>
      </section>
    </main>
  )
}

export default CashierPage
