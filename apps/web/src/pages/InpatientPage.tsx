import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { writeStorage } from '../services/simrsStorage'
import { simrsStorageKeys } from '../services/simrsStorageKeys'

type InpatientGuarantor = 'Umum' | 'BPJS' | 'Asuransi Lain'

type InpatientAdmissionStatus =
  | 'Menunggu Kamar'
  | 'Kamar Disiapkan'
  | 'Masuk Rawat Inap'
  | 'Batal Rawat Inap'

type InpatientDailyCareForm = {
  nursingAssessment: string
  fallRisk: string
  painScale: string
  cpptNote: string
  doctorInstruction: string
  pharmacyOrder: string
  infusionOrder: string
  medicalSupplyOrder: string
  dailyRoomCost: number
  doctorVisitCost: number
  nursingActionCost: number
  pharmacyCost: number
  dischargePlan: string
  dischargeStatus: 'Belum Direncanakan' | 'Rencana Pulang' | 'Siap Pulang' | 'Batal Pulang'
}

const inpatientDailyCareStorageKey = simrsStorageKeys.inpatientDailyCare

const initialDailyCareForm: InpatientDailyCareForm = {
  nursingAssessment:
    'Pasien masuk ruang rawat inap, kondisi umum stabil, masih perlu observasi pasca tindakan.',
  fallRisk: 'Sedang',
  painScale: '4',
  cpptNote:
    'Pasien pasca penanganan IGD merah. Monitoring tanda vital, keluhan sesak, dan respon terapi.',
  doctorInstruction:
    'Observasi tanda vital tiap 4 jam, lanjutkan terapi sesuai instruksi, evaluasi ulang besok pagi.',
  pharmacyOrder: 'Paracetamol injeksi, antibiotik sesuai indikasi, obat simptomatik',
  infusionOrder: 'RL 20 tpm',
  medicalSupplyOrder: 'Infus set, spuit, kasa steril, plester',
  dailyRoomCost: 350000,
  doctorVisitCost: 250000,
  nursingActionCost: 150000,
  pharmacyCost: 300000,
  dischargePlan:
    'Rencana pulang ditentukan setelah kondisi stabil dan DPJP menyatakan pasien layak pulang.',
  dischargeStatus: 'Belum Direncanakan',
}

const fallRiskOptions = ['Rendah', 'Sedang', 'Tinggi']
const dischargeStatusOptions: InpatientDailyCareForm['dischargeStatus'][] = [
  'Belum Direncanakan',
  'Rencana Pulang',
  'Siap Pulang',
  'Batal Pulang',
]

const normalizeMoneyInput = (value: string) => {
  const digitsOnly = value.replace(/\D/g, '')
  const normalizedValue = digitsOnly.replace(/^0+(?=\d)/, '')

  return Number(normalizedValue || '0')
}


type InpatientAdmissionForm = {
  patientName: string
  medicalRecordNo: string
  sourceUnit: string
  guarantor: InpatientGuarantor
  insuranceNumber: string
  careClass: string
  ward: string
  bed: string
  dpjp: string
  admissionStatus: InpatientAdmissionStatus
  clinicalNote: string
}

const inpatientAdmissionStorageKey = simrsStorageKeys.inpatientAdmission

const initialAdmissionForm: InpatientAdmissionForm = {
  patientName: 'Romi',
  medicalRecordNo: 'RM-2026-113187',
  sourceUnit: 'IGD / Ruang Tindakan',
  guarantor: 'BPJS',
  insuranceNumber: '0001234567890',
  careClass: 'Kelas 2',
  ward: 'Ruang Mawar',
  bed: 'MWR-201-A',
  dpjp: 'dr. Budi Santoso, Sp.PD',
  admissionStatus: 'Menunggu Kamar',
  clinicalNote:
    'Pasien pasca penanganan IGD merah, perlu monitoring lanjutan di rawat inap.',
}

const guarantorNotes: Record<InpatientGuarantor, string> = {
  Umum:
    'Pasien umum/mandiri. Administrasi rawat inap menggunakan estimasi biaya dan deposit sesuai kebijakan rumah sakit.',
  BPJS:
    'Pasien BPJS. Pastikan SEP, kelas hak rawat, eligibilitas, dan rencana rawat inap sudah tervalidasi.',
  'Asuransi Lain':
    'Pasien asuransi lain. Pastikan kartu/polis, surat jaminan, plafon manfaat, dan persetujuan penjamin.',
}

