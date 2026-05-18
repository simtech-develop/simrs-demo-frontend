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
  dosage: string
  frequency: string
  quantity: string
  instruction: string
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

const createEmptyPrescription = (): PrescriptionItem => ({
  id: `rx-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  medicineName: '',
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
        `${index + 1}. ${item.medicineName} | Dosis: ${item.dosage} | Frekuensi: ${
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

  const removePrescription = (itemId: string) => {
    setPrescriptions((current) =>
      current.length === 1
        ? current
        : current.filter((item) => item.id !== itemId),
    )
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
                  <input
                    type="text"
                    value={form.bloodPressure}
                    onChange={(event) =>
                      updateField('bloodPressure', event.target.value)
                    }
                    placeholder="Contoh: 120/80 mmHg"
                  />
                </label>

                <label>
                  <span>Nadi</span>
                  <input
                    type="text"
                    value={form.pulse}
                    onChange={(event) =>
                      updateField('pulse', event.target.value)
                    }
                    placeholder="Contoh: 82 x/menit"
                  />
                </label>

                <label>
                  <span>Suhu</span>
                  <input
                    type="text"
                    value={form.temperature}
                    onChange={(event) =>
                      updateField('temperature', event.target.value)
                    }
                    placeholder="Contoh: 36.7 °C"
                  />
                </label>

                <label>
                  <span>Berat Badan</span>
                  <input
                    type="text"
                    value={form.weight}
                    onChange={(event) =>
                      updateField('weight', event.target.value)
                    }
                    placeholder="Contoh: 62 kg"
                  />
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
                        onClick={() => removePrescription(item.id)}
                      >
                        Hapus
                      </button>
                    </div>

                    <div className="form-grid two-columns">
                      <label>
                        <span>Nama Obat</span>
                        <input
                          type="text"
                          value={item.medicineName}
                          onChange={(event) =>
                            updatePrescription(
                              item.id,
                              'medicineName',
                              event.target.value,
                            )
                          }
                          placeholder="Contoh: Paracetamol 500 mg"
                        />
                      </label>

                      <label>
                        <span>Dosis</span>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(event) =>
                            updatePrescription(
                              item.id,
                              'dosage',
                              event.target.value,
                            )
                          }
                          placeholder="Contoh: 1 tablet"
                        />
                      </label>

                      <label>
                        <span>Frekuensi</span>
                        <input
                          type="text"
                          value={item.frequency}
                          onChange={(event) =>
                            updatePrescription(
                              item.id,
                              'frequency',
                              event.target.value,
                            )
                          }
                          placeholder="Contoh: 3x sehari"
                        />
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
                          placeholder="Contoh: 10 tablet"
                        />
                      </label>

                      <label className="full-span">
                        <span>Aturan / Catatan Pakai</span>
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
                          placeholder="Contoh: diminum sesudah makan"
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
