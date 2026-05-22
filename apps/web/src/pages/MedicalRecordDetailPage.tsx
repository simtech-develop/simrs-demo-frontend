import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../lib/api'

const extractTextBetween = (
  text: string,
  startLabel: string,
  endLabels: string[],
) => {
  const startIndex = text.toLowerCase().indexOf(startLabel.toLowerCase())

  if (startIndex === -1) {
    return ''
  }

  const valueStart = startIndex + startLabel.length
  const restText = text.slice(valueStart)

  const endIndexes = endLabels
    .map((label) => restText.toLowerCase().indexOf(label.toLowerCase()))
    .filter((index) => index >= 0)

  const endIndex = endIndexes.length > 0 ? Math.min(...endIndexes) : restText.length

  return restText.slice(0, endIndex).trim()
}

const extractPrescriptionBillingItems = (pageText: string) => {
  const prescriptionSection = extractTextBetween(pageText, 'Resep Obat', [
    'Administrasi Lanjutan',
    'Simpan ke Kasir',
    'Transaksi siap diproses kasir',
  ])

  const matches = [
    ...prescriptionSection.matchAll(/OBAT\s+\d+\s+([\s\S]*?)(?=OBAT\s+\d+|$)/gi),
  ]

  const parsedItems = matches
    .map((match, index) => {
      const block = match[1].trim()
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      const medicineName = lines[0] || `Obat ${index + 1}`
      const form = extractTextBetween(block, 'Bentuk', ['Dosis', 'Frekuensi', 'Jumlah', 'Aturan Pakai'])
      const dose = extractTextBetween(block, 'Dosis', ['Frekuensi', 'Jumlah', 'Aturan Pakai'])
      const frequency = extractTextBetween(block, 'Frekuensi', ['Jumlah', 'Aturan Pakai'])
      const amount = extractTextBetween(block, 'Jumlah', ['Aturan Pakai'])
      const instruction = extractTextBetween(block, 'Aturan Pakai', [])

      const detailParts = [medicineName, form, dose, frequency, amount, instruction]
        .filter(Boolean)
        .join(' - ')

      return {
        source: 'Farmasi',
        category: 'Obat',
        itemName: detailParts,
        quantity: 1,
        unitPrice: 25000,
      }
    })
    .filter((item) => item.itemName.trim().length > 0)

  if (parsedItems.length > 0) {
    return parsedItems
  }

  return [
    {
      source: 'Farmasi',
      category: 'Obat',
      itemName: 'Obat resep dokter',
      quantity: 1,
      unitPrice: 50000,
    },
  ]
}


const saveRmeToCashier = () => {
  const pageText = document.body.innerText

  const patientName =
    document.querySelector('h1')?.textContent?.trim() || 'Pasien RME'

  const rmMatch = pageText.match(/RM-\d{4}-\d+/)
  const medicalRecordNo = rmMatch?.[0] || 'RM-RME-DEMO'

  const isBpjs = pageText.toLowerCase().includes('bpjs')
  const isInsurance = pageText.toLowerCase().includes('asuransi')

  const guarantor = isBpjs
    ? 'BPJS'
    : isInsurance
      ? 'Asuransi Lain'
      : 'Umum'

  const payload = {
    sourceModule: 'RME Rawat Jalan',
    patientName,
    medicalRecordNo,
    guarantor,
    paymentStatus: 'Belum Dibayar',
    serviceUnit: 'Rawat Jalan / RME',
    insuranceNumber: isBpjs ? 'BPJS / perlu verifikasi' : '-',
    items: [
      {
        source: 'RME Rawat Jalan',
        category: 'Konsultasi',
        itemName: 'Jasa pemeriksaan dokter',
        quantity: 1,
        unitPrice: 75000,
      },
      {
        source: 'RME Rawat Jalan',
        category: 'Administrasi',
        itemName: 'Administrasi layanan rawat jalan',
        quantity: 1,
        unitPrice: 25000,
      },
      ...extractPrescriptionBillingItems(pageText),
    ],
    savedAt: new Date().toISOString(),
  }

  window.localStorage.setItem(
    'simrs_rme_cashier_billing_demo',
    JSON.stringify(payload),
  )

  window.location.href = '/kasir'
}

