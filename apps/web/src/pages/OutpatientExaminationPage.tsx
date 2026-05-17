import { FormEvent, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getRegistrationById } from '../lib/registrationStorage'
import {
  getOutpatientExamByRegistrationId,
  saveOutpatientExam,
  type OutpatientExam,
  type PrescriptionItem,
} from '../lib/outpatientStorage'

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

function OutpatientExaminationPage() {
  const { id } = useParams()
  const registration = id ? getRegistrationById(id) : undefined
  const existingExam = id ? getOutpatientExamByRegistrationId(id) : undefined

  const [form, setForm] = useState<ExamForm>(() =>
    existingExam
      ? {
          chiefComplaint: existingExam.chiefComplaint,
          currentHistory: existingExam.currentHistory,
          bloodPressure: existingExam.bloodPressure,
          pulse: existingExam.pulse,
          temperature: existingExam.temperature,
          weight: existingExam.weight,
          workingDiagnosis: existingExam.workingDiagnosis,
          carePlan: existingExam.carePlan,
          doctorNote: existingExam.doctorNote,
        }
      : emptyExamForm,
  )

  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>(
    existingExam?.prescriptions?.length
      ? existingExam.prescriptions
      : [createEmptyPrescription()],
  )

  const [isSaved, setIsSaved] = useState(
    existingExam?.status === 'Pemeriksaan Selesai',
  )

  const [showValidation, setShowValidation] = useState(false)

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

  if (!registration) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Data Tidak Ditemukan</small>
          <h1>Pasien rawat jalan tidak tersedia</h1>
          <p>Registrasi yang dipilih tidak ditemukan pada data demo.</p>
          <Link to="/rawat-jalan">Kembali ke Rawat Jalan</Link>
        </section>
      </main>
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowValidation(true)

    if (!completion.allComplete) {
      setIsSaved(false)
      return
    }

    const exam: OutpatientExam = {
      registrationId: registration.id,
      chiefComplaint: form.chiefComplaint,
      currentHistory: form.currentHistory,
      bloodPressure: form.bloodPressure,
      pulse: form.pulse,
      temperature: form.temperature,
      weight: form.weight,
      workingDiagnosis: form.workingDiagnosis,
      carePlan: form.carePlan,
      doctorNote: form.doctorNote,
      prescriptions: validPrescriptions,
      status: 'Pemeriksaan Selesai',
      updatedAt: new Date().toISOString(),
    }

    saveOutpatientExam(exam)
    setIsSaved(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
            <h1>{registration.patient}</h1>
            <p>
              Form pemeriksaan awal untuk mendokumentasikan anamnesis, vital sign,
              assessment, rencana tindak lanjut, dan resep awal pasien poli.
            </p>
          </div>

          <div className="exam-status-card">
            <span>Status Pemeriksaan</span>
            <strong>{isSaved ? 'Selesai' : 'Draft'}</strong>
            <p>{registration.service}</p>
          </div>
        </header>

        {isSaved && (
          <section className="exam-success-banner">
            <div>
              <small>Pemeriksaan Demo Tersimpan</small>
              <strong>Catatan medis awal berhasil direkam</strong>
              <p>
                Data pasien <b>{registration.patient}</b> telah masuk ke RME.
                {validPrescriptions.length > 0 &&
                  ' Resep awal juga diteruskan ke modul Farmasi.'}
              </p>
            </div>

            <Link to="/farmasi">Lihat Antrian Farmasi</Link>
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
            <strong>{registration.rm}</strong>
          </article>

          <article>
            <span>Antrean</span>
            <strong>{registration.queue}</strong>
          </article>

          <article>
            <span>Penjamin</span>
            <strong>{registration.guarantor || '-'}</strong>
          </article>

          <article>
            <span>Tujuan Poli</span>
            <strong>{registration.service}</strong>
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
                    onChange={(event) => updateField('pulse', event.target.value)}
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
                    onChange={(event) => updateField('weight', event.target.value)}
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
                    onChange={(event) => updateField('carePlan', event.target.value)}
                    placeholder="Contoh: pemberian terapi, resep, kontrol ulang"
                    rows={3}
                  />
                </label>

                <label>
                  <span>Catatan Dokter</span>
                  <textarea
                    value={form.doctorNote}
                    onChange={(event) => updateField('doctorNote', event.target.value)}
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
                            updatePrescription(item.id, 'dosage', event.target.value)
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
                            updatePrescription(item.id, 'quantity', event.target.value)
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
                  <strong className={completion.subjectiveComplete ? 'complete' : ''}>
                    {completion.subjectiveComplete ? 'Lengkap' : 'Belum lengkap'}
                  </strong>
                </div>

                <div>
                  <span>Tanda Vital</span>
                  <strong className={completion.vitalComplete ? 'complete' : ''}>
                    {completion.vitalComplete ? 'Lengkap' : 'Belum lengkap'}
                  </strong>
                </div>

                <div>
                  <span>Assessment & Plan</span>
                  <strong className={completion.assessmentComplete ? 'complete' : ''}>
                    {completion.assessmentComplete ? 'Lengkap' : 'Belum lengkap'}
                  </strong>
                </div>

                <div>
                  <span>Resep ke Farmasi</span>
                  <strong className={validPrescriptions.length > 0 ? 'complete' : ''}>
                    {validPrescriptions.length > 0
                      ? `${validPrescriptions.length} Obat`
                      : 'Opsional'}
                  </strong>
                </div>
              </div>

              <div className="clinical-summary-card">
                <small>Pasien</small>
                <strong>{registration.patient}</strong>
                <p>
                  {registration.service} · {registration.rm}
                </p>
              </div>

              <div className="form-submit-actions">
                <button className="save-patient-button" type="submit">
                  {isSaved
                    ? 'Pemeriksaan Demo Tersimpan'
                    : 'Simpan Pemeriksaan Demo'}
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
