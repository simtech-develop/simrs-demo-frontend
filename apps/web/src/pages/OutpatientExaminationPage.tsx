import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router'
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
  patient: {
    id: string
    medicalRecordNo: string
    nationalId?: string | null
    fullName: string
    phone?: string | null
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

type ApiMedicalRecord = {
  id: string
  registrationId: string
  anamnesis?: string | null
  physicalExamination?: string | null
  diagnosis?: string | null
  treatmentPlan?: string | null
  prescriptionNote?: string | null
  examinedAt: string
}

type ApiPharmacyOrder = {
  id: string
  registrationId: string
}

type ApiCashierBill = {
  id: string
  registrationId: string
}

type ExamForm = {
  chiefComplaint: string
  currentHistory: string
  bloodPressure: string
  pulse: string
  temperature: string
  weight: string
  workingDiagnosis: string
  carePlan: string
  doctorNote: string
}

type PrescriptionItem = {
  id: string
  medicineName: string
  medicineForm: string
  dosage: string
  frequency: string
  quantity: string
  instruction: string
}

const vitalUnitByField: Partial<Record<keyof ExamForm, string>> = {
  bloodPressure: 'mmHg',
  pulse: 'x/menit',
  temperature: '°C',
  weight: 'kg',
}

const stripVitalUnit = (value: string, unit: string) =>
  value.replace(new RegExp(`\\s*${unit.replace('/', '\\/')}\\s*$`, 'i'), '').trim()

const normalizeVitalValue = (field: keyof ExamForm, value: string) => {
  const unit = vitalUnitByField[field]
  const cleanValue = unit ? stripVitalUnit(value, unit) : value.trim()

  if (!unit || cleanValue === '') {
    return cleanValue
  }

  return `${cleanValue} ${unit}`
}

const normalizeVitalTyping = (field: keyof ExamForm, value: string) => {
  const unit = vitalUnitByField[field]

  return unit ? stripVitalUnit(value, unit) : value
}

const emptyExamForm: ExamForm = {
  chiefComplaint: '',
  currentHistory: '',
  bloodPressure: '',
  pulse: '',
  temperature: '',
  weight: '',
  workingDiagnosis: '',
  carePlan: '',
  doctorNote: '',
}

type DrugCatalogItem = {
  name: string
  form: string
  defaultDosage: string
  defaultFrequency: string
  defaultQuantity: string
  defaultInstruction: string
}

const drugCatalog: DrugCatalogItem[] = [
  {
    name: 'Paracetamol 500 mg',
    form: 'Tablet',
    defaultDosage: '1 tablet',
    defaultFrequency: '3x sehari',
    defaultQuantity: '10 tablet',
    defaultInstruction: 'Diminum sesudah makan',
  },
  {
    name: 'Amoxicillin 500 mg',
    form: 'Kapsul',
    defaultDosage: '1 kapsul',
    defaultFrequency: '3x sehari',
    defaultQuantity: '10 kapsul',
    defaultInstruction: 'Diminum sampai habis sesudah makan',
  },
  {
    name: 'Cetirizine 10 mg',
    form: 'Tablet',
    defaultDosage: '1 tablet',
    defaultFrequency: '1x sehari',
    defaultQuantity: '10 tablet',
    defaultInstruction: 'Diminum malam hari',
  },
  {
    name: 'Ambroxol Sirup 15 mg/5 ml',
    form: 'Sirup',
    defaultDosage: '1 sendok takar',
    defaultFrequency: '3x sehari',
    defaultQuantity: '1 botol',
    defaultInstruction: 'Diminum sesudah makan',
  },
  {
    name: 'Antasida Doen',
    form: 'Tablet kunyah',
    defaultDosage: '1 tablet',
    defaultFrequency: '3x sehari',
    defaultQuantity: '10 tablet',
    defaultInstruction: 'Dikunyah sebelum makan',
  },
  {
    name: 'Vitamin B Complex',
    form: 'Tablet',
    defaultDosage: '1 tablet',
    defaultFrequency: '1x sehari',
    defaultQuantity: '10 tablet',
    defaultInstruction: 'Diminum sesudah makan',
  },
  {
    name: 'Salep Hidrokortison 1%',
    form: 'Salep',
    defaultDosage: 'Oles tipis',
    defaultFrequency: '2x sehari',
    defaultQuantity: '1 tube',
    defaultInstruction: 'Dioleskan pada area keluhan',
  },
  {
    name: 'Oralit',
    form: 'Sachet',
    defaultDosage: '1 sachet',
    defaultFrequency: 'Setiap setelah BAB cair',
    defaultQuantity: '5 sachet',
    defaultInstruction: 'Larutkan dalam 200 ml air matang',
  },
  {
    name: 'Puyer Batuk Pilek Anak',
    form: 'Puyer',
    defaultDosage: '1 bungkus',
    defaultFrequency: '3x sehari',
    defaultQuantity: '10 bungkus',
    defaultInstruction: 'Diminum sesudah makan',
  },
  {
    name: 'Tetes Mata Cendo Lyteers',
    form: 'Tetes',
    defaultDosage: '1-2 tetes',
    defaultFrequency: '3x sehari',
    defaultQuantity: '1 botol',
    defaultInstruction: 'Diteteskan pada mata yang sakit',
  },
]

const medicineFormOptions = [
  'Tablet',
  'Tablet kunyah',
  'Kapsul',
  'Sirup',
  'Puyer',
  'Sachet',
  'Salep',
  'Tetes',
  'Injeksi',
  'Suppositoria',
]

const dosageOptionsByForm: Record<string, string[]> = {
  Tablet: ['1/2 tablet', '1 tablet', '2 tablet'],
  'Tablet kunyah': ['1 tablet', '2 tablet'],
  Kapsul: ['1 kapsul', '2 kapsul'],
  Sirup: ['1/2 sendok takar', '1 sendok takar', '2 sendok takar', '5 ml', '10 ml'],
  Puyer: ['1 bungkus', '1/2 bungkus'],
  Sachet: ['1 sachet', '2 sachet'],
  Salep: ['Oles tipis', 'Oles secukupnya'],
  Tetes: ['1 tetes', '1-2 tetes', '2 tetes'],
  Injeksi: ['1 ampul', '1 vial'],
  Suppositoria: ['1 suppositoria'],
}

const frequencyOptions = [
  '1x sehari',
  '2x sehari',
  '3x sehari',
  '4x sehari',
  'Setiap 6 jam',
  'Setiap 8 jam',
  'Jika perlu',
  'Setiap setelah BAB cair',
]

const instructionOptions = [
  'Diminum sebelum makan',
  'Diminum sesudah makan',
  'Diminum malam hari',
  'Diminum sampai habis sesudah makan',
  'Dikunyah sebelum makan',
  'Dilarutkan dalam air matang',
  'Dioleskan pada area keluhan',
  'Diteteskan pada area yang sakit',
  'Jika demam atau nyeri',
]

const createEmptyPrescription = (): PrescriptionItem => ({
  id: `rx-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  medicineName: '',
  medicineForm: '',
  dosage: '',
  frequency: '',
  quantity: '',
  instruction: '',
})

function buildQueue(registration: ApiRegistration) {
  return `${registration.clinic.code}-${String(
    registration.queueNumber,
  ).padStart(3, '0')}`
}

function buildAnamnesis(form: ExamForm) {
  return [
    `Keluhan Utama: ${form.chiefComplaint}`,
    `Riwayat Penyakit Sekarang: ${form.currentHistory}`,
  ].join('\n')
}

function buildPhysicalExamination(form: ExamForm) {
  return [
    `Tekanan Darah: ${form.bloodPressure}`,
    `Nadi: ${form.pulse}`,
    `Suhu: ${form.temperature}`,
    `Berat Badan: ${form.weight}`,
  ].join('\n')
}

function buildTreatmentPlan(form: ExamForm) {
  const lines = [`Rencana Tindak Lanjut: ${form.carePlan}`]

  if (form.doctorNote.trim() !== '') {
    lines.push(`Catatan Dokter: ${form.doctorNote}`)
  }

  return lines.join('\n')
}

function buildPrescriptionNote(items: PrescriptionItem[]) {
  if (items.length === 0) {
    return ''
  }

  return items
    .map(
      (item, index) =>
        `${index + 1}. ${item.medicineName} | Bentuk: ${
          item.medicineForm || '-'
        } | Dosis: ${item.dosage} | Frekuensi: ${
          item.frequency
        } | Jumlah: ${item.quantity} | Aturan: ${
          item.instruction || '-'
        }`,
    )
    .join('\n')
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

function parsePrescriptionNote(note?: string | null): PrescriptionItem[] {
  if (!note || note.trim() === '') {
    return [createEmptyPrescription()]
  }

  const rows = note
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const parsed = rows.map((line, index) => {
    const normalized = line.replace(/^\d+\.\s*/, '')
    const segments = normalized.split('|').map((segment) => segment.trim())

    const medicineName = segments[0] ?? ''
    const dosage =
      segments.find((segment) => segment.startsWith('Dosis:'))?.replace('Dosis:', '').trim() ??
      ''
    const frequency =
      segments.find((segment) => segment.startsWith('Frekuensi:'))?.replace('Frekuensi:', '').trim() ??
      ''
    const quantity =
      segments.find((segment) => segment.startsWith('Jumlah:'))?.replace('Jumlah:', '').trim() ??
      ''
    const instruction =
      segments.find((segment) => segment.startsWith('Aturan:'))?.replace('Aturan:', '').trim() ??
      ''

    return {
      id: `rx-existing-${index}-${Date.now()}`,
      medicineName,
      medicineForm:
        segments.find((segment) => segment.startsWith('Bentuk:'))?.replace('Bentuk:', '').trim() ??
        '',
      dosage,
      frequency,
      quantity,
      instruction: instruction === '-' ? '' : instruction,
    }
  })

  return parsed.length > 0 ? parsed : [createEmptyPrescription()]
}

function mapMedicalRecordToForm(
  record: ApiMedicalRecord,
  fallbackComplaint?: string | null,
): ExamForm {
  return {
    chiefComplaint:
      extractLineValue(record.anamnesis, 'Keluhan Utama') ||
      fallbackComplaint ||
      '',
    currentHistory: extractLineValue(
      record.anamnesis,
      'Riwayat Penyakit Sekarang',
    ),
    bloodPressure: extractLineValue(
      record.physicalExamination,
      'Tekanan Darah',
    ),
    pulse: extractLineValue(record.physicalExamination, 'Nadi'),
    temperature: extractLineValue(record.physicalExamination, 'Suhu'),
    weight: extractLineValue(record.physicalExamination, 'Berat Badan'),
    workingDiagnosis: record.diagnosis ?? '',
    carePlan: extractLineValue(
      record.treatmentPlan,
      'Rencana Tindak Lanjut',
    ),
    doctorNote: extractLineValue(record.treatmentPlan, 'Catatan Dokter'),
  }
}

async function ensurePharmacyOrder(
  registrationId: string,
  items: PrescriptionItem[],
) {
  try {
    await api.get<ApiPharmacyOrder>(
      `/pharmacy-orders/registration/${registrationId}`,
    )

    return 'Order farmasi sudah tersedia dan tidak dibuat ulang.'
  } catch (error) {
    const message = error instanceof Error ? error.message : ''

    if (!message.toLowerCase().includes('not found')) {
      throw error
    }
  }

  await api.post<
    ApiPharmacyOrder,
    {
      registrationId: string
      note: string
      items: Array<{
        medicineName: string
        dosage: string
        frequency: string
        quantity: string
        instruction?: string
      }>
    }
  >('/pharmacy-orders', {
    registrationId,
    note: 'Resep otomatis dari pemeriksaan rawat jalan.',
    items: items.map((item) => ({
      medicineName: item.medicineName,
      dosage: item.dosage,
      frequency: item.frequency,
      quantity: item.quantity,
      instruction: item.instruction || undefined,
    })),
  })

  return 'Resep otomatis diteruskan ke antrean Farmasi.'
}

async function ensureCashierBill(
  registration: ApiRegistration,
  pharmacyItems: PrescriptionItem[],
) {
  try {
    await api.get<ApiCashierBill>(
      `/cashier-bills/registration/${registration.id}`,
    )

    return 'Tagihan kasir sudah tersedia dan tidak dibuat ulang.'
  } catch (error) {
    const message = error instanceof Error ? error.message : ''

    if (!message.toLowerCase().includes('not found')) {
      throw error
    }
  }

  const billItems = [
    {
      itemName: 'Administrasi Pendaftaran',
      itemType: 'REGISTRATION',
      quantity: 1,
      unitPrice: 25000,
    },
    {
      itemName: `Pemeriksaan ${registration.clinic.name}`,
      itemType: 'SERVICE',
      quantity: 1,
      unitPrice: 75000,
    },
    ...pharmacyItems.map((item) => ({
      itemName: item.medicineName,
      itemType: 'PHARMACY',
      quantity: 1,
      unitPrice: 15000,
    })),
  ]

  await api.post<
    ApiCashierBill,
    {
      registrationId: string
      note: string
      items: Array<{
        itemName: string
        itemType: string
        quantity: number
        unitPrice: number
      }>
    }
  >('/cashier-bills', {
    registrationId: registration.id,
    note: 'Tagihan otomatis dari pemeriksaan rawat jalan.',
    items: billItems,
  })

  return 'Tagihan kasir otomatis berhasil dibentuk.'
}

function OutpatientExaminationPage() {
  const { id } = useParams()

  const [registration, setRegistration] = useState<ApiRegistration | null>(
    null,
  )
  const [medicalRecord, setMedicalRecord] =
    useState<ApiMedicalRecord | null>(null)
  const [form, setForm] = useState<ExamForm>(emptyExamForm)
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    createEmptyPrescription(),
  ])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [pharmacyMessage, setPharmacyMessage] = useState('')
  const [cashierMessage, setCashierMessage] = useState('')

  const updateExamField = (field: keyof ExamForm, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const updateVitalFieldTyping = (field: keyof ExamForm, value: string) => {
    updateExamField(field, normalizeVitalTyping(field, value))
  }

  const finalizeVitalField = (field: keyof ExamForm, value: string) => {
    updateExamField(field, normalizeVitalValue(field, value))
  }

  const removePrescriptionItem = (prescriptionId: string) => {
    setPrescriptions((currentPrescriptions) => {
      if (currentPrescriptions.length <= 1) {
        return [createEmptyPrescription()]
      }

      return currentPrescriptions.filter(
        (prescription) => prescription.id !== prescriptionId,
      )
    })
  }

  const loadPageData = async () => {
    if (!id) {
      setLoadError('ID registrasi tidak tersedia.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError('')

    try {
      const registrationResponse = await api.get<ApiRegistration>(
        `/registrations/${id}`,
      )

      setRegistration(registrationResponse)

      try {
        const medicalRecordResponse = await api.get<ApiMedicalRecord>(
          `/medical-records/registration/${id}`,
        )

        setMedicalRecord(medicalRecordResponse)
        setForm(
          mapMedicalRecordToForm(
            medicalRecordResponse,
            registrationResponse.chiefComplaint,
          ),
        )
        setPrescriptions(
          parsePrescriptionNote(medicalRecordResponse.prescriptionNote),
        )
        setIsSaved(true)
      } catch {
        setMedicalRecord(null)
        setForm({
          ...emptyExamForm,
          chiefComplaint: registrationResponse.chiefComplaint ?? '',
        })
        setPrescriptions([createEmptyPrescription()])
        setIsSaved(false)
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memuat data pemeriksaan rawat jalan.'

      setRegistration(null)
      setMedicalRecord(null)
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPageData()
  }, [id])

  const updateField = <K extends keyof ExamForm>(
    field: K,
    value: ExamForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    if (isSaved) {
      setIsSaved(false)
    }

    if (submitError) {
      setSubmitError('')
    }
  }

  const applyDrugCatalogItem = (
    prescriptionId: string,
    medicineName: string,
  ) => {
    const selectedDrug = drugCatalog.find((drug) => drug.name === medicineName)

    setPrescriptions((currentPrescriptions) =>
      currentPrescriptions.map((prescription) =>
        prescription.id === prescriptionId
          ? {
              ...prescription,
              medicineName,
              medicineForm:
                selectedDrug?.form || prescription.medicineForm || '',
              dosage:
                selectedDrug?.defaultDosage || prescription.dosage || '',
              frequency:
                selectedDrug?.defaultFrequency || prescription.frequency || '',
              quantity:
                selectedDrug?.defaultQuantity || prescription.quantity || '',
              instruction:
                selectedDrug?.defaultInstruction ||
                prescription.instruction ||
                '',
            }
          : prescription,
      ),
    )
  }

  const updatePrescription = (
    itemId: string,
    field: keyof Omit<PrescriptionItem, 'id'>,
    value: string,
  ) => {
    setPrescriptions((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    )

    if (isSaved) {
      setIsSaved(false)
    }

    if (submitError) {
      setSubmitError('')
    }
  }

  const addPrescription = () => {
    setPrescriptions((current) => [...current, createEmptyPrescription()])
  }

  const validPrescriptions = prescriptions.filter(
    (item) =>
      item.medicineName.trim() !== '' &&
      item.dosage.trim() !== '' &&
      item.frequency.trim() !== '' &&
      item.quantity.trim() !== '',
  )

  const completion = useMemo(() => {
    const subjectiveComplete =
      form.chiefComplaint.trim() !== '' &&
      form.currentHistory.trim() !== ''

    const vitalComplete =
      form.bloodPressure.trim() !== '' &&
      form.pulse.trim() !== '' &&
      form.temperature.trim() !== '' &&
      form.weight.trim() !== ''

    const assessmentComplete =
      form.workingDiagnosis.trim() !== '' &&
      form.carePlan.trim() !== ''

    return {
      subjectiveComplete,
      vitalComplete,
      assessmentComplete,
      allComplete:
        subjectiveComplete && vitalComplete && assessmentComplete,
    }
  }, [form])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowValidation(true)
    setSubmitError('')
    setPharmacyMessage('')
    setCashierMessage('')

    if (!registration || !completion.allComplete) {
      setIsSaved(false)
      return
    }

    setIsSaving(true)

    const payload = {
      registrationId: registration.id,
      anamnesis: buildAnamnesis(form),
      physicalExamination: buildPhysicalExamination(form),
      diagnosis: form.workingDiagnosis,
      treatmentPlan: buildTreatmentPlan(form),
      prescriptionNote: buildPrescriptionNote(validPrescriptions),
    }

    try {
      if (medicalRecord) {
        const updated = await api.patch<
          ApiMedicalRecord,
          Omit<typeof payload, 'registrationId'>
        >(`/medical-records/${medicalRecord.id}`, {
          anamnesis: payload.anamnesis,
          physicalExamination: payload.physicalExamination,
          diagnosis: payload.diagnosis,
          treatmentPlan: payload.treatmentPlan,
          prescriptionNote: payload.prescriptionNote,
        })

        setMedicalRecord(updated)
      } else {
        const created = await api.post<ApiMedicalRecord, typeof payload>(
          '/medical-records',
          payload,
        )

        setMedicalRecord(created)
      }

      if (validPrescriptions.length > 0) {
        try {
          const message = await ensurePharmacyOrder(
            registration.id,
            validPrescriptions,
          )

          setPharmacyMessage(message)
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Order farmasi belum berhasil dibuat.'

          setPharmacyMessage(
            `RME tersimpan, namun order farmasi belum terbentuk: ${message}`,
          )
        }
      } else {
        setPharmacyMessage('Pemeriksaan tersimpan tanpa order farmasi.')
      }

      try {
        const cashierResult = await ensureCashierBill(
          registration,
          validPrescriptions,
        )

        setCashierMessage(cashierResult)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Tagihan kasir belum berhasil dibuat.'

        setCashierMessage(
          `RME tersimpan, namun tagihan kasir belum terbentuk: ${message}`,
        )
      }

      setIsSaved(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Pemeriksaan gagal disimpan ke backend.'

      setIsSaved(false)
      setSubmitError(message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Memuat Data</small>
          <h1>Pemeriksaan rawat jalan sedang disiapkan</h1>
          <p>Mengambil data registrasi dan RME dari backend SIMRS.</p>
        </section>
      </main>
    )
  }

  if (!registration) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Data Tidak Ditemukan</small>
          <h1>Pasien rawat jalan tidak tersedia</h1>
          <p>
            {loadError ||
              'Registrasi yang dipilih tidak ditemukan pada backend SIMRS.'}
          </p>
          <Link to="/rawat-jalan">Kembali ke Rawat Jalan</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="outpatient-exam-app">
      <aside className="dashboard-sidebar-pro">
        <div className="sidebar-brand-pro">
          <span>SIMRS</span>
          <strong>SIMTECH</strong>
          <p>Type D / C Demo Platform</p>
        </div>

        <nav className="sidebar-menu-pro">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/pendaftaran">Pendaftaran</Link>
          <Link className="active" to="/rawat-jalan">
            Rawat Jalan
          </Link>
          <Link to="/igd">IGD</Link>
          <Link to="/rme">RME</Link>
          <Link to="/farmasi">Farmasi</Link>
          <Link to="/kasir">Kasir</Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Pemeriksaan awal rawat jalan</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="outpatient-exam-content">
        <header className="outpatient-exam-header">
          <div className="outpatient-exam-heading">
            <Link className="breadcrumb-link" to="/rawat-jalan">
              ← Kembali ke Rawat Jalan
            </Link>

            <small>Pemeriksaan Rawat Jalan</small>
            <h1>{registration.patient.fullName}</h1>
            <p>
              Form pemeriksaan awal untuk mendokumentasikan anamnesis, vital sign,
              assessment, rencana tindak lanjut, dan resep awal pasien poli.
            </p>
          </div>

          <div className="exam-status-card">
            <span>Status Pemeriksaan</span>
            <strong>{isSaved ? 'Tersimpan' : 'Draft'}</strong>
            <p>{registration.clinic.name}</p>
          </div>
        </header>

        {isSaved && (
          <section className="exam-success-banner">
            <div>
              <small>Pemeriksaan Tersimpan</small>
              <strong>Catatan medis berhasil direkam ke backend</strong>
              <p>
                Data pasien <b>{registration.patient.fullName}</b> telah masuk
                ke modul RME. Status kunjungan otomatis diperbarui setelah rekam
                medis pertama kali dibuat.
              </p>
              {pharmacyMessage && <p>{pharmacyMessage}</p>}
              {cashierMessage && <p>{cashierMessage}</p>}
            </div>

            <Link to="/rme">Lihat Modul RME</Link>
          </section>
        )}

        {submitError && (
          <section className="registration-warning-banner">
            <strong>Pemeriksaan belum tersimpan.</strong>
            <span>{submitError}</span>
          </section>
        )}

        {showValidation && !completion.allComplete && (
          <section className="registration-warning-banner">
            <strong>Data pemeriksaan belum lengkap.</strong>
            <span>
              Isi keluhan, riwayat singkat, tanda vital, diagnosis kerja, dan
              rencana layanan sebelum menyimpan pemeriksaan.
            </span>
          </section>
        )}

        <section className="patient-clinical-summary">
          <article>
            <span>No. RM</span>
            <strong>{registration.patient.medicalRecordNo}</strong>
          </article>

          <article>
            <span>Antrean</span>
            <strong>{buildQueue(registration)}</strong>
          </article>

          <article>
            <span>Nomor Registrasi</span>
            <strong>{registration.registrationNo}</strong>
          </article>

          <article>
            <span>Tujuan Poli</span>
            <strong>{registration.clinic.name}</strong>
          </article>
        </section>

        <form className="outpatient-exam-layout" onSubmit={handleSubmit}>
          <section className="outpatient-exam-main">
            <article className="patient-form-panel">
              <div className="patient-form-title">
                <small>01. Subjektif</small>
                <h2>Anamnesis Pasien</h2>
              </div>

              <div className="form-grid">
                <label>
                  <span>Keluhan Utama</span>
                  <textarea
                    value={form.chiefComplaint}
                    onChange={(event) =>
                      updateField('chiefComplaint', event.target.value)
                    }
                    placeholder="Tuliskan keluhan utama pasien"
                    rows={4}
                  />
                  {showValidation && form.chiefComplaint.trim() === '' && (
                    <em className="field-alert">Keluhan utama wajib diisi.</em>
                  )}
                </label>

                <label>
                  <span>Riwayat Penyakit Sekarang</span>
                  <textarea
                    value={form.currentHistory}
                    onChange={(event) =>
                      updateField('currentHistory', event.target.value)
                    }
                    placeholder="Ringkasan gejala, onset, dan keluhan tambahan"
                    rows={4}
                  />
                </label>
              </div>
            </article>

            <article className="patient-form-panel">
              <div className="patient-form-title">
                <small>02. Objektif</small>
                <h2>Tanda Vital</h2>
              </div>

              <div className="form-grid two-columns">
                <label>
                  <span>Tekanan Darah</span>
                  <div className="vital-input-with-unit">
                    <input
                      value={form.bloodPressure}
                      onChange={(event) =>
                        updateVitalFieldTyping('bloodPressure', event.target.value)
                      }
                      onBlur={(event) =>
                        finalizeVitalField('bloodPressure', event.target.value)
                      }
                      placeholder="Contoh: 120/80"
                    />
                    <span>{vitalUnitByField.bloodPressure}</span>
                  </div>
                  </label>

                <label>
                  <span>Nadi</span>
                  <div className="vital-input-with-unit">
                    <input
                      value={form.pulse}
                      onChange={(event) =>
                        updateVitalFieldTyping('pulse', event.target.value)
                      }
                      onBlur={(event) =>
                        finalizeVitalField('pulse', event.target.value)
                      }
                      placeholder="Contoh: 82"
                    />
                    <span>{vitalUnitByField.pulse}</span>
                  </div>
                  </label>

                <label>
                  <span>Suhu</span>
                  <div className="vital-input-with-unit">
                    <input
                      value={form.temperature}
                      onChange={(event) =>
                        updateVitalFieldTyping('temperature', event.target.value)
                      }
                      onBlur={(event) =>
                        finalizeVitalField('temperature', event.target.value)
                      }
                      placeholder="Contoh: 36.8"
                    />
                    <span>{vitalUnitByField.temperature}</span>
                  </div>
                  </label>

                <label>
                  <span>Berat Badan</span>
                  <div className="vital-input-with-unit">
                    <input
                      value={form.weight}
                      onChange={(event) =>
                        updateVitalFieldTyping('weight', event.target.value)
                      }
                      onBlur={(event) =>
                        finalizeVitalField('weight', event.target.value)
                      }
                      placeholder="Contoh: 70"
                    />
                    <span>{vitalUnitByField.weight}</span>
                  </div>
                  </label>
              </div>
            </article>

            <article className="patient-form-panel">
              <div className="patient-form-title">
                <small>03. Assessment & Plan</small>
                <h2>Kesimpulan Pemeriksaan</h2>
              </div>

              <div className="form-grid">
                <label>
                  <span>Diagnosis Kerja Awal</span>
                  <textarea
                    value={form.workingDiagnosis}
                    onChange={(event) =>
                      updateField('workingDiagnosis', event.target.value)
                    }
                    placeholder="Contoh: Dispepsia, observasi hipertensi, dsb."
                    rows={3}
                  />
                </label>

                <label>
                  <span>Rencana Tindak Lanjut</span>
                  <textarea
                    value={form.carePlan}
                    onChange={(event) =>
                      updateField('carePlan', event.target.value)
                    }
                    placeholder="Contoh: pemberian terapi, resep, kontrol ulang"
                    rows={3}
                  />
                </label>

                <label>
                  <span>Catatan Dokter</span>
                  <textarea
                    value={form.doctorNote}
                    onChange={(event) =>
                      updateField('doctorNote', event.target.value)
                    }
                    placeholder="Catatan tambahan, bila diperlukan"
                    rows={3}
                  />
                </label>
              </div>
            </article>

            <article className="patient-form-panel">
              <div className="patient-form-title prescription-title-row">
                <div>
                  <small>04. Resep Obat</small>
                  <h2>Resep Awal ke Farmasi</h2>
                </div>

                <button
                  type="button"
                  className="add-prescription-button"
                  onClick={addPrescription}
                >
                  + Tambah Obat
                </button>
              </div>

              <div className="prescription-list">
                {prescriptions.map((item, index) => (
                  <div className="prescription-card" key={item.id}>
                    <div className="prescription-card-header">
                      <strong>Obat {index + 1}</strong>

                      <button
                        type="button"
                        className="remove-prescription-button"
                        onClick={() => removePrescriptionItem(item.id)}
                      >
                        Hapus
                      </button>
                    </div>

                    <div className="form-grid two-columns">
                      <label>
                        <span>Nama Obat</span>
                        <select
                          value={item.medicineName}
                          onChange={(event) =>
                            applyDrugCatalogItem(item.id, event.target.value)
                          }
                        >
                          <option value="">Pilih obat dari database</option>
                          {drugCatalog.map((drug) => (
                            <option value={drug.name} key={drug.name}>
                              {drug.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Bentuk / Sediaan</span>
                        <select
                          value={item.medicineForm}
                          onChange={(event) =>
                            updatePrescription(
                              item.id,
                              'medicineForm',
                              event.target.value,
                            )
                          }
                        >
                          <option value="">Pilih bentuk obat</option>
                          {medicineFormOptions.map((formOption) => (
                            <option value={formOption} key={formOption}>
                              {formOption}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Dosis</span>
                        <select
                          value={item.dosage}
                          onChange={(event) =>
                            updatePrescription(
                              item.id,
                              'dosage',
                              event.target.value,
                            )
                          }
                        >
                          <option value="">Pilih dosis</option>
                          {(dosageOptionsByForm[item.medicineForm] ?? [
                            '1 tablet',
                            '1 kapsul',
                            '1 sendok takar',
                            '1 bungkus',
                          ]).map((dosageOption) => (
                            <option value={dosageOption} key={dosageOption}>
                              {dosageOption}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Frekuensi</span>
                        <select
                          value={item.frequency}
                          onChange={(event) =>
                            updatePrescription(
                              item.id,
                              'frequency',
                              event.target.value,
                            )
                          }
                        >
                          <option value="">Pilih frekuensi</option>
                          {frequencyOptions.map((frequencyOption) => (
                            <option
                              value={frequencyOption}
                              key={frequencyOption}
                            >
                              {frequencyOption}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Jumlah</span>
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(event) =>
                            updatePrescription(
                              item.id,
                              'quantity',
                              event.target.value,
                            )
                          }
                          placeholder="Contoh: 10 tablet / 1 botol"
                        />
                      </label>

                      <label>
                        <span>Aturan Pakai</span>
                        <select
                          value={item.instruction}
                          onChange={(event) =>
                            updatePrescription(
                              item.id,
                              'instruction',
                              event.target.value,
                            )
                          }
                        >
                          <option value="">Pilih aturan pakai</option>
                          {instructionOptions.map((instructionOption) => (
                            <option
                              value={instructionOption}
                              key={instructionOption}
                            >
                              {instructionOption}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="full-span">
                        <span>Catatan Pakai Manual</span>
                        <input
                          type="text"
                          value={item.instruction}
                          onChange={(event) =>
                            updatePrescription(
                              item.id,
                              'instruction',
                              event.target.value,
                            )
                          }
                          placeholder="Boleh diketik manual jika aturan tidak tersedia"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <aside className="outpatient-exam-summary">
            <article className="summary-panel-pro">
              <div className="patient-form-title">
                <small>Ringkasan Pemeriksaan</small>
                <h2>Kelengkapan Data</h2>
              </div>

              <div className="summary-checklist">
                <div>
                  <span>Anamnesis</span>
                  <strong
                    className={completion.subjectiveComplete ? 'complete' : ''}
                  >
                    {completion.subjectiveComplete
                      ? 'Lengkap'
                      : 'Belum lengkap'}
                  </strong>
                </div>

                <div>
                  <span>Tanda Vital</span>
                  <strong
                    className={completion.vitalComplete ? 'complete' : ''}
                  >
                    {completion.vitalComplete ? 'Lengkap' : 'Belum lengkap'}
                  </strong>
                </div>

                <div>
                  <span>Assessment & Plan</span>
                  <strong
                    className={completion.assessmentComplete ? 'complete' : ''}
                  >
                    {completion.assessmentComplete
                      ? 'Lengkap'
                      : 'Belum lengkap'}
                  </strong>
                </div>

                <div>
                  <span>Resep ke Farmasi</span>
                  <strong
                    className={validPrescriptions.length > 0 ? 'complete' : ''}
                  >
                    {validPrescriptions.length > 0
                      ? `${validPrescriptions.length} Obat`
                      : 'Opsional'}
                  </strong>
                </div>
              </div>

              <div className="clinical-summary-card">
                <small>Pasien</small>
                <strong>{registration.patient.fullName}</strong>
                <p>
                  {registration.clinic.name} ·{' '}
                  {registration.patient.medicalRecordNo}
                </p>
              </div>

              <div className="form-submit-actions">
                <button
                  className="save-patient-button"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving
                    ? 'Menyimpan Pemeriksaan...'
                    : medicalRecord
                      ? 'Perbarui Pemeriksaan'
                      : 'Simpan Pemeriksaan'}
                </button>

                <Link className="cancel-patient-link" to="/rawat-jalan">
                  Kembali ke Rawat Jalan
                </Link>
              </div>
            </article>
          </aside>
        </form>
      </section>
    </main>
  )
}

export default OutpatientExaminationPage