type RmePrescriptionDisplayItem = {
  medicineName: string
  medicineForm: string
  dosage: string
  frequency: string
  quantity: string
  instruction: string
}

const parseRmePrescriptionNote = (
  note?: string | null,
): RmePrescriptionDisplayItem[] => {
  if (!note || note.trim() === '') {
    return []
  }

  return note
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const normalizedLine = line.replace(/^\d+\.\s*/, '')
      const segments = normalizedLine
        .split('|')
        .map((segment) => segment.trim())

      const medicineName = segments[0] || '-'

      const getSegmentValue = (label: string) =>
        segments
          .find((segment) => segment.startsWith(`${label}:`))
          ?.replace(`${label}:`, '')
          .trim() || '-'

      return {
        medicineName,
        medicineForm: getSegmentValue('Bentuk'),
        dosage: getSegmentValue('Dosis'),
        frequency: getSegmentValue('Frekuensi'),
        quantity: getSegmentValue('Jumlah'),
        instruction: getSegmentValue('Aturan'),
      }
    })
}


const REGISTRATION_EDIT_STORAGE_KEY = 'simrs_registration_edit_overrides'

type RegistrationEditOverride = {
  id: string
  rm: string
  patient: string
  nik: string
  service: string
  doctor?: string
  type: string
  payerType?: 'Umum' | 'BPJS' | 'Asuransi'
  insuranceNo?: string
  phone?: string
  address?: string
  gender?: 'Laki-laki' | 'Perempuan' | '-'
  birthDate?: string
  queue: string
  status: 'Menunggu' | 'Terverifikasi' | 'Dilayani' | 'Dibatalkan'
}

const getRegistrationEditOverride = (
  candidateKeys: Array<string | undefined | null>,
): RegistrationEditOverride | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const currentValue = window.localStorage.getItem(
      REGISTRATION_EDIT_STORAGE_KEY,
    )

    if (!currentValue) {
      return null
    }

    const overrides = JSON.parse(currentValue) as Record<
      string,
      RegistrationEditOverride
    >

    const keys = candidateKeys.filter((key): key is string => Boolean(key))

    for (const key of keys) {
      if (overrides[key]) {
        return overrides[key]
      }
    }

    return null
  } catch (error) {
    console.error('Gagal membaca override registrasi untuk RME:', error)
    return null
  }
}

const mapPayerTypeLabel = (payerType?: string) => {
  if (payerType === 'BPJS') {
    return 'BPJS Kesehatan'
  }

  if (payerType === 'Asuransi') {
    return 'Asuransi / Perusahaan'
  }

  return 'Umum / Mandiri'
}


type ApiMedicalRecord = {
  id: string
  registrationId: string
  anamnesis?: string | null
  physicalExamination?: string | null
  diagnosis?: string | null
  treatmentPlan?: string | null
  prescriptionNote?: string | null
  examinedAt: string
  createdAt: string
  updatedAt: string
  registration: {
    id: string
    registrationNo: string
    visitDate: string
    queueNumber: number
    chiefComplaint?: string | null
    status: 'WAITING' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELED'
    patient: {
      id: string
      medicalRecordNo: string
      nationalId?: string | null
      fullName: string
      gender?: 'MALE' | 'FEMALE'
      birthDate?: string | null
      phone?: string | null
      address?: string | null
    }
    clinic: {
      id: string
      code: string
      name: string
    }
    doctor?: {
      id: string
      fullName: string
    } | null
  }
}

type ParsedClinicalRecord = {
  chiefComplaint: string
  currentHistory: string
  bloodPressure: string
  pulse: string
  temperature: string
  weight: string
  physicalExaminationSummary: string
  diagnosis: string
  carePlan: string
  doctorNote: string
}