const classOptions = ['Kelas 3', 'Kelas 2', 'Kelas 1', 'VIP']
const wardOptions = [
  'Ruang Mawar',
  'Ruang Melati',
  'Ruang Anggrek',
  'Ruang Perawatan Anak',
  'Ruang Isolasi',
]
const bedOptions = ['MWR-201-A', 'MWR-201-B', 'MLT-102-A', 'AGR-301-A', 'ISO-01']
const dpjpOptions = [
  'dr. Budi Santoso, Sp.PD',
  'dr. Andi Pratama',
  'dr. Maya Lestari, Sp.A',
  'dr. Rina Kusuma, Sp.B',
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)

function InpatientPage() {
  const [admission, setAdmission] =
    useState<InpatientAdmissionForm>(initialAdmissionForm)
  const [isSaved, setIsSaved] = useState(false)

  const [dailyCare, setDailyCare] =
    useState<InpatientDailyCareForm>(initialDailyCareForm)
  const [isDailyCareSaved, setIsDailyCareSaved] = useState(false)

  const totalDailyCareCost = useMemo(
    () =>
      dailyCare.dailyRoomCost +
      dailyCare.doctorVisitCost +
      dailyCare.nursingActionCost +
      dailyCare.pharmacyCost,
    [dailyCare],
  )

  const updateDailyCare = <K extends keyof InpatientDailyCareForm>(
    field: K,
    value: InpatientDailyCareForm[K],
  ) => {
    setDailyCare((currentDailyCare) => ({
      ...currentDailyCare,
      [field]: value,
    }))

    if (isDailyCareSaved) {
      setIsDailyCareSaved(false)
    }
  }

  const saveDailyCare = () => {
    const payload = {
      ...dailyCare,
      patientName: admission.patientName,
      medicalRecordNo: admission.medicalRecordNo,
      guarantor: admission.guarantor,
      ward: admission.ward,
      bed: admission.bed,
      dpjp: admission.dpjp,
      totalDailyCareCost,
      savedAt: new Date().toISOString(),
      source: 'Rawat Inap',
    }

    writeStorage(inpatientDailyCareStorageKey, payload)

    setIsDailyCareSaved(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const estimatedDeposit = useMemo(() => {
    if (admission.guarantor === 'BPJS') {
      return 0
    }

    if (admission.guarantor === 'Asuransi Lain') {
      return 1000000
    }

    if (admission.careClass === 'VIP') {
      return 3000000
    }

    if (admission.careClass === 'Kelas 1') {
      return 2000000
    }

    return 1000000
  }, [admission.careClass, admission.guarantor])

  const updateAdmission = <K extends keyof InpatientAdmissionForm>(
    field: K,
    value: InpatientAdmissionForm[K],
  ) => {
    setAdmission((currentAdmission) => ({
      ...currentAdmission,
      [field]: value,
    }))

    if (isSaved) {
      setIsSaved(false)
    }
  }

  const saveAdmission = () => {
    const payload = {
      ...admission,
      estimatedDeposit,
      savedAt: new Date().toISOString(),
      source: 'Ruang Tindakan / IGD',
    }

    writeStorage(inpatientAdmissionStorageKey, payload)

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
          <Link className="active" to="/rawat-inap">
            Rawat Inap
          </Link>
          <Link to="/rme">RME</Link>
          <Link to="/farmasi">Farmasi</Link>
          <Link to="/kasir">Kasir</Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Admission rawat inap</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="outpatient-content">
        <header className="outpatient-header">
          <div>
            <small>Modul Lanjutan IGD</small>
            <h1>Rawat Inap</h1>
            <p>
              Modul ini digunakan untuk proses admisi pasien dari IGD atau ruang
              tindakan menuju ruang perawatan rawat inap.
            </p>
          </div>

          <div className="outpatient-unit-card">
            <span>Status Modul</span>
            <strong>{admission.admissionStatus}</strong>
            <p>{admission.guarantor}</p>
          </div>
        </header>

        {isSaved && (
          <section className="registration-success-banner">
            <strong>Admisi rawat inap tersimpan.</strong>
            <span>
              Data pasien, kelas perawatan, ruang, DPJP, dan status penjamin
              sudah dicatat untuk demo rawat inap.
            </span>
          </section>
        )}

        {isDailyCareSaved && (
          <section className="registration-success-banner">
            <strong>Pelayanan rawat inap harian tersimpan.</strong>
            <span>
              Asesmen keperawatan, instruksi DPJP, order farmasi, biaya harian,
              dan rencana pulang sudah dicatat untuk demo rawat inap.
            </span>
          </section>
        )}

        <section className="outpatient-stat-grid">
          <article className="outpatient-stat-card">
            <span>Pasien Admission</span>
            <strong>1</strong>
            <small>Dari IGD / ruang tindakan</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Status Penjamin</span>
            <strong>{admission.guarantor}</strong>
            <small>{admission.careClass}</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Estimasi Deposit</span>
            <strong>{formatCurrency(estimatedDeposit)}</strong>
            <small>
              {admission.guarantor === 'BPJS'
                ? 'Mengikuti validasi SEP'
                : 'Estimasi awal'}
            </small>
          </article>
        </section>

        <section className="outpatient-panel inpatient-admission-panel">
          <div className="outpatient-panel-title">
            <small>Admission Rawat Inap</small>
            <h2>Data Admisi Pasien</h2>
            <p>
              Validasi pasien, penjamin, kelas perawatan, ruang, bed, dan DPJP
              sebelum pasien dipindahkan ke rawat inap.
            </p>
          </div>

          <div className="inpatient-form-grid">
            <label>
              <span>No. Rekam Medis</span>
              <input
                value={admission.medicalRecordNo}
                onChange={(event) =>
                  updateAdmission('medicalRecordNo', event.target.value)
                }
              />
            </label>

            <label>
              <span>Nama Pasien</span>
              <input
                value={admission.patientName}
                onChange={(event) =>
                  updateAdmission('patientName', event.target.value)
                }
              />
            </label>

            <label>
              <span>Asal Pasien</span>
              <input
                value={admission.sourceUnit}
                onChange={(event) =>
                  updateAdmission('sourceUnit', event.target.value)
                }
              />
            </label>

            <label>
              <span>Status Admisi</span>
              <select
                value={admission.admissionStatus}
                onChange={(event) =>
                  updateAdmission(
                    'admissionStatus',
                    event.target.value as InpatientAdmissionStatus,
                  )
                }
              >
                <option value="Menunggu Kamar">Menunggu Kamar</option>
                <option value="Kamar Disiapkan">Kamar Disiapkan</option>
                <option value="Masuk Rawat Inap">Masuk Rawat Inap</option>
                <option value="Batal Rawat Inap">Batal Rawat Inap</option>
              </select>
            </label>
          </div>
        </section>

        <section className="outpatient-panel inpatient-guarantor-panel">
          <div className="outpatient-panel-title">
            <small>Penjamin Pasien</small>
            <h2>Status Jenis Penjamin</h2>
            <p>
              Tentukan cara bayar pasien rawat inap: umum, BPJS, atau asuransi
              lain.
            </p>
          </div>

          <div className="inpatient-guarantor-buttons">
            {(['Umum', 'BPJS', 'Asuransi Lain'] as InpatientGuarantor[]).map(
              (guarantor) => (
                <button
                  className={admission.guarantor === guarantor ? 'active' : ''}
                  key={guarantor}
                  onClick={() => updateAdmission('guarantor', guarantor)}
                  type="button"
                >
                  <span>{guarantor}</span>
                  <small>
                    {guarantor === 'Umum'
                      ? 'Mandiri'
                      : guarantor === 'BPJS'
                        ? 'SEP / Eligibilitas'
                        : 'Polis / Surat Jaminan'}
                  </small>
                </button>
              ),
            )}
          </div>

          <div className="inpatient-guarantor-note">
            <small>Catatan Penjamin</small>
            <strong>{admission.guarantor}</strong>
            <p>{guarantorNotes[admission.guarantor]}</p>
          </div>

          <div className="inpatient-form-grid">
            <label>
              <span>No. Kartu / SEP / Polis</span>
              <input
                value={admission.insuranceNumber}
                onChange={(event) =>
                  updateAdmission('insuranceNumber', event.target.value)
                }
                placeholder={
                  admission.guarantor === 'BPJS'
                    ? 'Nomor SEP / kartu BPJS'
                    : admission.guarantor === 'Asuransi Lain'
                      ? 'Nomor polis / kartu asuransi'
                      : '-'
                }
              />
            </label>

            <label>
              <span>Kelas Perawatan</span>
              <select
                value={admission.careClass}
                onChange={(event) =>
                  updateAdmission('careClass', event.target.value)
                }
              >
                {classOptions.map((careClass) => (
                  <option value={careClass} key={careClass}>
                    {careClass}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="outpatient-panel inpatient-room-panel">
          <div className="outpatient-panel-title">
            <small>Ruang Perawatan</small>
            <h2>Penempatan Ruang dan DPJP</h2>
          </div>

          <div className="inpatient-form-grid">
            <label>
              <span>Ruang Rawat</span>
              <select
                value={admission.ward}
                onChange={(event) => updateAdmission('ward', event.target.value)}
              >
                {wardOptions.map((ward) => (
                  <option value={ward} key={ward}>
                    {ward}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Bed</span>
              <select
                value={admission.bed}
                onChange={(event) => updateAdmission('bed', event.target.value)}
              >
                {bedOptions.map((bed) => (
                  <option value={bed} key={bed}>
                    {bed}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>DPJP Rawat Inap</span>
              <select
                value={admission.dpjp}
                onChange={(event) => updateAdmission('dpjp', event.target.value)}
              >
                {dpjpOptions.map((doctor) => (
                  <option value={doctor} key={doctor}>
                    {doctor}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Catatan Klinis Admission</span>
              <textarea
                value={admission.clinicalNote}
                onChange={(event) =>
                  updateAdmission('clinicalNote', event.target.value)
                }
                rows={3}
              />
            </label>
          </div>

          <div className="inpatient-admission-summary">
            <div>
              <span>Status Admisi</span>
              <strong>{admission.admissionStatus}</strong>
            </div>
            <div>
              <span>Ruang / Bed</span>
              <strong>
                {admission.ward} / {admission.bed}
              </strong>
            </div>
            <div>
              <span>Penjamin</span>
              <strong>{admission.guarantor}</strong>
            </div>
            <div>
              <span>Estimasi Deposit</span>
              <strong>{formatCurrency(estimatedDeposit)}</strong>
            </div>
          </div>

          <div className="inpatient-action-bar">
            <button type="button" onClick={saveAdmission}>
              Simpan Admisi Rawat Inap
            </button>

            <Link to="/rme">Lihat RME</Link>
            <Link to="/kasir">Lanjut Kasir</Link>
          </div>
        </section>

        <section className="outpatient-panel inpatient-daily-care-panel">
          <div className="outpatient-panel-title">
            <small>Pelayanan Rawat Inap</small>
            <h2>Pelayanan Harian Pasien</h2>
            <p>
              Digunakan untuk mencatat asesmen keperawatan, CPPT, instruksi
              DPJP, order farmasi, biaya harian, dan rencana pulang pasien.
            </p>
          </div>

          <div className="inpatient-subsection-title">
            <span>01</span>
            <div>
              <strong>Asesmen Keperawatan</strong>
              <p>Kondisi awal pasien saat masuk ruang rawat inap.</p>
            </div>
          </div>

          <div className="inpatient-form-grid">
            <label>
              <span>Asesmen Keperawatan</span>
              <textarea
                value={dailyCare.nursingAssessment}
                onChange={(event) =>
                  updateDailyCare('nursingAssessment', event.target.value)
                }
                rows={3}
              />
            </label>

            <label>
              <span>Risiko Jatuh</span>
              <select
                value={dailyCare.fallRisk}
                onChange={(event) =>
                  updateDailyCare('fallRisk', event.target.value)
                }
              >
                {fallRiskOptions.map((risk) => (
                  <option value={risk} key={risk}>
                    {risk}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Skala Nyeri</span>
              <input
                inputMode="numeric"
                value={dailyCare.painScale}
                onChange={(event) =>
                  updateDailyCare('painScale', event.target.value)
                }
                placeholder="0 - 10"
              />
            </label>
          </div>

          <div className="inpatient-subsection-title">
            <span>02</span>
            <div>
              <strong>Instruksi DPJP / CPPT</strong>
              <p>Catatan perkembangan pasien dan instruksi dokter.</p>
            </div>
          </div>

          <div className="inpatient-form-grid">
            <label>
              <span>Catatan CPPT</span>
              <textarea
                value={dailyCare.cpptNote}
                onChange={(event) =>
                  updateDailyCare('cpptNote', event.target.value)
                }
                rows={3}
              />
            </label>

            <label>
              <span>Instruksi DPJP</span>
              <textarea
                value={dailyCare.doctorInstruction}
                onChange={(event) =>
                  updateDailyCare('doctorInstruction', event.target.value)
                }
                rows={3}
              />
            </label>
          </div>

          <div className="inpatient-subsection-title">
            <span>03</span>
            <div>
              <strong>Order Farmasi dan BMHP</strong>
              <p>Obat, cairan infus, dan alat kesehatan selama perawatan.</p>
            </div>
          </div>

          <div className="inpatient-form-grid">
            <label>
              <span>Order Obat</span>
              <textarea
                value={dailyCare.pharmacyOrder}
                onChange={(event) =>
                  updateDailyCare('pharmacyOrder', event.target.value)
                }
                rows={3}
              />
            </label>

            <label>
              <span>Order Cairan Infus</span>
              <input
                value={dailyCare.infusionOrder}
                onChange={(event) =>
                  updateDailyCare('infusionOrder', event.target.value)
                }
              />
            </label>

            <label>
              <span>Order BMHP / Alat Kesehatan</span>
              <textarea
                value={dailyCare.medicalSupplyOrder}
                onChange={(event) =>
                  updateDailyCare('medicalSupplyOrder', event.target.value)
                }
                rows={3}
              />
            </label>
          </div>

          <div className="inpatient-subsection-title">
            <span>04</span>
            <div>
              <strong>Biaya Harian Rawat Inap</strong>
              <p>Estimasi komponen tagihan harian untuk kasir.</p>
            </div>
          </div>

          <div className="inpatient-cost-grid">
            <label>
              <span>Biaya Kamar / Hari</span>
              <input
                inputMode="numeric"
                value={String(dailyCare.dailyRoomCost)}
                onChange={(event) =>
                  updateDailyCare(
                    'dailyRoomCost',
                    normalizeMoneyInput(event.target.value),
                  )
                }
              />
            </label>

            <label>
              <span>Visite Dokter</span>
              <input
                inputMode="numeric"
                value={String(dailyCare.doctorVisitCost)}
                onChange={(event) =>
                  updateDailyCare(
                    'doctorVisitCost',
                    normalizeMoneyInput(event.target.value),
                  )
                }
              />
            </label>

            <label>
              <span>Tindakan Perawat</span>
              <input
                inputMode="numeric"
                value={String(dailyCare.nursingActionCost)}
                onChange={(event) =>
                  updateDailyCare(
                    'nursingActionCost',
                    normalizeMoneyInput(event.target.value),
                  )
                }
              />
            </label>

            <label>
              <span>Obat / Farmasi</span>
              <input
                inputMode="numeric"
                value={String(dailyCare.pharmacyCost)}
                onChange={(event) =>
                  updateDailyCare(
                    'pharmacyCost',
                    normalizeMoneyInput(event.target.value),
                  )
                }
              />
            </label>
          </div>

          <div className="inpatient-daily-summary">
            <div>
              <span>Total Estimasi Harian</span>
              <strong>{formatCurrency(totalDailyCareCost)}</strong>
              <p>
                Komponen ini dapat diteruskan sebagai draft tagihan rawat inap
                ke kasir.
              </p>
            </div>

            <button type="button" onClick={saveDailyCare}>
              Simpan Pelayanan Harian
            </button>
          </div>
        </section>

        <section className="outpatient-panel inpatient-discharge-panel">
          <div className="outpatient-panel-title">
            <small>Rencana Pulang</small>
            <h2>Discharge Planning</h2>
            <p>
              Digunakan ketika pasien mulai direncanakan pulang, lanjut farmasi,
              dan penyelesaian administrasi kasir.
            </p>
          </div>

          <div className="inpatient-form-grid">
            <label>
              <span>Status Pulang</span>
              <select
                value={dailyCare.dischargeStatus}
                onChange={(event) =>
                  updateDailyCare(
                    'dischargeStatus',
                    event.target.value as InpatientDailyCareForm['dischargeStatus'],
                  )
                }
              >
                {dischargeStatusOptions.map((status) => (
                  <option value={status} key={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Rencana Pulang / Instruksi</span>
              <textarea
                value={dailyCare.dischargePlan}
                onChange={(event) =>
                  updateDailyCare('dischargePlan', event.target.value)
                }
                rows={3}
              />
            </label>
          </div>

          <div className="inpatient-action-bar inpatient-discharge-actions">
            <Link className="primary-cashier-link" to="/kasir">
              Lanjut Kasir / Pembayaran
            </Link>
            <Link to="/rme">Lihat RME</Link>
          </div>
        </section>

      </section>
    </main>
  )
}

export default InpatientPage
