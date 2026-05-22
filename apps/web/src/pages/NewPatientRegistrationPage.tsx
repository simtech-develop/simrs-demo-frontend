import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { api } from '../lib/api'

const dateDayOptions = Array.from({ length: 31 }, (_, index) =>
  String(index + 1).padStart(2, '0'),
)

const dateMonthOptions = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]

const dateYearOptions = Array.from({ length: 90 }, (_, index) =>
  String(new Date().getFullYear() - index),
)

const formatDateToDDMMYYYY = (value?: string | null) => {
  if (!value || value === '-') {
    return ''
  }

  const normalizedValue = value.includes('T') ? value.split('T')[0] : value
  const parts = normalizedValue.split('-')

  if (parts.length !== 3) {
    return value
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

const parseDDMMYYYYToISO = (value: string) => {
  const cleanedValue = value.trim()

  if (!/^\d{2}-\d{2}-\d{4}$/.test(cleanedValue)) {
    return ''
  }

  const [day, month, year] = cleanedValue.split('-')

  return `${year}-${month}-${day}`
}

const normalizeDateDisplayInput = (value: string) => {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 8)

  if (digitsOnly.length <= 2) {
    return digitsOnly
  }

  if (digitsOnly.length <= 4) {
    return `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2)}`
  }

  return `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 4)}-${digitsOnly.slice(4)}`
}



const REGISTRATION_EDIT_STORAGE_KEY = 'simrs_registration_edit_overrides'

type LocalRegistrationOverride = {
  id: string
  rm: string
  patient: string
  nik: string
  service: string
  doctor: string
  type: string
  payerType: 'Umum' | 'BPJS' | 'Asuransi'
  insuranceNo: string
  phone: string
  address: string
  gender: 'Laki-laki' | 'Perempuan' | '-'
  birthDate: string
  queue: string
  status: 'Menunggu' | 'Terverifikasi' | 'Dilayani' | 'Dibatalkan'
}

const getQueuePrefixByService = (service: string) => {
  const normalizedService = service.toLowerCase()

  if (normalizedService.includes('igd')) {
    return 'IGD'
  }

  if (normalizedService.includes('penyakit dalam')) {
    return 'PD'
  }

  if (normalizedService.includes('anak')) {
    return 'ANAK'
  }

  if (normalizedService.includes('bedah')) {
    return 'BDH'
  }

  if (normalizedService.includes('kandungan')) {
    return 'OBG'
  }

  if (normalizedService.includes('gigi')) {
    return 'GIGI'
  }

  if (normalizedService.includes('laboratorium')) {
    return 'LAB'
  }

  if (normalizedService.includes('radiologi')) {
    return 'RAD'
  }

  return 'UMUM'
}

const mapGuarantorToPayerType = (
  guarantor: string,
): LocalRegistrationOverride['payerType'] => {
  if (guarantor === 'BPJS Kesehatan') {
    return 'BPJS'
  }

  if (guarantor === 'Asuransi Swasta' || guarantor === 'Perusahaan') {
    return 'Asuransi'
  }

  return 'Umum'
}

const mapPatientGender = (
  gender: string,
): LocalRegistrationOverride['gender'] => {
  if (gender === 'L') {
    return 'Laki-laki'
  }

  if (gender === 'P') {
    return 'Perempuan'
  }

  return '-'
}

const saveNewRegistrationOverride = (registration: LocalRegistrationOverride) => {
  try {
    const currentValue = window.localStorage.getItem(
      REGISTRATION_EDIT_STORAGE_KEY,
    )

    const currentOverrides: Record<string, LocalRegistrationOverride> =
      currentValue ? JSON.parse(currentValue) : {}

    const overrideKeys = [
      registration.id,
      registration.rm,
      registration.nik,
      registration.queue,
      registration.patient,
    ].filter(Boolean)

    overrideKeys.forEach((key) => {
      currentOverrides[key] = registration
    })

    window.localStorage.setItem(
      REGISTRATION_EDIT_STORAGE_KEY,
      JSON.stringify(currentOverrides),
    )

    window.localStorage.setItem(
      'simrs_last_registration_edit',
      JSON.stringify(registration),
    )
  } catch (error) {
    console.error('Gagal menyimpan data registrasi lokal:', error)
  }
}

const doctorOptionsByService: Record<string, string[]> = {
  'Poli Umum': [
    'dr. Andi Pratama',
    'dr. Rina Marlina',
  ],
  'IGD': [
    'dr. Reza Firmansyah',
    'dr. Maya Lestari',
    'dr. Dimas Aditya',
  ],
  'Poli Penyakit Dalam': [
    'dr. Budi Santoso, Sp.PD',
    'dr. Farhan Maulana, Sp.PD',
  ],
  'Poli Anak': [
    'dr. Siti Rahma, Sp.A',
    'dr. Nadia Paramitha, Sp.A',
  ],
  'Poli Bedah': [
    'dr. Agus Wijaya, Sp.B',
    'dr. Hendra Saputra, Sp.B',
  ],
  'Poli Kandungan': [
    'dr. Rina Marlina, Sp.OG',
    'dr. Dewi Kartika, Sp.OG',
  ],
  'Poli Gigi': [
    'drg. Indah Permatasari',
    'drg. Yoga Pratama',
  ],
  'Laboratorium': [
    'dr. Fitri Handayani, Sp.PK',
  ],
  'Radiologi': [
    'dr. Arif Nugroho, Sp.Rad',
  ],
}

const getDoctorOptionsByService = (service: string) =>
  doctorOptionsByService[service] ?? doctorOptionsByService['Poli Umum']

const getDefaultDoctorName = (service: string) =>
  getDoctorOptionsByService(service)[0] ?? '-'


const guarantorOptions = [
  'Umum',
  'BPJS Kesehatan',
  'Asuransi Swasta',
  'Perusahaan',
]

type PatientForm = {
  nik: string
  fullName: string
  birthPlace: string
  birthDate: string
  gender: string
  maritalStatus: string
  phone: string
  email: string
  address: string
  district: string
  city: string
  guarantor: string
  guarantorNumber: string
  careClass: string
  patientStatus: string
  destination: string
  visitType: string
  initialComplaint: string
}

type ClinicApiResponse = {
  id: string
  code: string
  name: string
}

type PatientApiResponse = {
  id: string
  medicalRecordNo: string
  fullName: string
}

type RegistrationApiResponse = {
  id: string
  registrationNo: string
  queueNumber: number
  patient: PatientApiResponse
  clinic: ClinicApiResponse
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function generateMedicalRecordNo() {
  const now = new Date()
  const year = now.getFullYear()
  const suffix = String(now.getTime()).slice(-6)

  return `RM-${year}-${suffix}`
}

const initialForm: PatientForm = {
  nik: '',
  fullName: '',
  birthPlace: '',
  birthDate: '',
  gender: '',
  maritalStatus: '',
  phone: '',
  email: '',
  address: '',
  district: '',
  city: '',
  guarantor: '',
  guarantorNumber: '',
  careClass: '',
  patientStatus: 'baru',
  destination: '',
  visitType: '',
  initialComplaint: '',
}

function NewPatientRegistrationPage() {
  const [form, setForm] = useState<PatientForm>(initialForm)
  const [birthDateDisplay, setBirthDateDisplay] = useState('')
  const [birthDatePickerDay, setBirthDatePickerDay] = useState('')
  const [birthDatePickerMonth, setBirthDatePickerMonth] = useState('')
  const [birthDatePickerYear, setBirthDatePickerYear] = useState('')
  const [selectedService, setSelectedService] = useState('Poli Umum')
  const [selectedDoctor, setSelectedDoctor] = useState(getDefaultDoctorName('Poli Umum'))
  const [isSaved, setIsSaved] = useState(false)
  const [, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [savedRegistration, setSavedRegistration] =
    useState<RegistrationApiResponse | null>(null)
  const [showValidation, setShowValidation] = useState(false)

  const updateField = <K extends keyof PatientForm>(
    field: K,
    value: PatientForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    if (isSaved) {
      setIsSaved(false)
      setSavedRegistration(null)
    }

    if (submitError) {
      setSubmitError('')
    }
  }

  const completion = useMemo(() => {
    const identityComplete =
      form.nik.trim().length >= 16 &&
      form.fullName.trim() !== '' &&
      form.birthPlace.trim() !== '' &&
      form.birthDate !== '' &&
      form.gender !== ''

    const contactComplete =
      form.phone.trim() !== '' &&
      form.address.trim() !== '' &&
      form.district.trim() !== '' &&
      form.city.trim() !== ''

    const guarantorComplete =
      form.guarantor !== '' &&
      form.careClass !== '' &&
      (form.guarantor === 'Umum' || form.guarantorNumber.trim() !== '')

    const visitComplete =
      form.destination !== '' &&
      form.visitType !== '' &&
      form.initialComplaint.trim() !== ''

    const allComplete =
      identityComplete &&
      contactComplete &&
      guarantorComplete &&
      visitComplete

    return {
      identityComplete,
      contactComplete,
      guarantorComplete,
      visitComplete,
      allComplete,
    }
  }, [form])

  const generatedRecordNumber =
    savedRegistration?.patient.medicalRecordNo ??
    (completion.identityComplete ? 'RM-AUTO-BACKEND' : 'RM-NEW-AUTO')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowValidation(true)
    setSubmitError('')

    if (!completion.allComplete) {
      setIsSaved(false)
      return
    }

    setIsSaving(true)

    try {
      const clinics = await api.get<ClinicApiResponse[]>('/clinics')
      const selectedClinic = clinics.find(
        (clinic) => clinic.name === selectedService,
      )

      if (!selectedClinic) {
        throw new Error(
          `Tujuan layanan "${selectedService}" belum tersedia di backend.`,
        )
      }

      const patient = await api.post<
        PatientApiResponse,
        {
          medicalRecordNo: string
          nationalId: string
          fullName: string
          gender: 'MALE' | 'FEMALE'
          birthDate: string
          phone: string
          address: string
        }
      >('/patients', {
        medicalRecordNo: generateMedicalRecordNo(),
        nationalId: form.nik,
        fullName: form.fullName,
        gender: form.gender === 'L' ? 'MALE' : 'FEMALE',
        birthDate: form.birthDate,
        phone: form.phone,
        address: `${form.address}, ${form.district}, ${form.city}`,
      })

      const registration = await api.post<
        RegistrationApiResponse,
        {
          visitDate: string
          chiefComplaint: string
          patientId: string
          clinicId: string
        }
      >('/registrations', {
        visitDate: formatLocalDate(new Date()),
        chiefComplaint: form.initialComplaint,
        patientId: patient.id,
        clinicId: selectedClinic.id,
      })

      const registrationAny = registration as any
      const patientAny = patient as any
      const queueNumber = String(registrationAny?.queueNumber || 1).padStart(
        3,
        '0',
      )
      const queuePrefix =
        selectedClinic.code || getQueuePrefixByService(selectedService)

      const localRegistration: LocalRegistrationOverride = {
        id: String(registrationAny?.id || ''),
        rm: String(patientAny?.medicalRecordNo || ''),
        patient: form.fullName,
        nik: form.nik,
        service: selectedService,
        doctor: selectedDoctor || getDefaultDoctorName(selectedService),
        type: form.visitType || form.patientStatus || 'Pasien Baru',
        payerType: mapGuarantorToPayerType(form.guarantor),
        insuranceNo:
          form.guarantor === 'Umum' || !form.guarantorNumber
            ? '-'
            : form.guarantorNumber,
        phone: form.phone || '-',
        address: `${form.address}, ${form.district}, ${form.city}`,
        gender: mapPatientGender(form.gender),
        birthDate: form.birthDate || '-',
        queue: `${queuePrefix}-${queueNumber}`,
        status: 'Menunggu',
      }

      saveNewRegistrationOverride(localRegistration)

      setSavedRegistration(registration)
      setIsSaved(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Registrasi gagal disimpan ke backend.'

      setIsSaved(false)
      setSavedRegistration(null)
      setSubmitError(message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setIsSaving(false)
    }
  }

  const applyBirthDatePicker = (
    day: string,
    month: string,
    year: string,
  ) => {
    setBirthDatePickerDay(day)
    setBirthDatePickerMonth(month)
    setBirthDatePickerYear(year)

    if (day && month && year) {
      const displayValue = `${day}-${month}-${year}`

      setBirthDateDisplay(displayValue)
      setForm((currentForm) => ({
        ...currentForm,
        birthDate: parseDDMMYYYYToISO(displayValue),
      }))
    }
  }

  const resetForm = () => {
    setForm(initialForm)
    setBirthDateDisplay('')
    setBirthDatePickerDay('')
    setBirthDatePickerMonth('')
    setBirthDatePickerYear('')
    setIsSaved(false)
    setIsSaving(false)
    setSubmitError('')
    setSavedRegistration(null)
    setShowValidation(false)
    setSelectedService('Poli Umum')
    setSelectedDoctor(getDefaultDoctorName('Poli Umum'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="new-patient-app">
      <aside className="dashboard-sidebar-pro">
        <div className="sidebar-brand-pro">
          <span>SIMRS</span>
          <strong>SIMTECH</strong>
          <p>Type D / C Demo Platform</p>
        </div>

        <nav className="sidebar-menu-pro">
          <Link to="/dashboard">Dashboard</Link>
          <Link className="active" to="/pendaftaran">
            Pendaftaran
          </Link>
          <Link to="/rawat-jalan">Rawat Jalan</Link>
          <Link to="/igd">IGD</Link>
          <Link to="/rme">RME</Link>
          <Link to="/farmasi">Farmasi</Link>
          <Link to="/kasir">Kasir</Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Registrasi identitas pasien baru</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="new-patient-content">
        <header className="new-patient-header">
          <div className="new-patient-heading">
            <Link className="breadcrumb-link" to="/pendaftaran">
              ← Kembali ke Modul Pendaftaran
            </Link>

            <small>Registrasi Baru</small>
            <h1>Daftarkan Pasien Baru</h1>
            <p>
              Form awal untuk membentuk identitas pasien, informasi administratif,
              dan tujuan kunjungan pertama sebelum masuk ke proses layanan rumah sakit.
            </p>
          </div>

          <div className="registration-stage-card">
            <span>Status Form</span>
            <strong>
              {isSaved ? 'Registrasi Tersimpan' : 'Draft Registrasi'}
            </strong>
            <p>
              {isSaved
                ? 'Data berhasil tersimpan ke backend SIMRS'
                : 'Belum tersimpan ke backend'}
            </p>
          </div>
        </header>

        {isSaved && (
          <section className="registration-success-banner">
            <div>
              <small>Registrasi Berhasil</small>
              <strong>{form.fullName || 'Pasien Baru'} berhasil didaftarkan</strong>
              <p>
                Nomor rekam medis <b>{generatedRecordNumber}</b>, nomor kunjungan{' '}
                <b>{savedRegistration?.registrationNo}</b>, dan antrean{' '}
                <b>{savedRegistration?.queueNumber}</b> telah dibentuk oleh backend.
              </p>
            </div>

            <Link to="/pendaftaran">Kembali ke Daftar Pendaftaran</Link>
          </section>
        )}

        {submitError && (
          <section className="registration-warning-banner">
            <strong>Registrasi belum tersimpan.</strong>
            <span>{submitError}</span>
          </section>
        )}

        {showValidation && !completion.allComplete && (
          <section className="registration-warning-banner">
            <strong>Form belum lengkap.</strong>
            <span>
              Lengkapi data wajib pada identitas, kontak, penjamin, dan tujuan
              kunjungan sebelum melakukan simpan registrasi demo.
            </span>
          </section>
        )}

        <form className="patient-registration-layout" onSubmit={handleSubmit}>
          <section className="patient-form-main">
            <article className="patient-form-panel">
              <div className="patient-form-title">
                <small>01. Identitas Dasar</small>
                <h2>Data Pribadi Pasien</h2>
              </div>

              <div className="form-grid two-columns">
                <label>
                  <span>NIK</span>
                  <input
                    type="text"
                    maxLength={16}
                    value={form.nik}
                    onChange={(event) => updateField('nik', event.target.value)}
                    placeholder="Masukkan 16 digit NIK"
                  />
                  {showValidation && form.nik.trim().length < 16 && (
                    <em className="field-alert">NIK minimal 16 digit.</em>
                  )}
                </label>

                <label>
                  <span>No. Rekam Medis</span>
                  <input type="text" value={generatedRecordNumber} readOnly />
                </label>

                <label className="full-span">
                  <span>Nama Lengkap</span>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                    placeholder="Masukkan nama sesuai identitas"
                  />
                  {showValidation && form.fullName.trim() === '' && (
                    <em className="field-alert">Nama pasien wajib diisi.</em>
                  )}
                </label>

                <label>
                  <span>Tempat Lahir</span>
                  <input
                    type="text"
                    value={form.birthPlace}
                    onChange={(event) => updateField('birthPlace', event.target.value)}
                    placeholder="Contoh: Garut"
                  />
                </label>

                <label>
                  <span>Tanggal Lahir</span>
                  <div className="date-input-with-picker">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={birthDateDisplay}
                      onChange={(event) => {
                        const nextDisplayValue = normalizeDateDisplayInput(
                          event.target.value,
                        )

                        setBirthDateDisplay(nextDisplayValue)
                        setForm((currentForm) => ({
                          ...currentForm,
                          birthDate: parseDDMMYYYYToISO(nextDisplayValue),
                        }))

                        const [day = '', month = '', year = ''] =
                          nextDisplayValue.split('-')

                        setBirthDatePickerDay(day)
                        setBirthDatePickerMonth(month)
                        setBirthDatePickerYear(year)
                      }}
                      placeholder="DD-MM-YYYY"
                      maxLength={10}
                    />

                    <button
                      type="button"
                      className="date-picker-button"
                      onClick={() => {
                        const picker = document.getElementById(
                          'new-patient-birth-date-picker',
                        ) as HTMLInputElement | null

                        if (picker?.showPicker) {
                          picker.showPicker()
                        } else {
                          picker?.click()
                        }
                      }}
                      aria-label="Pilih tanggal lahir"
                    >
                      📅
                    </button>

                    <input
                      id="new-patient-birth-date-picker"
                      className="date-picker-hidden-input"
                      type="date"
                      value={form.birthDate}
                      onChange={(event) => {
                        const isoValue = event.target.value
                        const displayValue = formatDateToDDMMYYYY(isoValue)
                        const [day = '', month = '', year = ''] =
                          displayValue.split('-')

                        setForm((currentForm) => ({
                          ...currentForm,
                          birthDate: isoValue,
                        }))
                        setBirthDateDisplay(displayValue)
                        setBirthDatePickerDay(day)
                        setBirthDatePickerMonth(month)
                        setBirthDatePickerYear(year)
                      }}
                    />
                  </div>

                  <div className="date-select-picker">
                    <select
                      value={birthDatePickerDay}
                      onChange={(event) =>
                        applyBirthDatePicker(
                          event.target.value,
                          birthDatePickerMonth,
                          birthDatePickerYear,
                        )
                      }
                    >
                      <option value="">Tanggal</option>
                      {dateDayOptions.map((day) => (
                        <option value={day} key={day}>
                          {day}
                        </option>
                      ))}
                    </select>

                    <select
                      value={birthDatePickerMonth}
                      onChange={(event) =>
                        applyBirthDatePicker(
                          birthDatePickerDay,
                          event.target.value,
                          birthDatePickerYear,
                        )
                      }
                    >
                      <option value="">Bulan</option>
                      {dateMonthOptions.map((month) => (
                        <option value={month.value} key={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={birthDatePickerYear}
                      onChange={(event) =>
                        applyBirthDatePicker(
                          birthDatePickerDay,
                          birthDatePickerMonth,
                          event.target.value,
                        )
                      }
                    >
                      <option value="">Tahun</option>
                      {dateYearOptions.map((year) => (
                        <option value={year} key={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <small className="date-format-preview">
                    Format tanggal: DD-MM-YYYY
                  </small>
                </label>

                <label>
                  <span>Jenis Kelamin</span>
                  <select
                    value={form.gender}
                    onChange={(event) => updateField('gender', event.target.value)}
                  >
                    <option value="">Pilih jenis kelamin</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </label>

                <label>
                  <span>Status Pernikahan</span>
                  <select
                    value={form.maritalStatus}
                    onChange={(event) =>
                      updateField('maritalStatus', event.target.value)
                    }
                  >
                    <option value="">Pilih status</option>
                    <option value="belum-menikah">Belum Menikah</option>
                    <option value="menikah">Menikah</option>
                    <option value="cerai">Cerai</option>
                  </select>
                </label>
              </div>
            </article>

            <article className="patient-form-panel">
              <div className="patient-form-title">
                <small>02. Kontak & Alamat</small>
                <h2>Informasi Domisili</h2>
              </div>

              <div className="form-grid two-columns">
                <label>
                  <span>Nomor HP</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    placeholder="Contoh: 0812xxxxxxx"
                  />
                </label>

                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="Opsional"
                  />
                </label>

                <label className="full-span">
                  <span>Alamat Lengkap</span>
                  <textarea
                    value={form.address}
                    onChange={(event) => updateField('address', event.target.value)}
                    placeholder="Masukkan alamat domisili pasien"
                    rows={4}
                  />
                </label>

                <label>
                  <span>Kecamatan</span>
                  <input
                    type="text"
                    value={form.district}
                    onChange={(event) => updateField('district', event.target.value)}
                    placeholder="Contoh: Tarogong Kidul"
                  />
                </label>

                <label>
                  <span>Kabupaten / Kota</span>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(event) => updateField('city', event.target.value)}
                    placeholder="Contoh: Kabupaten Garut"
                  />
                </label>
              </div>
            </article>

            <article className="patient-form-panel">
              <div className="patient-form-title">
                <small>03. Administrasi Pasien</small>
                <h2>Penjamin & Kepesertaan</h2>
              <p className="section-helper-text">
                Kepesertaan dibuat saat registrasi. Pilih Umum, BPJS,
                Asuransi, atau Perusahaan, lalu isi nomor kartu penjamin bila tersedia.
              </p>
              </div>

              <div className="form-grid two-columns">
                <label>
                  <span>Jenis Penjamin</span>
                  <select
                    value={form.guarantor}
                    onChange={(event) => updateField('guarantor', event.target.value)}
                  >
                    <option value="">Pilih penjamin</option>
                    {guarantorOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Nomor Kartu Penjamin</span>
                  <input
                    type="text"
                    value={form.guarantorNumber}
                    onChange={(event) =>
                      updateField('guarantorNumber', event.target.value)
                    }
                    placeholder="Nomor BPJS / Polis jika ada"
                  />
                </label>

                <label>
                  <span>Kelas Perawatan</span>
                  <select
                    value={form.careClass}
                    onChange={(event) => updateField('careClass', event.target.value)}
                  >
                    <option value="">Pilih kelas</option>
                    <option value="non-kelas">Non Kelas</option>
                    <option value="kelas-1">Kelas 1</option>
                    <option value="kelas-2">Kelas 2</option>
                    <option value="kelas-3">Kelas 3</option>
                  </select>
                </label>

                <label>
                  <span>Status Pasien</span>
                  <select
                    value={form.patientStatus}
                    onChange={(event) =>
                      updateField('patientStatus', event.target.value)
                    }
                  >
                    <option value="baru">Pasien Baru</option>
                    <option value="rujukan">Pasien Rujukan</option>
                  </select>
                </label>
              </div>
            </article>

            <article className="patient-form-panel">
              <div className="patient-form-title">
                <small>04. Kunjungan Pertama</small>
                <h2>Tujuan Layanan Awal</h2>
              </div>

              <div className="form-grid two-columns">
                <label>
                  <span>Tujuan Layanan</span>
                  <select
                    name="service"
                    value={selectedService}
                    onChange={(event) => {
                      const nextService = event.target.value
                      setSelectedService(nextService)
                      setSelectedDoctor(getDefaultDoctorName(nextService))
                    }}
                  >
                    <option value="Poli Umum">Poli Umum</option>
                    <option value="IGD">IGD</option>
                    <option value="Poli Penyakit Dalam">Poli Penyakit Dalam</option>
                    <option value="Poli Anak">Poli Anak</option>
                    <option value="Poli Bedah">Poli Bedah</option>
                    <option value="Poli Kandungan">Poli Kandungan</option>
                    <option value="Poli Gigi">Poli Gigi</option>
                    <option value="Laboratorium">Laboratorium</option>
                    <option value="Radiologi">Radiologi</option>
                  </select>
                </label>

                <label>
                  <span>Dokter Sesuai Poli / Unit</span>
                  <select
                    name="doctorName"
                    value={selectedDoctor}
                    onChange={(event) => setSelectedDoctor(event.target.value)}
                  >
                    {getDoctorOptionsByService(selectedService).map((doctor) => (
                      <option value={doctor} key={doctor}>
                        {doctor}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Jenis Kunjungan</span>
                  <select
                    value={form.visitType}
                    onChange={(event) => updateField('visitType', event.target.value)}
                  >
                    <option value="">Pilih jenis kunjungan</option>
                    <option value="datang-langsung">Datang Langsung</option>
                    <option value="rujukan-fktp">Rujukan FKTP</option>
                    <option value="kontrol-ulang">Kontrol Ulang</option>
                    <option value="igd">IGD</option>
                  </select>
                </label>

                <label className="full-span">
                  <span>Keluhan Awal</span>
                  <textarea
                    value={form.initialComplaint}
                    onChange={(event) =>
                      updateField('initialComplaint', event.target.value)
                    }
                    placeholder="Tuliskan keluhan awal secara singkat"
                    rows={4}
                  />
                </label>
              </div>
            </article>
          </section>

          <aside className="patient-form-summary">
            <article className="summary-panel-pro">
              <div className="patient-form-title">
                <small>Ringkasan Draft</small>
                <h2>Registrasi Pasien</h2>
              </div>

              <div className="summary-checklist">
                <div>
                  <span>Identitas Dasar</span>
                  <strong className={completion.identityComplete ? 'complete' : ''}>
                    {completion.identityComplete ? 'Lengkap' : 'Belum lengkap'}
                  </strong>
                </div>

                <div>
                  <span>Kontak & Alamat</span>
                  <strong className={completion.contactComplete ? 'complete' : ''}>
                    {completion.contactComplete ? 'Lengkap' : 'Belum lengkap'}
                  </strong>
                </div>

                <div>
                  <span>Penjamin</span>
                  <strong className={completion.guarantorComplete ? 'complete' : ''}>
                    {completion.guarantorComplete ? 'Dipilih' : 'Belum dipilih'}
                  </strong>
                </div>

                <div>
                  <span>Tujuan Kunjungan</span>
                  <strong className={completion.visitComplete ? 'complete' : ''}>
                    {completion.visitComplete ? 'Dipilih' : 'Belum dipilih'}
                  </strong>
                </div>
              </div>

              <div className="record-number-card">
                <small>Nomor RM Sementara</small>
                <strong>{generatedRecordNumber}</strong>
                <p>
                  {isSaved
                    ? 'Nomor RM demo sudah dibentuk untuk simulasi registrasi.'
                    : 'Akan digenerasi ketika data pasien siap disimpan.'}
                </p>
              </div>

              <div className="form-submit-actions">
                <button className="save-patient-button" type="submit">
                  {isSaved ? 'Registrasi Demo Tersimpan' : 'Simpan Registrasi Demo'}
                </button>

                <button
                  className="reset-patient-button"
                  type="button"
                  onClick={resetForm}
                >
                  Kosongkan Form
                </button>

                <Link className="cancel-patient-link" to="/pendaftaran">
                  Batalkan dan kembali
                </Link>
              </div>
            </article>

            <article className="operator-guidance-panel">
              <small>Catatan Operator</small>
              <h3>Validasi sebelum simpan</h3>
              <ul>
                <li>Pastikan identitas pasien tidak duplikat.</li>
                <li>Periksa NIK dan penjamin bila tersedia.</li>
                <li>Tentukan tujuan layanan dengan benar.</li>
                <li>Gunakan antrean sesuai unit pelayanan.</li>
              </ul>
            </article>
          </aside>
        </form>
      </section>
    </main>
  )
}

export default NewPatientRegistrationPage