function displayValue(value?: string | null) {
  return value && value.trim() !== '' ? value : '-'
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

function extractLineValue(source: string | null | undefined, label: string) {
  if (!source) {
    return ''
  }

  const line = source
    .split('\n')
    .find((item) => item.trim().startsWith(`${label}:`))

  return line ? line.replace(`${label}:`, '').trim() : ''
}

function parseMedicalRecord(record: ApiMedicalRecord): ParsedClinicalRecord {
  const chiefComplaint =
    extractLineValue(record.anamnesis, 'Keluhan Utama') ||
    record.registration.chiefComplaint ||
    record.anamnesis ||
    ''

  const currentHistory = extractLineValue(
    record.anamnesis,
    'Riwayat Penyakit Sekarang',
  )

  const bloodPressure = extractLineValue(
    record.physicalExamination,
    'Tekanan Darah',
  )

  const pulse = extractLineValue(record.physicalExamination, 'Nadi')
  const temperature = extractLineValue(record.physicalExamination, 'Suhu')
  const weight = extractLineValue(record.physicalExamination, 'Berat Badan')

  const hasStructuredVital =
    bloodPressure !== '' ||
    pulse !== '' ||
    temperature !== '' ||
    weight !== ''

  const carePlan =
    extractLineValue(record.treatmentPlan, 'Rencana Tindak Lanjut') ||
    record.treatmentPlan ||
    ''

  const doctorNote = extractLineValue(record.treatmentPlan, 'Catatan Dokter')

  return {
    chiefComplaint,
    currentHistory,
    bloodPressure,
    pulse,
    temperature,
    weight,
    physicalExaminationSummary: hasStructuredVital
      ? ''
      : record.physicalExamination ?? '',
    diagnosis: record.diagnosis ?? '',
    carePlan,
    doctorNote,
  }
}

function MedicalRecordDetailPage() {
  const { id } = useParams()
  const [medicalRecord, setMedicalRecord] =
    useState<ApiMedicalRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadMedicalRecord = async () => {
    if (!id) {
      setLoadError('ID registrasi tidak tersedia.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError('')

    try {
      const response = await api.get<ApiMedicalRecord>(
        `/medical-records/registration/${id}`,
      )

      setMedicalRecord(response)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memuat detail rekam medis dari backend.'

      setMedicalRecord(null)
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadMedicalRecord()
  }, [id])

  const parsedRecord = useMemo(
    () => (medicalRecord ? parseMedicalRecord(medicalRecord) : null),
    [medicalRecord],
  )

  if (isLoading) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Memuat RME</small>
          <h1>Detail rekam medis sedang diproses</h1>
          <p>Mengambil catatan klinis pasien dari backend SIMRS.</p>
        </section>
      </main>
    )
  }

  if (!medicalRecord || !parsedRecord) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>RME Tidak Ditemukan</small>
          <h1>Rekam medis pasien belum tersedia</h1>
          <p>
            {loadError ||
              'Pastikan pemeriksaan rawat jalan sudah disimpan terlebih dahulu.'}
          </p>
          <Link to="/rme">Kembali ke Daftar RME</Link>
        </section>
      </main>
    )
  }

  const registration = medicalRecord.registration
  const patient = registration.patient
  const rmeRecordAny = medicalRecord as any
  const rmeRegistrationAny =
    rmeRecordAny?.registration ||
    rmeRecordAny?.registrationData ||
    rmeRecordAny?.registrationDetail ||
    {}

  const rmePatientAny =
    rmeRegistrationAny?.patient ||
    rmeRecordAny?.patient ||
    rmeRecordAny?.patientData ||
    {}

  const rmeClinicAny =
    rmeRegistrationAny?.clinic ||
    rmeRecordAny?.clinic ||
    rmeRecordAny?.clinicData ||
    {}

  const rawRmeQueue =
    rmeRegistrationAny?.queue ||
    rmeRegistrationAny?.queueNumberLabel ||
    rmeRecordAny?.queue ||
    rmeRecordAny?.queueNumberLabel ||
    (rmeRegistrationAny?.queueNumber
      ? `${rmeClinicAny?.code || 'UMUM'}-${String(
          rmeRegistrationAny.queueNumber,
        ).padStart(3, '0')}`
      : '')

  const rmeRegistrationOverride = getRegistrationEditOverride([
    rmeRegistrationAny?.id,
    rmeRecordAny?.registrationId,
    rmePatientAny?.medicalRecordNo,
    rmeRecordAny?.medicalRecordNo,
    rmePatientAny?.fullName,
    rmeRecordAny?.patientName,
    rawRmeQueue,
  ])

  const displayRmeMedicalRecordNo =
    rmeRegistrationOverride?.rm ||
    rmePatientAny?.medicalRecordNo ||
    rmeRecordAny?.medicalRecordNo ||
    '-'

  const displayRmePatientName =
    rmeRegistrationOverride?.patient ||
    rmePatientAny?.fullName ||
    rmeRecordAny?.patientName ||
    rmeRecordAny?.patient ||
    '-'

  const displayRmeService =
    rmeRegistrationOverride?.service ||
    rmeClinicAny?.name ||
    rmeRecordAny?.clinicName ||
    rmeRecordAny?.service ||
    '-'

  const displayRmeDoctor =
    rmeRegistrationOverride?.doctor && rmeRegistrationOverride.doctor !== '-'
      ? rmeRegistrationOverride.doctor
      : rmeRegistrationAny?.doctor?.fullName ||
        rmeRecordAny?.doctor?.fullName ||
        rmeRecordAny?.doctorName ||
        '-'

  const displayRmeQueue =
    rmeRegistrationOverride?.queue ||
    rawRmeQueue ||
    '-'

  const displayRmePayerType = mapPayerTypeLabel(
    rmeRegistrationOverride?.payerType,
  )

  const displayRmeInsuranceNo =
    rmeRegistrationOverride?.insuranceNo &&
    rmeRegistrationOverride.insuranceNo !== '-'
      ? rmeRegistrationOverride.insuranceNo
      : rmeRecordAny?.insuranceNo ||
        rmeRecordAny?.guarantorNo ||
        rmeRecordAny?.guarantorNumber ||
        '-'

  void displayRmePatientName

  const displayRmePrescriptionItems = parseRmePrescriptionNote(
    rmeRecordAny?.prescriptionNote ||
      rmeRecordAny?.prescription ||
      rmeRecordAny?.recipeNote,
  )

  return (
    <main className="rme-detail-app">
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
          <Link className="active" to="/rme">
            RME
          </Link>
          <Link to="/farmasi">Farmasi</Link>
          <Link to="/kasir">Kasir</Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Detail rekam medis pasien</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="rme-detail-content">
        <header className="rme-detail-header">
          <div className="rme-detail-heading">
            <Link className="breadcrumb-link" to="/rme">
              ← Kembali ke Daftar RME
            </Link>

            <small>Detail Rekam Medis</small>
            <h1>{patient.fullName}</h1>
            <p>
              Catatan klinis hasil pemeriksaan yang telah tersimpan sebagai rekam
              medis elektronik pada backend SIMRS Demo.
            </p>
          </div>

          <div className="rme-detail-status-card">
            <span>Status RME</span>
            <strong>Tersimpan</strong>
            <p>{patient.medicalRecordNo}</p>
          </div>
        </header>

        <section className="rme-patient-banner">
          <article>
            <span>No. RM</span>
            <strong>{displayRmeMedicalRecordNo}</strong>
          </article>

          <article>
            <span>Pasien</span>
            <strong>{displayRmePatientName}</strong>
          </article>

          <article>
            <span>Poli</span>
            <strong>{displayRmeService}</strong>
          </article>

          <article>
            <span>Tanggal Pemeriksaan</span>
            <strong>{formatDate(medicalRecord.examinedAt)}</strong>
          </article>
        </section>

        <section className="rme-detail-grid">
          <article className="rme-detail-panel">
            <div className="rme-panel-title">
              <small>Subjektif</small>
              <h2>Anamnesis</h2>
            </div>

            <div className="rme-clinical-card">
              <span>Keluhan Utama</span>
              <strong>{displayValue(parsedRecord.chiefComplaint)}</strong>
            </div>

            <div className="rme-clinical-card">
              <span>Riwayat Penyakit Sekarang</span>
              <strong>{displayValue(parsedRecord.currentHistory)}</strong>
            </div>
          </article>

          <article className="rme-detail-panel">
            <div className="rme-panel-title">
              <small>Objektif</small>
              <h2>Tanda Vital</h2>
            </div>

            {parsedRecord.physicalExaminationSummary ? (
              <div className="rme-clinical-card">
                <span>Pemeriksaan Fisik</span>
                <strong>
                  {displayValue(parsedRecord.physicalExaminationSummary)}
                </strong>
              </div>
            ) : (
              <div className="rme-vital-grid">
                <div>
                  <span>Tekanan Darah</span>
                  <strong>{displayValue(parsedRecord.bloodPressure)}</strong>
                </div>

                <div>
                  <span>Nadi</span>
                  <strong>{displayValue(parsedRecord.pulse)}</strong>
                </div>

                <div>
                  <span>Suhu</span>
                  <strong>{displayValue(parsedRecord.temperature)}</strong>
                </div>

                <div>
                  <span>Berat Badan</span>
                  <strong>{displayValue(parsedRecord.weight)}</strong>
                </div>
              </div>
            )}
          </article>

          <article className="rme-detail-panel wide-panel">
            <div className="rme-panel-title">
              <small>Assessment & Plan</small>
              <h2>Kesimpulan Pemeriksaan</h2>
            </div>

            <div className="rme-assessment-grid">
              <div>
                <span>Diagnosis Kerja</span>
                <strong>{displayValue(parsedRecord.diagnosis)}</strong>
              </div>

              <div>
                <span>Rencana Tindak Lanjut</span>
                <strong>{displayValue(parsedRecord.carePlan)}</strong>
              </div>

              <div>
                <span>Catatan Dokter</span>
                <strong>{displayValue(parsedRecord.doctorNote)}</strong>
              </div>
            </div>
          </article>

          <article className="rme-detail-panel wide-panel">
            <div className="rme-panel-title">
              <small>Administrasi Klinik</small>
              <h2>Informasi Registrasi</h2>
            </div>

            <div className="rme-assessment-grid">
              <div>
                <span>Nomor Registrasi</span>
                <strong>{registration.registrationNo}</strong>
              </div>

              <div>
                <span>Nomor Antrean</span>
                <strong>{displayRmeQueue}</strong>
              </div>

              <div>
                <span>Penjamin Pasien</span>
                <strong>{displayRmePayerType}</strong>
              </div>

              <div>
                <span>No. BPJS / Asuransi</span>
                <strong>{displayRmeInsuranceNo}</strong>
              </div>

              <div>
                <span>Dokter</span>
                <strong>{displayRmeDoctor}</strong>
              </div>
            </div>
          </article>
          <section className="medical-record-section rme-prescription-section">
            <div className="medical-record-section-title">
              <small>TERAPI</small>
              <h2>Resep Obat</h2>
            </div>

            {displayRmePrescriptionItems.length > 0 ? (
              <div className="rme-prescription-list">
                {displayRmePrescriptionItems.map((item, index) => (
                  <article className="rme-prescription-card" key={`${item.medicineName}-${index}`}>
                    <div>
                      <small>Obat {index + 1}</small>
                      <strong>{item.medicineName}</strong>
                    </div>

                    <dl>
                      <div>
                        <dt>Bentuk</dt>
                        <dd>{item.medicineForm}</dd>
                      </div>
                      <div>
                        <dt>Dosis</dt>
                        <dd>{item.dosage}</dd>
                      </div>
                      <div>
                        <dt>Frekuensi</dt>
                        <dd>{item.frequency}</dd>
                      </div>
                      <div>
                        <dt>Jumlah</dt>
                        <dd>{item.quantity}</dd>
                      </div>
                      <div className="full-span">
                        <dt>Aturan Pakai</dt>
                        <dd>{item.instruction}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rme-empty-prescription">
                Belum ada resep obat yang tercatat pada pemeriksaan ini.
              </div>
            )}
          </section>

        </section>

        <section className="outpatient-panel rme-send-cashier-panel">
          <div className="outpatient-panel-title">
            <small>Administrasi Lanjutan</small>
            <h2>Simpan ke Kasir</h2>
            <p>
              Setelah pemeriksaan RME dan resep obat selesai, transaksi pasien
              dikirim ke kasir untuk pembayaran atau verifikasi penjamin.
            </p>
          </div>

          <div className="rme-send-cashier-card">
            <div>
              <strong>Transaksi siap diproses kasir</strong>
              <p>
                Draft tagihan akan dibentuk dari jasa pemeriksaan, administrasi,
                dan obat resep dokter.
              </p>
            </div>

            <button type="button" onClick={saveRmeToCashier}>
              Simpan ke Kasir / Pembayaran
            </button>
          </div>
        </section>

      </section>
    </main>
  )
}

export default MedicalRecordDetailPage
