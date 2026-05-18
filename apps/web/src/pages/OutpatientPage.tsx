import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../lib/api'

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
  status: ApiRegistrationStatus
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

type OutpatientQueueRow = {
  id: string
  queue: string
  rm: string
  patient: string
  service: string
  status: 'Menunggu' | 'Terverifikasi' | 'Dilayani' | 'Dibatalkan'
}

function mapStatus(status: ApiRegistrationStatus): OutpatientQueueRow['status'] {
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

function mapRegistrationToQueue(
  registration: ApiRegistration,
): OutpatientQueueRow {
  return {
    id: registration.id,
    queue: `${registration.clinic.code}-${String(
      registration.queueNumber,
    ).padStart(3, '0')}`,
    rm: registration.patient.medicalRecordNo,
    patient: registration.patient.fullName,
    service: registration.clinic.name,
    status: mapStatus(registration.status),
  }
}

function OutpatientPage() {
  const [outpatientQueue, setOutpatientQueue] = useState<OutpatientQueueRow[]>(
    [],
  )
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadOutpatientQueue = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const registrations = await api.get<ApiRegistration[]>('/registrations')

      const outpatientRows = registrations
        .filter((registration) => registration.clinic.code !== 'IGD')
        .map(mapRegistrationToQueue)

      setOutpatientQueue(outpatientRows)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memuat antrean rawat jalan dari backend.'

      setOutpatientQueue([])
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadOutpatientQueue()
  }, [])

  const readyToServe = useMemo(
    () =>
      outpatientQueue.filter(
        (item) =>
          item.status === 'Menunggu' || item.status === 'Terverifikasi',
      ).length,
    [outpatientQueue],
  )

  const activePolyclinics = useMemo(
    () => new Set(outpatientQueue.map((item) => item.service)).size,
    [outpatientQueue],
  )

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
          <span>Antrean layanan poli rawat jalan</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="outpatient-content">
        <header className="outpatient-header">
          <div>
            <small>Modul Klinis Awal</small>
            <h1>Rawat Jalan</h1>
            <p>
              Monitoring pasien yang telah terdaftar ke poli dan siap diteruskan
              ke pelayanan dokter serta proses rekam medis berikutnya.
            </p>
          </div>

          <div className="outpatient-unit-card">
            <span>Unit Aktif</span>
            <strong>Poli Rawat Jalan</strong>
            <p>Queue Monitoring Backend</p>
          </div>
        </header>

        {loadError && (
          <section className="registration-warning-banner">
            <strong>Antrean rawat jalan belum dapat dimuat.</strong>
            <span>{loadError}</span>
          </section>
        )}

        <section className="outpatient-stat-grid">
          <article className="outpatient-stat-card">
            <span>Pasien Siap Diperiksa</span>
            <strong>{readyToServe}</strong>
            <small>Status menunggu / terverifikasi</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Poli Aktif</span>
            <strong>{activePolyclinics}</strong>
            <small>Berdasarkan registrasi backend</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Total Antrean Rawat Jalan</span>
            <strong>{outpatientQueue.length}</strong>
            <small>Data registrasi non-IGD</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Integrasi Modul</span>
            <strong>Live</strong>
            <small>Dari API pendaftaran</small>
          </article>
        </section>

        <section className="outpatient-grid">
          <article className="outpatient-panel">
            <div className="outpatient-panel-title">
              <small>Queue Board</small>
              <h2>Antrean Pasien Rawat Jalan</h2>
            </div>

            <div className="outpatient-table-wrapper">
              <table className="outpatient-table">
                <thead>
                  <tr>
                    <th>Antrean</th>
                    <th>No. RM</th>
                    <th>Nama Pasien</th>
                    <th>Tujuan Poli</th>
                    <th>Status Registrasi</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={6}>Memuat antrean rawat jalan...</td>
                    </tr>
                  )}

                  {!isLoading && outpatientQueue.length === 0 && (
                    <tr>
                      <td colSpan={6}>Belum ada antrean rawat jalan.</td>
                    </tr>
                  )}

                  {!isLoading &&
                    outpatientQueue.map((row) => (
                      <tr key={row.id}>
                        <td>{row.queue}</td>
                        <td>{row.rm}</td>
                        <td>{row.patient}</td>
                        <td>{row.service}</td>
                        <td>
                          <span
                            className={`registration-status ${
                              row.status === 'Menunggu'
                                ? 'waiting'
                                : row.status === 'Terverifikasi'
                                  ? 'verified'
                                  : 'served'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            className="start-exam-button-link"
                            to={`/rawat-jalan/pemeriksaan/${row.id}`}
                          >
                            Mulai Pemeriksaan
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="outpatient-panel outpatient-flow-panel">
            <div className="outpatient-panel-title">
              <small>Alur Rawat Jalan</small>
              <h2>Proses Setelah Registrasi</h2>
            </div>

            <div className="outpatient-process-flow">
              <div>
                <span>01</span>
                <strong>Pasien Masuk Poli</strong>
                <p>Data pasien diterima dari modul pendaftaran backend.</p>
              </div>

              <div>
                <span>02</span>
                <strong>Pemeriksaan Dokter</strong>
                <p>Asesmen klinis, diagnosis awal, dan rencana pelayanan.</p>
              </div>

              <div>
                <span>03</span>
                <strong>Teruskan ke RME</strong>
                <p>Hasil pemeriksaan dicatat sebagai rekam medis pasien.</p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default OutpatientPage
