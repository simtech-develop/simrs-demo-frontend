import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../lib/api'

const formatDateToDDMMYYYY = (value?: string | null) => {
  if (!value || value === '-') {
    return '-'
  }

  const normalizedValue = value.includes('T') ? value.split('T')[0] : value
  const parts = normalizedValue.split('-')

  if (parts.length !== 3) {
    return value
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`
}


const visitChannels = [
  'Datang Langsung',
  'Rujukan FKTP',
  'Kontrol Ulang',
  'IGD',
]

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

const dummyBpjsRegistrationPatients = [
  {
    label: 'BPJS - Ujang / Kelas II',
    patient: 'Ujang',
    nik: '5634563456345635',
    gender: 'Laki-laki' as const,
    birthDate: '1999-08-15',
    phone: '08124567894213',
    address: 'Jl. Dendek No.29, Cibarekbeg, Cianjur',
    service: 'Poli Umum',
    doctor: getDefaultDoctorName('Poli Umum'),
    type: 'Pasien Baru',
    payerType: 'BPJS' as const,
    insuranceNo: '0001234567890',
    queue: 'UMUM-001',
    status: 'Menunggu' as const,
  },
  {
    label: 'BPJS - Slamet Riyadi / IGD',
    patient: 'Slamet Riyadi',
    nik: '3275010101010001',
    gender: 'Laki-laki' as const,
    birthDate: '1988-04-12',
    phone: '081298765432',
    address: 'Jl. Melati Raya No.12, Cimahi Tengah, Cimahi',
    service: 'IGD',
    doctor: getDefaultDoctorName('IGD'),
    type: 'IGD',
    payerType: 'BPJS' as const,
    insuranceNo: '0009876543210',
    queue: 'IGD-001',
    status: 'Menunggu' as const,
  },
  {
    label: 'BPJS - Jamilah / Penyakit Dalam',
    patient: 'Jamilah',
    nik: '2435624362436426',
    gender: 'Perempuan' as const,
    birthDate: '1979-11-21',
    phone: '082112345678',
    address: 'Kp. Sukamaju RT 02 RW 04, Tarogong Kidul, Garut',
    service: 'Poli Penyakit Dalam',
    doctor: getDefaultDoctorName('Poli Penyakit Dalam'),
    type: 'Rujukan',
    payerType: 'BPJS' as const,
    insuranceNo: '0004567891234',
    queue: 'PD-001',
    status: 'Menunggu' as const,
  },
]

const getDefaultBpjsNumber = (nik: string, patientName = '') => {
  const normalizedNik = nik.trim()
  const normalizedName = patientName.toLowerCase().trim()

  if (normalizedNik === '5634563456345635' || normalizedName.includes('ujang')) {
    return '0001234567890'
  }

  if (normalizedNik === '3275010101010001' || normalizedName.includes('slamet')) {
    return '0009876543210'
  }

  if (normalizedNik === '2435624362436426' || normalizedName.includes('jamilah')) {
    return '0004567891234'
  }

  return '0001112223334'
}

type ApiRegistrationStatus =
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
  status: ApiRegistrationStatus
  createdAt: string
  patient: {
    id: string
    medicalRecordNo: string
    nationalId?: string | null
    fullName: string
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

type ApiRegistrationDetail = ApiRegistration & {
  payerType?: 'Umum' | 'BPJS' | 'Asuransi' | 'UMUM' | 'BPJS' | 'ASURANSI' | null
  insuranceNo?: string | null
  guarantorNo?: string | null
  patient: ApiRegistration['patient'] & {
    gender?: 'Laki-laki' | 'Perempuan' | 'MALE' | 'FEMALE' | null
    birthDate?: string | null
    dateOfBirth?: string | null
    phone?: string | null
    phoneNumber?: string | null
    mobilePhone?: string | null
    address?: string | null
  }
}

type RegistrationRow = {
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

function mapStatus(status: ApiRegistrationStatus): RegistrationRow['status'] {
  switch (status) {
    case 'WAITING':
      return 'Menunggu'
    case 'IN_SERVICE':
      return 'Terverifikasi'
    case 'COMPLETED':
      return 'Dilayani'
    case 'CANCELED':
      return 'Dibatalkan'
    default:
      return 'Menunggu'
  }
}


function mapRegistration(item: ApiRegistration): RegistrationRow {
  const queuePrefix = item.clinic.code || 'Q'

  return {
    id: item.id,
    rm: item.patient.medicalRecordNo,
    patient: item.patient.fullName,
    nik: item.patient.nationalId ?? '-',
    service: item.clinic.name,
    doctor:
      item.doctor?.fullName ??
      getDefaultDoctorName(item.clinic.name),
    type: item.clinic.code === 'IGD' ? 'IGD' : 'Pasien Baru',
    payerType: 'Umum',
    insuranceNo: '-',
    phone: '-',
    address: '-',
    gender: '-',
    birthDate: '-',
    queue: `${queuePrefix}-${String(item.queueNumber).padStart(3, '0')}`,
    status: mapStatus(item.status),
  }
}

function normalizeGender(
  gender?: ApiRegistrationDetail['patient']['gender'],
): RegistrationRow['gender'] {
  if (gender === 'MALE') {
    return 'Laki-laki'
  }

  if (gender === 'FEMALE') {
    return 'Perempuan'
  }

  if (gender === 'Laki-laki' || gender === 'Perempuan') {
    return gender
  }

  return '-'
}

function normalizeBirthDate(value?: string | null): string {
  if (!value) {
    return '-'
  }

  return value.includes('T') ? value.split('T')[0] : value
}

function normalizePayerType(
  payerType?: ApiRegistrationDetail['payerType'],
): RegistrationRow['payerType'] {
  if (payerType === 'BPJS') {
    return 'BPJS'
  }

  if (payerType === 'ASURANSI' || payerType === 'Asuransi') {
    return 'Asuransi'
  }

  return 'Umum'
}

const REGISTRATION_EDIT_STORAGE_KEY = 'simrs_registration_edit_overrides'

const saveRegistrationEditOverride = (registration: RegistrationRow) => {
  try {
    const currentValue = window.localStorage.getItem(
      REGISTRATION_EDIT_STORAGE_KEY,
    )

    const currentOverrides: Record<string, RegistrationRow> = currentValue
      ? JSON.parse(currentValue)
      : {}

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
    console.error('Gagal menyimpan override edit registrasi:', error)
  }
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

const normalizeQueueByService = (service: string, currentQueue: string) => {
  const prefix = getQueuePrefixByService(service)
  const queueNumber = currentQueue.split('-')[1] || '001'

  return `${prefix}-${queueNumber}`
}

const getRegistrationEditOverride = (
  registration: Partial<RegistrationRow>,
): RegistrationRow | null => {
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

    const currentOverrides = JSON.parse(currentValue) as Record<
      string,
      RegistrationRow
    >

    const candidateKeys = [
      registration.id,
      registration.rm,
      registration.nik,
      registration.queue,
      registration.patient,
    ].filter((key): key is string => Boolean(key))

    for (const key of candidateKeys) {
      if (currentOverrides[key]) {
        return currentOverrides[key]
      }
    }

    return null
  } catch (error) {
    console.error('Gagal membaca override edit registrasi:', error)
    return null
  }
}

const mergeRegistrationWithOverride = (
  registration: RegistrationRow,
): RegistrationRow => {
  const override = getRegistrationEditOverride(registration)

  return override ? { ...registration, ...override } : registration
}

const getStatusOperationalNote = (status: RegistrationRow['status']) => {
  switch (status) {
    case 'Menunggu':
      return 'Menunggu verifikasi'
    case 'Terverifikasi':
      return 'Siap pelayanan'
    case 'Dilayani':
      return 'Sedang/selesai layanan'
    case 'Dibatalkan':
      return 'Registrasi tidak aktif'
    default:
      return '-'
  }
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

const parseDDMMYYYYToISO = (value: string) => {
  const cleanedValue = value.trim()

  if (!/^\d{2}-\d{2}-\d{4}$/.test(cleanedValue)) {
    return ''
  }

  const [day, month, year] = cleanedValue.split('-')

  return `${year}-${month}-${day}`
}

function RegistrationPage() {
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('all')
  const [visitTypeFilter, setVisitTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] =
    useState<RegistrationRow | null>(null)

  const loadRegistrations = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const response = await api.get<ApiRegistration[]>('/registrations')
      setRegistrations(response.map(mapRegistration).map(mergeRegistrationWithOverride))
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memuat data pendaftaran dari backend.'

      setRegistrations([])
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadRegistrations()
  }, [])

  const registrationStats = useMemo(() => {
    const newPatients = registrations.filter((item) =>
      item.type.includes('Baru'),
    ).length

    const waitingPatients = registrations.filter(
      (item) => item.status === 'Menunggu',
    ).length

    const referralPatients = registrations.filter((item) =>
      item.type.includes('Rujukan'),
    ).length

    const returningPatients = registrations.filter(
      (item) => item.type === 'Pasien Lama',
    ).length

    return [
      {
        label: 'Pasien Baru Hari Ini',
        value: String(newPatients),
        note: 'Registrasi berhasil',
      },
      {
        label: 'Pasien Lama Kembali',
        value: String(returningPatients),
        note: 'Kunjungan ulang',
      },
      {
        label: 'Antrean Belum Dipanggil',
        value: String(waitingPatients),
        note: 'Menunggu pelayanan',
      },
      {
        label: 'Rujukan Masuk',
        value: String(referralPatients),
        note: 'Perlu verifikasi',
      },
    ]
  }, [registrations])

  const doctorFilterOptions = useMemo(() => {
    const doctors = registrations
      .map((registration) => registration.doctor)
      .filter((doctor): doctor is string => Boolean(doctor && doctor !== '-'))

    return Array.from(new Set(doctors)).sort()
  }, [registrations])

  const filteredRegistrations = useMemo(() => {
    const keyword = searchTerm.toLowerCase().trim()

    return registrations.filter((row) => {
      const searchableText = [
        row.rm,
        row.patient,
        row.nik,
        row.service,
        row.doctor,
        row.type,
        row.queue,
        row.status,
        row.payerType,
        row.insuranceNo,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesKeyword = !keyword || searchableText.includes(keyword)

      const matchesDoctor =
        doctorFilter === 'all' ||
        (doctorFilter === 'unassigned'
          ? !row.doctor || row.doctor === '-'
          : row.doctor === doctorFilter)

      const matchesVisitType =
        visitTypeFilter === 'all' ||
        row.type === visitTypeFilter ||
        row.service === visitTypeFilter ||
        (visitTypeFilter === 'IGD' &&
          (row.service === 'IGD' || row.type === 'IGD')) ||
        (visitTypeFilter === 'Rujukan FKTP' && row.type.includes('Rujukan')) ||
        (visitTypeFilter === 'Kontrol Ulang' &&
          (row.type === 'Pasien Lama' || row.type === 'Kontrol Ulang')) ||
        (visitTypeFilter === 'Datang Langsung' &&
          (row.type === 'Pasien Baru' || row.type === 'Pasien Lama'))

      const matchesStatus =
        statusFilter === 'all' || row.status === statusFilter

      return (
        matchesKeyword &&
        matchesDoctor &&
        matchesVisitType &&
        matchesStatus
      )
    })
  }, [
    registrations,
    searchTerm,
    doctorFilter,
    visitTypeFilter,
    statusFilter,
  ])

  const buildEditableRegistration = (
    registration: RegistrationRow,
    detail?: ApiRegistrationDetail,
  ): RegistrationRow => {
    const patient = detail?.patient
    const payerType = normalizePayerType(detail?.payerType)

    return {
      id: registration.id,
      rm: patient?.medicalRecordNo || registration.rm || '-',
      patient: patient?.fullName || registration.patient || '',
      nik: patient?.nationalId || registration.nik || '',
      service: detail?.clinic?.name || registration.service || 'Poli Umum',
      doctor:
        detail?.doctor?.fullName ||
        registration.doctor ||
        getDefaultDoctorName(detail?.clinic?.name || registration.service || 'Poli Umum'),
      type:
        detail?.clinic?.code === 'IGD'
          ? 'IGD'
          : registration.type || 'Pasien Baru',
      payerType: detail ? payerType : registration.payerType || 'Umum',
      insuranceNo:
        detail?.insuranceNo ||
        detail?.guarantorNo ||
        registration.insuranceNo ||
        '-',
      phone:
        patient?.phone ||
        patient?.phoneNumber ||
        patient?.mobilePhone ||
        registration.phone ||
        '-',
      address: patient?.address || registration.address || '-',
      gender: detail ? normalizeGender(patient?.gender) : registration.gender || '-',
      birthDate: detail
        ? normalizeBirthDate(patient?.birthDate || patient?.dateOfBirth)
        : registration.birthDate || '-',
      queue: registration.queue || '-',
      status: detail ? mapStatus(detail.status) : registration.status || 'Menunggu',
    }
  }

  const openEditModal = async (registration: RegistrationRow) => {
    const latestRegistration =
      getRegistrationEditOverride(registration) || registration

    setSelectedRegistration(buildEditableRegistration(latestRegistration))
    setIsEditModalOpen(true)

    try {
      const detail = await api.get<ApiRegistrationDetail>(
        `/registrations/${registration.id}`,
      )

      const detailRegistration = buildEditableRegistration(
        latestRegistration,
        detail,
      )

      const latestOverride =
        getRegistrationEditOverride(detailRegistration) ||
        getRegistrationEditOverride(latestRegistration)

      setSelectedRegistration(latestOverride || detailRegistration)
    } catch (error) {
      console.error('Gagal memuat detail pendaftaran untuk edit:', error)

      const fallbackOverride = getRegistrationEditOverride(latestRegistration)

      if (fallbackOverride) {
        setSelectedRegistration(fallbackOverride)
      }
    }
  }

  const closeEditModal = () => {
    setSelectedRegistration(null)
    setIsEditModalOpen(false)
  }

  const applyDummyBpjsToEdit = (
    dummyPatient: typeof dummyBpjsRegistrationPatients[number],
  ) => {
    setSelectedRegistration((currentRegistration) =>
      currentRegistration
        ? {
            ...currentRegistration,
            patient: dummyPatient.patient,
            nik: dummyPatient.nik,
            gender: dummyPatient.gender,
            birthDate: dummyPatient.birthDate,
            phone: dummyPatient.phone,
            address: dummyPatient.address,
            service: dummyPatient.service,
            doctor: dummyPatient.doctor,
            type: dummyPatient.type,
            payerType: dummyPatient.payerType,
            insuranceNo: dummyPatient.insuranceNo,
            queue: dummyPatient.queue,
            status: dummyPatient.status,
          }
        : currentRegistration,
    )
  }

  const saveRegistrationEdit = () => {
    if (!selectedRegistration) {
      return
    }

    const normalizedRegistration: RegistrationRow = {
      ...selectedRegistration,
      queue:
        selectedRegistration.status === 'Dibatalkan'
          ? '-'
          : normalizeQueueByService(
              selectedRegistration.service,
              selectedRegistration.queue && selectedRegistration.queue !== '-'
                ? selectedRegistration.queue
                : '001',
            ),
      insuranceNo:
        selectedRegistration.payerType === 'BPJS' &&
        (!selectedRegistration.insuranceNo ||
          selectedRegistration.insuranceNo === '-')
          ? getDefaultBpjsNumber(
              selectedRegistration.nik,
              selectedRegistration.patient,
            )
          : selectedRegistration.insuranceNo,
      doctor:
        !selectedRegistration.doctor || selectedRegistration.doctor === '-'
          ? getDefaultDoctorName(selectedRegistration.service)
          : selectedRegistration.doctor,
    }

    setRegistrations((currentRegistrations) =>
      currentRegistrations.map((registration) =>
        registration.id === normalizedRegistration.id
          ? normalizedRegistration
          : registration,
      ),
    )

    saveRegistrationEditOverride(normalizedRegistration)

    closeEditModal()
  }

  const handleSearchPatient = () => {
    document
      .querySelector('.registration-table-panel')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const resetRegistrationSearch = () => {
    setSearchTerm('')
    setDoctorFilter('all')
    setVisitTypeFilter('all')
    setStatusFilter('all')
  }

  const refreshData = () => {
    resetRegistrationSearch()
    void loadRegistrations()
  }

  return (
    <main className="registration-app">
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
          <Link to="/ruang-tindakan">Ruang Tindakan</Link>
          <Link to="/rawat-inap">Rawat Inap</Link>
          <Link to="/rme">RME</Link>
          <Link to="/farmasi">Farmasi</Link>
          <Link to="/kasir">Kasir</Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Modul registrasi awal pasien</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="registration-content">
        <header className="registration-header">
          <div>
            <small>Modul Operasional</small>
            <h1>Pendaftaran Pasien</h1>
            <p>
              Pusat layanan registrasi pasien baru, kunjungan ulang, rujukan,
              dan antrean awal sebelum masuk ke unit pelayanan rumah sakit.
            </p>
          </div>

          <Link className="new-patient-button-link" to="/pendaftaran/pasien-baru">
            + Daftarkan Pasien Baru
          </Link>
        </header>

        {loadError && (
          <section className="registration-warning-banner">
            <strong>Data pendaftaran belum dapat dimuat.</strong>
            <span>{loadError}</span>
          </section>
        )}

        <section className="registration-stat-grid">
          {registrationStats.map((item) => (
            <article className="registration-stat-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </article>
          ))}
        </section>

        <section className="registration-workspace-grid">
          <article className="registration-panel patient-search-panel">
            <div className="registration-panel-title">
              <small>Pencarian Cepat</small>
              <h2>Temukan Pasien</h2>
            </div>

            <div className="patient-search-form">
              <label>
                <span>NIK / No. RM / Nama Pasien</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Contoh: RM-000241 atau Siti Rahmawati"
                />
              </label>

              <div className="search-filter-row">
                <label>
                  <span>Dokter Penanggung Jawab</span>
                  <select
                    value={doctorFilter}
                    onChange={(event) => setDoctorFilter(event.target.value)}
                  >
                    <option value="all">Semua Dokter</option>
                    <option value="unassigned">Belum Ditentukan</option>
                    {doctorFilterOptions.map((doctor) => (
                      <option value={doctor} key={doctor}>
                        {doctor}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Jenis Kunjungan</span>
                  <select
                    value={visitTypeFilter}
                    onChange={(event) => setVisitTypeFilter(event.target.value)}
                  >
                    <option value="all">Semua Jenis Kunjungan</option>
                    {visitChannels.map((channel) => (
                      <option value={channel} key={channel}>
                        {channel}
                      </option>
                    ))}
                    <option value="Pasien Baru">Pasien Baru</option>
                    <option value="Pasien Lama">Pasien Lama</option>
                    <option value="Rujukan">Rujukan</option>
                  </select>
                </label>

                <label>
                  <span>Status Registrasi</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">Semua Status</option>
                    <option value="Menunggu">Menunggu</option>
                    <option value="Terverifikasi">Terverifikasi</option>
                    <option value="Dilayani">Dilayani</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </label>
              </div>

              <div className="search-action-row">
                <button
                  className="search-primary-button"
                  type="button"
                  onClick={handleSearchPatient}
                >
                  Cari Pasien
                </button>
                <button
                  className="search-secondary-button"
                  type="button"
                  onClick={resetRegistrationSearch}
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </article>

          <article className="registration-panel process-map-panel">
            <div className="registration-panel-title">
              <small>Alur Registrasi</small>
              <h2>Proses Layanan</h2>
            </div>

            <div className="registration-flow">
              <div>
                <span>01</span>
                <strong>Identifikasi Pasien</strong>
                <p>Cari data pasien lama atau buat identitas pasien baru.</p>
              </div>

              <div>
                <span>02</span>
                <strong>Pilih Tujuan Layanan</strong>
                <p>Poli, IGD, kontrol ulang, atau layanan rujukan.</p>
              </div>

              <div>
                <span>03</span>
                <strong>Buat Antrean</strong>
                <p>Nomor antrean terbit untuk proses pelayanan berikutnya.</p>
              </div>
            </div>
          </article>
        </section>

        <section className="registration-panel registration-table-panel">
          <div className="registration-table-header">
            <div className="registration-panel-title">
              <small>Registrasi Hari Ini</small>
              <h2>Daftar Pendaftaran Pasien</h2>
            </div>

            <div className="table-action-group">
              <button type="button">Export</button>
              <button type="button">Filter Lanjutan</button>
              <button
                type="button"
                className="reset-demo-data-button"
                onClick={refreshData}
              >
                Muat Ulang Data
              </button>
            </div>
          </div>

          <div className="registration-table-wrapper">
            <table className="registration-table">
              <thead>
                <tr>
                  <th>No. RM</th>
                  <th>Nama Pasien</th>
                  <th>NIK</th>
                  <th>Tujuan Layanan</th>
                  <th>Dokter</th>
                  <th>Penjamin</th>
                  <th>No. BPJS/Asuransi</th>
                  <th>Antrean</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={10}>Memuat data pendaftaran dari backend...</td>
                  </tr>
                )}

                {!isLoading && filteredRegistrations.length === 0 && (
                  <tr>
                    <td colSpan={10}>Belum ada data pendaftaran.</td>
                  </tr>
                )}

                {!isLoading &&
                  filteredRegistrations.map((row) => (
                    <tr key={`${row.id}-${row.queue}`}>
                      <td>{row.rm}</td>
                      <td>{row.patient}</td>
                      <td>{row.nik}</td>
                      <td>{row.service}</td>
                      <td>
                        <span className="registration-doctor-name">
                          {row.doctor && row.doctor !== '-'
                            ? row.doctor
                            : 'Belum Ditentukan'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`registration-payer-badge ${
                            row.payerType === 'BPJS'
                              ? 'bpjs'
                              : row.payerType === 'Asuransi'
                                ? 'insurance'
                                : 'general'
                          }`}
                        >
                          {row.payerType === 'BPJS'
                            ? 'BPJS'
                            : row.payerType === 'Asuransi'
                              ? 'Asuransi'
                              : 'Umum'}
                        </span>
                      </td>
                      <td>
                        {row.payerType === 'Umum'
                          ? '-'
                          : row.insuranceNo && row.insuranceNo !== '-'
                            ? row.insuranceNo
                            : 'Belum Diisi'}
                      </td>
                      <td>
                        {row.status === 'Dibatalkan'
                          ? 'Tidak Aktif'
                          : row.queue}
                      </td>
                      <td>
                        <span
                          className={`registration-status ${
                            row.status === 'Menunggu'
                              ? 'waiting'
                              : row.status === 'Terverifikasi'
                                ? 'verified'
                                : row.status === 'Dibatalkan'
                                  ? 'canceled'
                                  : 'served'
                          }`}
                        >
                          {row.status}
                        </span>
                        <small className="registration-status-note">
                          {getStatusOperationalNote(row.status)}
                        </small>
                      </td>
                      <td>
                        <div className="registration-action-row">
                          <Link
                            className="detail-registration-link"
                            to={`/pendaftaran/detail/${row.id}`}
                          >
                            Lihat Detail
                          </Link>

                          <button
                            className="edit-registration-button"
                            type="button"
                            onClick={() => openEditModal(row)}
                          >
                            {row.status === 'Dibatalkan' ? 'Review' : 'Edit'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {isEditModalOpen && selectedRegistration && (
          <div className="registration-edit-modal-backdrop">
            <div className="registration-edit-modal">
              <div className="registration-edit-modal-header">
                <div>
                  <small>Koreksi Data Pendaftaran</small>
                  <h2>Edit Data Pasien</h2>
                  <p>
                    Digunakan untuk memperbaiki kesalahan input saat proses
                    pendaftaran pasien.
                  </p>
                </div>

                <button type="button" onClick={closeEditModal}>
                  ×
                </button>
              </div>

              <div className="registration-edit-form-grid">
                <div className="dummy-bpjs-panel registration-edit-dummy-bpjs">
                  <div>
                    <strong>Dummy Data BPJS</strong>
                    <span>
                      Pilih data simulasi BPJS untuk mengisi ulang data pasien
                      pada form edit.
                    </span>
                  </div>

                  <select
                    defaultValue=""
                    onChange={(event) => {
                      const selectedDummy = dummyBpjsRegistrationPatients.find(
                        (patient) => patient.insuranceNo === event.target.value,
                      )

                      if (selectedDummy) {
                        applyDummyBpjsToEdit(selectedDummy)
                      }
                    }}
                  >
                    <option value="">Pilih dummy pasien BPJS</option>
                    {dummyBpjsRegistrationPatients.map((patient) => (
                      <option value={patient.insuranceNo} key={patient.insuranceNo}>
                        {patient.label} - {patient.insuranceNo}
                      </option>
                    ))}
                  </select>
                </div>

                <label>
                  <span>No. RM</span>
                  <input value={selectedRegistration.rm} disabled />
                </label>

                <label>
                  <span>NIK</span>
                  <input
                    value={selectedRegistration.nik}
                    onChange={(event) =>
                      setSelectedRegistration({
                        ...selectedRegistration,
                        nik: event.target.value,
                      })
                    }
                    placeholder="Masukkan NIK pasien"
                  />
                </label>

                <label>
                  <span>Nama Lengkap Pasien</span>
                  <input
                    value={selectedRegistration.patient}
                    onChange={(event) =>
                      setSelectedRegistration({
                        ...selectedRegistration,
                        patient: event.target.value,
                      })
                    }
                    placeholder="Masukkan nama lengkap pasien"
                  />
                </label>

                <label>
                  <span>Jenis Kelamin</span>
                  <select
                    value={selectedRegistration.gender}
                    onChange={(event) =>
                      setSelectedRegistration({
                        ...selectedRegistration,
                        gender: event.target.value as RegistrationRow['gender'],
                      })
                    }
                  >
                    <option value="-">Belum Diisi</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </label>

                <label>
                  <span>Tanggal Lahir</span>
                  <div className="date-input-with-picker">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatDateToDDMMYYYY(selectedRegistration.birthDate)}
                      onChange={(event) => {
                        const nextDisplayValue = normalizeDateDisplayInput(
                          event.target.value,
                        )

                        setSelectedRegistration({
                          ...selectedRegistration,
                          birthDate:
                            parseDDMMYYYYToISO(nextDisplayValue) || '-',
                        })
                      }}
                      placeholder="DD-MM-YYYY"
                      maxLength={10}
                    />

                    <button
                      type="button"
                      className="date-picker-button"
                      onClick={() => {
                        const picker = document.getElementById(
                          `edit-birth-date-picker-${selectedRegistration.id}`,
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
                      id={`edit-birth-date-picker-${selectedRegistration.id}`}
                      className="date-picker-hidden-input"
                      type="date"
                      value={
                        selectedRegistration.birthDate === '-'
                          ? ''
                          : selectedRegistration.birthDate
                      }
                      onChange={(event) =>
                        setSelectedRegistration({
                          ...selectedRegistration,
                          birthDate: event.target.value || '-',
                        })
                      }
                    />
                  </div>

                  <small className="date-format-preview">
                    Format tanggal: DD-MM-YYYY
                  </small>
                </label>

                <label>
                  <span>No. HP / Kontak</span>
                  <input
                    value={selectedRegistration.phone}
                    onChange={(event) =>
                      setSelectedRegistration({
                        ...selectedRegistration,
                        phone: event.target.value,
                      })
                    }
                    placeholder="Contoh: 081234567890"
                  />
                </label>

                <label className="full-width">
                  <span>Alamat Pasien</span>
                  <textarea
                    value={selectedRegistration.address}
                    onChange={(event) =>
                      setSelectedRegistration({
                        ...selectedRegistration,
                        address: event.target.value,
                      })
                    }
                    placeholder="Masukkan alamat pasien"
                    rows={3}
                  />
                </label>

                <label>
                  <span>Tujuan Layanan</span>
                  <select
                    value={selectedRegistration.service}
                    onChange={(event) =>
                      setSelectedRegistration((currentRegistration) =>
                        currentRegistration
                          ? {
                              ...currentRegistration,
                              service: event.target.value,
                              doctor: getDefaultDoctorName(event.target.value),
                              queue: normalizeQueueByService(
                                event.target.value,
                                currentRegistration.queue,
                              ),
                            }
                          : currentRegistration,
                      )
                    }
                  >
                    <option value="Poli Umum">Poli Umum</option>
                    <option value="IGD">IGD</option>
                    <option value="Poli Penyakit Dalam">
                      Poli Penyakit Dalam
                    </option>
                    <option value="Poli Anak">Poli Anak</option>
                    <option value="Poli Bedah">Poli Bedah</option>
                    <option value="Poli Kandungan">Poli Kandungan</option>
                    <option value="Poli Gigi">Poli Gigi</option>
                    <option value="Laboratorium">Laboratorium</option>
                    <option value="Radiologi">Radiologi</option>
                  </select>
                </label>

                <label>
                  <span>Dokter Penanggung Jawab</span>
                  <select
                    value={selectedRegistration?.doctor ?? getDefaultDoctorName(selectedRegistration?.service ?? 'Poli Umum')}
                    onChange={(event) =>
                      setSelectedRegistration((currentRegistration) =>
                        currentRegistration
                          ? {
                              ...currentRegistration,
                              doctor: event.target.value,
                            }
                          : currentRegistration,
                      )
                    }
                  >
                    {getDoctorOptionsByService(
                      selectedRegistration?.service ?? 'Poli Umum',
                    ).map((doctor: string) => (
                      <option value={doctor} key={doctor}>
                        {doctor}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Jenis Kunjungan</span>
                  <select
                    value={selectedRegistration.type}
                    onChange={(event) =>
                      setSelectedRegistration({
                        ...selectedRegistration,
                        type: event.target.value,
                      })
                    }
                  >
                    <option value="Pasien Baru">Pasien Baru</option>
                    <option value="Pasien Lama">Pasien Lama</option>
                    <option value="Kontrol Ulang">Kontrol Ulang</option>
                    <option value="Rujukan">Rujukan</option>
                    <option value="IGD">IGD</option>
                  </select>
                </label>

                <label>
                  <span>Jenis Pasien / Penjamin</span>
                  <select
                    value={selectedRegistration.payerType}
                    onChange={(event) =>
                      setSelectedRegistration((currentRegistration) => {
                        if (!currentRegistration) {
                          return currentRegistration
                        }

                        const nextPayerType =
                          event.target.value as RegistrationRow['payerType']

                        return {
                          ...currentRegistration,
                          payerType: nextPayerType,
                          insuranceNo:
                            nextPayerType === 'Umum'
                              ? '-'
                              : nextPayerType === 'BPJS'
                                ? getDefaultBpjsNumber(
                                    currentRegistration.nik,
                                    currentRegistration.patient,
                                  )
                                : currentRegistration.insuranceNo === '-' ||
                                    !currentRegistration.insuranceNo
                                  ? 'ASR-2026-0001'
                                  : currentRegistration.insuranceNo,
                        }
                      })
                    }
                  >
                    <option value="Umum">Umum / Mandiri</option>
                    <option value="BPJS">BPJS Kesehatan</option>
                    <option value="Asuransi">Asuransi / Perusahaan</option>
                  </select>
                </label>

                <label>
                  <span>
                    {selectedRegistration.payerType === 'BPJS'
                      ? 'No. Kartu BPJS'
                      : selectedRegistration.payerType === 'Asuransi'
                        ? 'No. Polis / Kartu Asuransi'
                        : 'No. Penjamin'}
                  </span>
                  <input
                    value={
                      selectedRegistration.payerType === 'BPJS' &&
                      (!selectedRegistration.insuranceNo ||
                        selectedRegistration.insuranceNo === '-')
                        ? getDefaultBpjsNumber(
                            selectedRegistration.nik,
                            selectedRegistration.patient,
                          )
                        : selectedRegistration.insuranceNo
                    }
                    disabled={selectedRegistration.payerType === 'Umum'}
                    onChange={(event) =>
                      setSelectedRegistration({
                        ...selectedRegistration,
                        insuranceNo: event.target.value,
                      })
                    }
                    placeholder={
                      selectedRegistration.payerType === 'BPJS'
                        ? 'Masukkan nomor kartu BPJS'
                        : selectedRegistration.payerType === 'Asuransi'
                          ? 'Masukkan nomor kartu asuransi'
                          : '-'
                    }
                  />
                </label>

                <label>
                  <span>Nomor Antrean</span>
                  <input
                    value={selectedRegistration.queue}
                    onChange={(event) =>
                      setSelectedRegistration({
                        ...selectedRegistration,
                        queue: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>Status Registrasi</span>
                  <select
                    value={selectedRegistration.status}
                    onChange={(event) =>
                      setSelectedRegistration((currentRegistration) => {
                        if (!currentRegistration) {
                          return currentRegistration
                        }

                        const nextStatus =
                          event.target.value as RegistrationRow['status']

                        return {
                          ...currentRegistration,
                          status: nextStatus,
                          queue:
                            nextStatus === 'Dibatalkan'
                              ? '-'
                              : currentRegistration.queue === '-'
                                ? normalizeQueueByService(
                                    currentRegistration.service,
                                    '001',
                                  )
                                : currentRegistration.queue,
                        }
                      })
                    }
                  >
                    <option value="Menunggu">Menunggu</option>
                    <option value="Terverifikasi">Terverifikasi</option>
                    <option value="Dilayani">Dilayani</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </label>
              </div>

              <div className="registration-edit-modal-footer">
                <button type="button" onClick={closeEditModal}>
                  Batal
                </button>

                <button type="button" onClick={saveRegistrationEdit}>
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default RegistrationPage
