import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../lib/api'

type RegistrationStatusApi =
  | 'WAITING'
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'CANCELED'

type TriageLevelApi = 'RED' | 'YELLOW' | 'GREEN'

type AssessmentStatusApi =
  | 'WAITING_TRIAGE'
  | 'IN_ASSESSMENT'
  | 'TRIAGE_COMPLETED'

type TriageLevelUi = 'Merah' | 'Kuning' | 'Hijau'

type AssessmentStatusUi =
  | 'Menunggu Triage'
  | 'Dalam Asesmen'
  | 'Triage Selesai'

type ApiRegistration = {
  id: string
  registrationNo: string
  visitDate: string
  queueNumber: number
  chiefComplaint?: string | null
  status: RegistrationStatusApi
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

type ApiEmergencyAssessment = {
  id: string
  registrationId: string
  triageLevel: TriageLevelApi
  chiefComplaint?: string | null
  consciousness?: string | null
  bloodPressure?: string | null
  pulse?: string | null
  respiratoryRate?: string | null
  oxygenSaturation?: string | null
  emergencyNote?: string | null
  status: AssessmentStatusApi
  assessedAt?: string | null
  createdAt: string
  updatedAt: string
}

type EmergencyAssessmentForm = {
  id: string
  registrationId: string
  triageLevel: TriageLevelUi
  chiefComplaint: string
  consciousness: string
  bloodPressure: string
  pulse: string
  respiratoryRate: string
  oxygenSaturation: string
  emergencyNote: string
  status: AssessmentStatusUi
}

function mapTriageApiToUi(level: TriageLevelApi): TriageLevelUi {
  switch (level) {
    case 'RED':
      return 'Merah'
    case 'YELLOW':
      return 'Kuning'
    case 'GREEN':
      return 'Hijau'
    default:
      return 'Hijau'
  }
}

function mapTriageUiToApi(level: TriageLevelUi): TriageLevelApi {
  switch (level) {
    case 'Merah':
      return 'RED'
    case 'Kuning':
      return 'YELLOW'
    case 'Hijau':
      return 'GREEN'
    default:
      return 'GREEN'
  }
}

function mapStatusApiToUi(status: AssessmentStatusApi): AssessmentStatusUi {
  switch (status) {
    case 'WAITING_TRIAGE':
      return 'Menunggu Triage'
    case 'IN_ASSESSMENT':
      return 'Dalam Asesmen'
    case 'TRIAGE_COMPLETED':
      return 'Triage Selesai'
    default:
      return 'Menunggu Triage'
  }
}

function mapRegistrationStatus(status: RegistrationStatusApi) {
  switch (status) {
    case 'WAITING':
      return 'Menunggu'
    case 'IN_SERVICE':
      return 'Dalam Pelayanan'
    case 'COMPLETED':
      return 'Selesai'
    case 'CANCELED':
      return 'Dibatalkan'
    default:
      return 'Menunggu'
  }
}

function mapAssessmentToForm(
  assessment: ApiEmergencyAssessment,
): EmergencyAssessmentForm {
  return {
    id: assessment.id,
    registrationId: assessment.registrationId,
    triageLevel: mapTriageApiToUi(assessment.triageLevel),
    chiefComplaint: assessment.chiefComplaint ?? '',
    consciousness: assessment.consciousness ?? '',
    bloodPressure: assessment.bloodPressure ?? '',
    pulse: assessment.pulse ?? '',
    respiratoryRate: assessment.respiratoryRate ?? '',
    oxygenSaturation: assessment.oxygenSaturation ?? '',
    emergencyNote: assessment.emergencyNote ?? '',
    status: mapStatusApiToUi(assessment.status),
  }
}

async function ensureEmergencyAssessment(
  registration: ApiRegistration,
): Promise<ApiEmergencyAssessment> {
  try {
    return await api.get<ApiEmergencyAssessment>(
      `/emergency-assessments/registration/${registration.id}`,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : ''

    if (!message.toLowerCase().includes('not found')) {
      throw error
    }
  }

  return api.post<
    ApiEmergencyAssessment,
    {
      registrationId: string
      chiefComplaint?: string
    }
  >('/emergency-assessments', {
    registrationId: registration.id,
    chiefComplaint: registration.chiefComplaint ?? undefined,
  })
}

function EmergencyAssessmentPage() {
  const { id } = useParams()

  const [registration, setRegistration] =
    useState<ApiRegistration | null>(null)
  const [assessment, setAssessment] =
    useState<EmergencyAssessmentForm | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')

  const loadAssessmentPage = async () => {
    if (!id) {
      setLoadError('ID registrasi IGD tidak tersedia.')
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

      const assessmentResponse = await ensureEmergencyAssessment(
        registrationResponse,
      )

      const mappedAssessment = mapAssessmentToForm(assessmentResponse)

      setAssessment(mappedAssessment)
      setIsSaved(mappedAssessment.status === 'Triage Selesai')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memuat data asesmen IGD dari backend.'

      setRegistration(null)
      setAssessment(null)
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadAssessmentPage()
  }, [id])

  const completion = useMemo(() => {
    if (!assessment) {
      return {
        complaintComplete: false,
        vitalComplete: false,
        allComplete: false,
      }
    }

    const complaintComplete =
      assessment.chiefComplaint.trim() !== '' &&
      assessment.consciousness.trim() !== ''

    const vitalComplete =
      assessment.bloodPressure.trim() !== '' &&
      assessment.pulse.trim() !== '' &&
      assessment.respiratoryRate.trim() !== '' &&
      assessment.oxygenSaturation.trim() !== ''

    return {
      complaintComplete,
      vitalComplete,
      allComplete: complaintComplete && vitalComplete,
    }
  }, [assessment])

  const updateField = <K extends keyof EmergencyAssessmentForm>(
    field: K,
    value: EmergencyAssessmentForm[K],
  ) => {
    setAssessment((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        [field]: value,
        status:
          current.status === 'Menunggu Triage'
            ? 'Dalam Asesmen'
            : current.status,
      }
    })

    if (isSaved) {
      setIsSaved(false)
    }

    if (submitError) {
      setSubmitError('')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowValidation(true)
    setSubmitError('')

    if (!assessment || !completion.allComplete) {
      setIsSaved(false)
      return
    }

    setIsSaving(true)

    try {
      const response = await api.patch<
        ApiEmergencyAssessment,
        {
          triageLevel: TriageLevelApi
          chiefComplaint: string
          consciousness: string
          bloodPressure: string
          pulse: string
          respiratoryRate: string
          oxygenSaturation: string
          emergencyNote: string
          status: AssessmentStatusApi
        }
      >(`/emergency-assessments/${assessment.id}`, {
        triageLevel: mapTriageUiToApi(assessment.triageLevel),
        chiefComplaint: assessment.chiefComplaint,
        consciousness: assessment.consciousness,
        bloodPressure: assessment.bloodPressure,
        pulse: assessment.pulse,
        respiratoryRate: assessment.respiratoryRate,
        oxygenSaturation: assessment.oxygenSaturation,
        emergencyNote: assessment.emergencyNote,
        status: 'TRIAGE_COMPLETED',
      })

      setAssessment(mapAssessmentToForm(response))
      setIsSaved(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Asesmen IGD gagal disimpan ke backend.'

      setSubmitError(message)
      setIsSaved(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Memuat Asesmen</small>
          <h1>Data IGD sedang disiapkan</h1>
          <p>Mengambil registrasi dan triage pasien dari backend SIMRS.</p>
        </section>
      </main>
    )
  }

  if (!registration || !assessment) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Asesmen Tidak Ditemukan</small>
          <h1>Data pasien IGD belum tersedia</h1>
          <p>{loadError || 'Pastikan pasien terdaftar pada layanan IGD.'}</p>
          <Link to="/igd">Kembali ke Modul IGD</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="emergency-assessment-app">
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
          <Link className="active" to="/igd">
            IGD
          </Link>
          <Link to="/rme">RME</Link>
          <Link to="/farmasi">Farmasi</Link>
          <Link to="/kasir">Kasir</Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Form triage dan asesmen awal pasien</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="emergency-assessment-content">
        <header className="emergency-assessment-header">
          <div className="emergency-assessment-heading">
            <Link className="breadcrumb-link" to="/igd">
              ← Kembali ke Modul IGD
            </Link>

            <small>Asesmen Gawat Darurat</small>
            <h1>{registration.patient.fullName}</h1>
            <p>
              Form triage awal pasien IGD untuk menentukan tingkat prioritas
              dan kebutuhan respons pelayanan.
            </p>
          </div>

          <div className="emergency-assessment-status-card">
            <span>Status Asesmen</span>
            <strong>{assessment.status}</strong>
            <p>{assessment.triageLevel}</p>
          </div>
        </header>

        {isSaved && (
          <section className="emergency-success-banner">
            <div>
              <small>Triage Tersimpan</small>
              <strong>Asesmen IGD berhasil dicatat ke backend</strong>
              <p>
                Pasien <b>{registration.patient.fullName}</b> telah
                diklasifikasikan sebagai prioritas{' '}
                <b>{assessment.triageLevel}</b>.
              </p>
            </div>

            <Link to="/igd">Kembali ke Dashboard IGD</Link>
          </section>
        )}

        {submitError && (
          <section className="registration-warning-banner">
            <strong>Asesmen IGD belum tersimpan.</strong>
            <span>{submitError}</span>
          </section>
        )}

        {showValidation && !completion.allComplete && (
          <section className="registration-warning-banner">
            <strong>Data asesmen belum lengkap.</strong>
            <span>
              Isi keluhan utama, tingkat kesadaran, dan seluruh tanda vital
              sebelum menyimpan triage IGD.
            </span>
          </section>
        )}

        <section className="emergency-patient-summary">
          <article>
            <span>No. RM</span>
            <strong>{registration.patient.medicalRecordNo}</strong>
          </article>

          <article>
            <span>Antrean</span>
            <strong>
              IGD-{String(registration.queueNumber).padStart(3, '0')}
            </strong>
          </article>

          <article>
            <span>Layanan</span>
            <strong>{registration.clinic.name}</strong>
          </article>

          <article>
            <span>Status Registrasi</span>
            <strong>{mapRegistrationStatus(registration.status)}</strong>
          </article>
        </section>

        <form className="emergency-assessment-layout" onSubmit={handleSubmit}>
          <section className="emergency-assessment-main">
            <article className="patient-form-panel">
              <div className="patient-form-title">
                <small>01. Klasifikasi Triage</small>
                <h2>Prioritas Penanganan</h2>
              </div>

              <div className="triage-choice-grid">
                {(['Merah', 'Kuning', 'Hijau'] as TriageLevelUi[]).map(
                  (level) => (
                    <button
                      type="button"
                      key={level}
                      className={`triage-choice-card ${level.toLowerCase()} ${
                        assessment.triageLevel === level ? 'selected' : ''
                      }`}
                      onClick={() => updateField('triageLevel', level)}
                    >
                      <span>{level}</span>
                      <strong>
                        {level === 'Merah'
                          ? 'Gawat Darurat'
                          : level === 'Kuning'
                            ? 'Perlu Penanganan Cepat'
                            : 'Stabil / Non-Kritis'}
                      </strong>
                    </button>
                  ),
                )}
              </div>
            </article>

            <article className="patient-form-panel">
              <div className="patient-form-title">
                <small>02. Keluhan & Kesadaran</small>
                <h2>Asesmen Awal Pasien</h2>
              </div>

              <div className="form-grid">
                <label>
                  <span>Keluhan Utama</span>
                  <textarea
                    value={assessment.chiefComplaint}
                    onChange={(event) =>
                      updateField('chiefComplaint', event.target.value)
                    }
                    placeholder="Tuliskan keluhan utama pasien IGD"
                    rows={4}
                  />
                </label>

                <label>
                  <span>Tingkat Kesadaran</span>
                  <select
                    value={assessment.consciousness}
                    onChange={(event) =>
                      updateField('consciousness', event.target.value)
                    }
                  >
                    <option value="">Pilih tingkat kesadaran</option>
                    <option value="Compos mentis">Compos mentis</option>
                    <option value="Apatis">Apatis</option>
                    <option value="Somnolen">Somnolen</option>
                    <option value="Stupor">Stupor</option>
                    <option value="Koma">Koma</option>
                  </select>
                </label>
              </div>
            </article>

            <article className="patient-form-panel">
              <div className="patient-form-title">
                <small>03. Tanda Vital IGD</small>
                <h2>Parameter Klinis Awal</h2>
              </div>

              <div className="form-grid two-columns">
                <label>
                  <span>Tekanan Darah</span>
                  <input
                    type="text"
                    value={assessment.bloodPressure}
                    onChange={(event) =>
                      updateField('bloodPressure', event.target.value)
                    }
                    placeholder="Contoh: 110/70 mmHg"
                  />
                </label>

                <label>
                  <span>Nadi</span>
                  <input
                    type="text"
                    value={assessment.pulse}
                    onChange={(event) =>
                      updateField('pulse', event.target.value)
                    }
                    placeholder="Contoh: 96 x/menit"
                  />
                </label>

                <label>
                  <span>Respirasi</span>
                  <input
                    type="text"
                    value={assessment.respiratoryRate}
                    onChange={(event) =>
                      updateField('respiratoryRate', event.target.value)
                    }
                    placeholder="Contoh: 22 x/menit"
                  />
                </label>

                <label>
                  <span>Saturasi Oksigen</span>
                  <input
                    type="text"
                    value={assessment.oxygenSaturation}
                    onChange={(event) =>
                      updateField('oxygenSaturation', event.target.value)
                    }
                    placeholder="Contoh: 97%"
                  />
                </label>

                <label className="full-span">
                  <span>Catatan IGD</span>
                  <textarea
                    value={assessment.emergencyNote}
                    onChange={(event) =>
                      updateField('emergencyNote', event.target.value)
                    }
                    placeholder="Catatan singkat petugas IGD"
                    rows={4}
                  />
                </label>
              </div>
            </article>
          </section>

          <aside className="emergency-assessment-summary">
            <article className="summary-panel-pro">
              <div className="patient-form-title">
                <small>Ringkasan Triage</small>
                <h2>Kelengkapan Asesmen</h2>
              </div>

              <div className="summary-checklist">
                <div>
                  <span>Keluhan & Kesadaran</span>
                  <strong
                    className={completion.complaintComplete ? 'complete' : ''}
                  >
                    {completion.complaintComplete
                      ? 'Lengkap'
                      : 'Belum lengkap'}
                  </strong>
                </div>

                <div>
                  <span>Tanda Vital</span>
                  <strong
                    className={completion.vitalComplete ? 'complete' : ''}
                  >
                    {completion.vitalComplete
                      ? 'Lengkap'
                      : 'Belum lengkap'}
                  </strong>
                </div>

                <div>
                  <span>Triage Prioritas</span>
                  <strong className="complete">
                    {assessment.triageLevel}
                  </strong>
                </div>
              </div>

              <div
                className={`triage-summary-card ${assessment.triageLevel.toLowerCase()}`}
              >
                <small>Prioritas IGD</small>
                <strong>{assessment.triageLevel}</strong>
                <p>
                  Klasifikasi awal pasien berdasarkan kebutuhan respons layanan.
                </p>
              </div>

              <div className="form-submit-actions">
                <button
                  className="save-patient-button"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving
                    ? 'Menyimpan Triage...'
                    : isSaved
                      ? 'Triage Tersimpan'
                      : 'Simpan Triage IGD'}
                </button>

                <Link className="cancel-patient-link" to="/igd">
                  Kembali ke Dashboard IGD
                </Link>
              </div>
            </article>
          </aside>
        </form>
      </section>
    </main>
  )
}

export default EmergencyAssessmentPage
