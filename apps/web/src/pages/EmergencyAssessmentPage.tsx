import { FormEvent, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getRegistrationById } from '../lib/registrationStorage'
import {
  ensureEmergencyAssessment,
  saveEmergencyAssessment,
  type EmergencyAssessment,
  type EmergencyTriageLevel,
} from '../lib/emergencyStorage'

function EmergencyAssessmentPage() {
  const { id } = useParams()
  const registration = id ? getRegistrationById(id) : undefined

  const [assessment, setAssessment] = useState<EmergencyAssessment | undefined>(
    () => (id ? ensureEmergencyAssessment(id) : undefined),
  )

  const [showValidation, setShowValidation] = useState(false)
  const [isSaved, setIsSaved] = useState(
    assessment?.status === 'Triage Selesai',
  )

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

  if (!registration || !assessment) {
    return (
      <main className="detail-not-found-page">
        <section className="detail-not-found-card">
          <small>Asesmen Tidak Ditemukan</small>
          <h1>Data pasien IGD belum tersedia</h1>
          <p>Pastikan pasien terdaftar pada layanan IGD.</p>
          <Link to="/igd">Kembali ke Modul IGD</Link>
        </section>
      </main>
    )
  }

  const updateField = <K extends keyof EmergencyAssessment>(
    field: K,
    value: EmergencyAssessment[K],
  ) => {
    setAssessment((current) =>
      current
        ? {
            ...current,
            [field]: value,
            status:
              current.status === 'Menunggu Triage'
                ? 'Dalam Asesmen'
                : current.status,
            updatedAt: new Date().toISOString(),
          }
        : current,
    )

    if (isSaved) {
      setIsSaved(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowValidation(true)

    if (!completion.allComplete) {
      setIsSaved(false)
      return
    }

    const savedAssessment: EmergencyAssessment = {
      ...assessment,
      status: 'Triage Selesai',
      updatedAt: new Date().toISOString(),
    }

    saveEmergencyAssessment(savedAssessment)
    setAssessment(savedAssessment)
    setIsSaved(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
            <h1>{registration.patient}</h1>
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
              <small>Triage Demo Tersimpan</small>
              <strong>Asesmen IGD berhasil dicatat</strong>
              <p>
                Pasien <b>{registration.patient}</b> telah diklasifikasikan
                sebagai prioritas <b>{assessment.triageLevel}</b>.
              </p>
            </div>

            <Link to="/igd">Kembali ke Dashboard IGD</Link>
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
            <strong>{registration.rm}</strong>
          </article>

          <article>
            <span>Antrean</span>
            <strong>{registration.queue}</strong>
          </article>

          <article>
            <span>Layanan</span>
            <strong>{registration.service}</strong>
          </article>

          <article>
            <span>Status Registrasi</span>
            <strong>{registration.status}</strong>
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
                {(['Merah', 'Kuning', 'Hijau'] as EmergencyTriageLevel[]).map(
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
                    <option value="Compos Mentis">Compos Mentis</option>
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
                  <strong className={completion.complaintComplete ? 'complete' : ''}>
                    {completion.complaintComplete ? 'Lengkap' : 'Belum lengkap'}
                  </strong>
                </div>

                <div>
                  <span>Tanda Vital</span>
                  <strong className={completion.vitalComplete ? 'complete' : ''}>
                    {completion.vitalComplete ? 'Lengkap' : 'Belum lengkap'}
                  </strong>
                </div>

                <div>
                  <span>Triage Prioritas</span>
                  <strong className="complete">{assessment.triageLevel}</strong>
                </div>
              </div>

              <div className={`triage-summary-card ${assessment.triageLevel.toLowerCase()}`}>
                <small>Prioritas IGD</small>
                <strong>{assessment.triageLevel}</strong>
                <p>
                  Klasifikasi awal pasien berdasarkan kebutuhan respons layanan.
                </p>
              </div>

              <div className="form-submit-actions">
                <button className="save-patient-button" type="submit">
                  {isSaved ? 'Triage Demo Tersimpan' : 'Simpan Triage IGD'}
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
