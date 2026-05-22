import { useMemo, useState } from 'react'
import { Link } from 'react-router'

type PostActionDecision = 'Pulang Setelah Tindakan' | 'Setuju Rawat Inap'

type PaymentGuarantor = 'Umum' | 'BPJS' | 'Asuransi Lain'

const getPostActionFlow = (
  decision: PostActionDecision,
  guarantor: PaymentGuarantor,
) => {
  if (decision === 'Setuju Rawat Inap') {
    return {
      title: 'Lanjut ke Rawat Inap',
      description:
        guarantor === 'BPJS'
          ? 'Keluarga menyetujui rawat inap. Siapkan admisi rawat inap, validasi SEP/BPJS, kelas perawatan, dan DPJP.'
          : guarantor === 'Asuransi Lain'
            ? 'Keluarga menyetujui rawat inap. Siapkan admisi rawat inap, validasi penjamin/asuransi, kelas perawatan, dan DPJP.'
            : 'Keluarga menyetujui rawat inap. Siapkan admisi rawat inap, kelas perawatan, DPJP, dan estimasi biaya mandiri.',
      actionLabel: 'Lanjut ke Rawat Inap',
      targetPath: '/rawat-inap',
      status: 'Admission Rawat Inap',
    }
  }

  return {
    title: 'Lanjut ke Pembayaran Kasir',
    description:
      guarantor === 'BPJS'
        ? 'Keluarga memilih pulang setelah tindakan. Validasi penjamin BPJS dan proses administrasi sesuai ketentuan klaim/biaya layanan.'
        : guarantor === 'Asuransi Lain'
          ? 'Keluarga memilih pulang setelah tindakan. Validasi kartu/polis asuransi dan teruskan tagihan ke kasir.'
          : 'Keluarga memilih pulang setelah tindakan. Tagihan tindakan, obat, dan alat kesehatan diteruskan ke kasir untuk pembayaran mandiri.',
    actionLabel: 'Lanjut Pembayaran Kasir',
    targetPath: '/kasir',
    status: 'Pembayaran Kasir',
  }
}


type OperatingCostCategory =
  | 'Tindakan Dokter'
  | 'Obat'
  | 'Alat Kesehatan'
  | 'Jasa Sarana'
  | 'Penunjang'

type OperatingCostItem = {
  id: string
  tariffCode: string
  category: OperatingCostCategory
  itemName: string
  quantity: number
  unitPrice: number
}

type HospitalTariffItem = {
  code: string
  name: string
  category: OperatingCostCategory
  unit: string
  defaultPrice: number
  serviceUnit: string
}

const hospitalTariffMaster: HospitalTariffItem[] = [
  {
    code: 'TRF-IGD-001',
    name: 'Tindakan operasi / prosedur IGD',
    category: 'Tindakan Dokter',
    unit: 'tindakan',
    defaultPrice: 1500000,
    serviceUnit: 'IGD / Ruang Tindakan',
  },
  {
    code: 'TRF-IGD-002',
    name: 'Konsul dokter spesialis emergensi',
    category: 'Tindakan Dokter',
    unit: 'konsul',
    defaultPrice: 250000,
    serviceUnit: 'IGD',
  },
  {
    code: 'TRF-IGD-003',
    name: 'Oksigenasi',
    category: 'Tindakan Dokter',
    unit: 'tindakan',
    defaultPrice: 150000,
    serviceUnit: 'IGD',
  },
  {
    code: 'TRF-IGD-004',
    name: 'Pemasangan infus',
    category: 'Tindakan Dokter',
    unit: 'tindakan',
    defaultPrice: 125000,
    serviceUnit: 'IGD',
  },
  {
    code: 'TRF-IGD-005',
    name: 'EKG',
    category: 'Penunjang',
    unit: 'pemeriksaan',
    defaultPrice: 200000,
    serviceUnit: 'IGD / Penunjang',
  },
  {
    code: 'TRF-OBT-001',
    name: 'Obat anestesi / injeksi / terapi awal',
    category: 'Obat',
    unit: 'paket',
    defaultPrice: 350000,
    serviceUnit: 'Farmasi',
  },
  {
    code: 'TRF-ALK-001',
    name: 'BMHP tindakan minor',
    category: 'Alat Kesehatan',
    unit: 'paket',
    defaultPrice: 350000,
    serviceUnit: 'Ruang Tindakan',
  },
  {
    code: 'TRF-ALK-002',
    name: 'BMHP operasi / alat kesehatan',
    category: 'Alat Kesehatan',
    unit: 'paket',
    defaultPrice: 750000,
    serviceUnit: 'Ruang Tindakan / IBS',
  },
  {
    code: 'TRF-SAR-001',
    name: 'Jasa sarana ruang tindakan',
    category: 'Jasa Sarana',
    unit: 'episode',
    defaultPrice: 500000,
    serviceUnit: 'Ruang Tindakan',
  },
]

const operatingCostStorageKey = 'simrs_operating_room_costs'

const initialOperatingCostItems: OperatingCostItem[] = [
  {
    id: 'doctor-action-1',
    tariffCode: 'TRF-IGD-001',
    category: 'Tindakan Dokter',
    itemName: 'Tindakan operasi / prosedur IGD',
    quantity: 1,
    unitPrice: 1500000,
  },
  {
    id: 'medicine-1',
    tariffCode: 'TRF-OBT-001',
    category: 'Obat',
    itemName: 'Obat anestesi / injeksi / terapi awal',
    quantity: 1,
    unitPrice: 350000,
  },
  {
    id: 'medical-device-1',
    tariffCode: 'TRF-ALK-002',
    category: 'Alat Kesehatan',
    itemName: 'BMHP operasi / alat kesehatan',
    quantity: 1,
    unitPrice: 750000,
  },
]

const normalizeManualPrice = (value: string) => {
  const digitsOnly = value.replace(/\D/g, '')
  const normalizedValue = digitsOnly.replace(/^0+(?=\d)/, '')

  return Number(normalizedValue || '0')
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)


function OperatingRoomPage() {
  const [postActionDecision, setPostActionDecision] =
    useState<PostActionDecision>('Pulang Setelah Tindakan')
  const [paymentGuarantor, setPaymentGuarantor] =
    useState<PaymentGuarantor>('Umum')
  const postActionFlow = getPostActionFlow(
    postActionDecision,
    paymentGuarantor,
  )

  const [costItems, setCostItems] = useState<OperatingCostItem[]>(
    initialOperatingCostItems,
  )
  const [isBillingSaved, setIsBillingSaved] = useState(false)

  const totalOperatingCost = useMemo(
    () =>
      costItems.reduce(
        (total, item) => total + item.quantity * item.unitPrice,
        0,
      ),
    [costItems],
  )

  const applyTariffItem = (itemId: string, tariffCode: string) => {
    const selectedTariff = hospitalTariffMaster.find(
      (tariff) => tariff.code === tariffCode,
    )

    setCostItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              tariffCode,
              category: selectedTariff?.category || item.category,
              itemName: selectedTariff?.name || item.itemName,
              unitPrice: selectedTariff?.defaultPrice ?? item.unitPrice,
            }
          : item,
      ),
    )

    if (isBillingSaved) {
      setIsBillingSaved(false)
    }
  }

  const updateCostItem = <K extends keyof OperatingCostItem>(
    itemId: string,
    field: K,
    value: OperatingCostItem[K],
  ) => {
    setCostItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    )

    if (isBillingSaved) {
      setIsBillingSaved(false)
    }
  }

  const addCostItem = (category: OperatingCostCategory) => {
    const newItem: OperatingCostItem = {
      id: `cost-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      tariffCode: '',
      category,
      itemName:
        category === 'Tindakan Dokter'
          ? 'Tindakan dokter tambahan'
          : category === 'Obat'
            ? 'Obat tambahan'
            : category === 'Jasa Sarana'
              ? 'Jasa sarana tambahan'
              : category === 'Penunjang'
                ? 'Pemeriksaan penunjang tambahan'
                : 'Alat kesehatan tambahan',
      quantity: 1,
      unitPrice: 0,
    }

    setCostItems((currentItems) => [...currentItems, newItem])
    setIsBillingSaved(false)
  }

  const removeCostItem = (itemId: string) => {
    setCostItems((currentItems) =>
      currentItems.length <= 1
        ? initialOperatingCostItems
        : currentItems.filter((item) => item.id !== itemId),
    )
    setIsBillingSaved(false)
  }

  const saveOperatingBilling = () => {
    const billingPayload = {
      sourceModule: 'Ruang Tindakan / Operasi',
      patientPriority: 'Merah',
      status: postActionFlow.status,
      decision: postActionDecision,
      guarantor: paymentGuarantor,
      nextPath: postActionFlow.targetPath,
      items: costItems,
      total: totalOperatingCost,
      savedAt: new Date().toISOString(),
    }

    window.localStorage.setItem(
      operatingCostStorageKey,
      JSON.stringify(billingPayload),
    )

    setIsBillingSaved(true)
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
          <Link to="/rawat-inap">Rawat Inap</Link>
          <Link to="/rme">RME</Link>
          <Link to="/farmasi">Farmasi</Link>
          <Link to="/kasir">Kasir</Link>
          <Link to="/laporan">Laporan</Link>
        </nav>

        <div className="sidebar-demo-card">
          <small>Demo Instance</small>
          <strong>RS SIMTECH Medika</strong>
          <span>Ruang tindakan dan operasi</span>
          <Link to="/">Keluar dari Demo</Link>
        </div>
      </aside>

      <section className="outpatient-content">
        <header className="outpatient-header">
          <div>
            <small>Modul Lanjutan IGD</small>
            <h1>Ruang Tindakan / Operasi</h1>
            <p>
              Modul ini digunakan untuk pasien IGD yang membutuhkan tindakan
              segera, prosedur operatif, atau penanganan khusus setelah triage.
            </p>
          </div>

          <div className="outpatient-unit-card">
            <span>Status Modul</span>
            <strong>Persiapan</strong>
            <p>Terhubung dari disposisi IGD</p>
          </div>
        </header>

        <section className="outpatient-stat-grid">
          <article className="outpatient-stat-card">
            <span>Pasien Menunggu Tindakan</span>
            <strong>1</strong>
            <small>Dari disposisi IGD merah</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Prioritas</span>
            <strong>Merah</strong>
            <small>Butuh penanganan segera</small>
          </article>

          <article className="outpatient-stat-card">
            <span>Status Ruang</span>
            <strong>Siapkan</strong>
            <small>Koordinasi tindakan/operasi</small>
          </article>
        </section>

        <section className="outpatient-panel">
          <div className="outpatient-panel-title">
            <small>Persiapan Tindakan</small>
            <h2>Checklist Ruang Tindakan / Operasi</h2>
          </div>

          <div className="outpatient-process-flow">
            <div>
              <span>01</span>
              <strong>Validasi Pasien</strong>
              <p>Pastikan identitas pasien, nomor RM, penjamin, dan status IGD.</p>
            </div>

            <div>
              <span>02</span>
              <strong>Persetujuan Tindakan</strong>
              <p>Siapkan informed consent dan catatan DPJP/operator.</p>
            </div>

            <div>
              <span>03</span>
              <strong>Persiapan Tim & Ruang</strong>
              <p>Koordinasikan dokter, perawat, ruang tindakan/IBS, alat, dan BMHP.</p>
            </div>

            <div>
              <span>04</span>
              <strong>Pasca Tindakan</strong>
              <p>Lanjutkan ke rawat inap, observasi IGD, kasir, farmasi, atau RME.</p>
            </div>
          </div>
        </section>


        <section className="outpatient-panel operating-billing-panel">
          <div className="outpatient-panel-title">
            <small>Biaya Tindakan</small>
            <h2>Komponen Biaya Ruang Tindakan</h2>
            <p>
              Estimasi biaya tindakan dokter, obat, dan alat kesehatan/BMHP
              yang nantinya diteruskan ke modul Kasir.
            </p>
          </div>

          <div className="operating-billing-toolbar">
            <button type="button" onClick={() => addCostItem('Tindakan Dokter')}>
              + Tindakan Dokter
            </button>
            <button type="button" onClick={() => addCostItem('Obat')}>
              + Obat
            </button>
            <button type="button" onClick={() => addCostItem('Alat Kesehatan')}>
              + Alat Kesehatan
            </button>
            <button type="button" onClick={() => addCostItem('Jasa Sarana')}>
              + Jasa Sarana
            </button>
            <button type="button" onClick={() => addCostItem('Penunjang')}>
              + Penunjang
            </button>
          </div>

          <div className="operating-cost-list">
            {costItems.map((item) => (
              <article className="operating-cost-card" key={item.id}>
                <div className="operating-cost-card-header">
                  <strong>{item.category}</strong>
                  <button type="button" onClick={() => removeCostItem(item.id)}>
                    Hapus
                  </button>
                </div>

                <div className="form-grid two-columns">
                  <label className="full-span">
                    <span>Pilih Tarif RS</span>
                    <select
                      value={item.tariffCode}
                      onChange={(event) =>
                        applyTariffItem(item.id, event.target.value)
                      }
                    >
                      <option value="">Input manual / tarif khusus</option>
                      {hospitalTariffMaster.map((tariff) => (
                        <option value={tariff.code} key={tariff.code}>
                          {tariff.code} - {tariff.name} - {formatCurrency(tariff.defaultPrice)}
                        </option>
                      ))}
                    </select>
                    <small className="tariff-helper-text">
                      Pilih tarif untuk mengisi harga otomatis, atau kosongkan
                      untuk input manual.
                    </small>
                  </label>

                  <label>
                    <span>Nama Item</span>
                    <input
                      value={item.itemName}
                      onChange={(event) =>
                        updateCostItem(item.id, 'itemName', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Kategori</span>
                    <select
                      value={item.category}
                      onChange={(event) =>
                        updateCostItem(
                          item.id,
                          'category',
                          event.target.value as OperatingCostCategory,
                        )
                      }
                    >
                      <option value="Tindakan Dokter">Tindakan Dokter</option>
                      <option value="Obat">Obat</option>
                      <option value="Alat Kesehatan">Alat Kesehatan</option>
                      <option value="Jasa Sarana">Jasa Sarana</option>
                      <option value="Penunjang">Penunjang</option>
                    </select>
                  </label>

                  <label>
                    <span>Qty</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        updateCostItem(
                          item.id,
                          'quantity',
                          Number(event.target.value) || 1,
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Harga Satuan Manual / Override</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={String(item.unitPrice)}
                      onChange={(event) =>
                        updateCostItem(
                          item.id,
                          'unitPrice',
                          normalizeManualPrice(event.target.value),
                        )
                      }
                      placeholder="Contoh: 750000"
                    />
                    <small className="tariff-helper-text">
                      Harga dari master tarif tetap dapat disesuaikan manual.
                    </small>
                  </label>
                </div>

                <div className="operating-cost-subtotal">
                  <span>Subtotal</span>
                  <strong>
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </strong>
                </div>
              </article>
            ))}
          </div>

          <div className="operating-billing-summary">
            <div>
              <span>Total Estimasi Biaya</span>
              <strong>{formatCurrency(totalOperatingCost)}</strong>
              <p>
                Status: {isBillingSaved ? 'Draft tagihan tersimpan' : 'Belum dikirim ke kasir'}
              </p>
            </div>

            <button type="button" onClick={saveOperatingBilling}>
              Simpan Draft Tagihan Kasir
            </button>
          </div>
        </section>


        <section className="outpatient-panel post-action-decision-panel">
          <div className="outpatient-panel-title">
            <small>Keputusan Keluarga</small>
            <h2>Alur Setelah Tindakan</h2>
            <p>
              Tentukan apakah pasien pulang setelah tindakan dan membayar di
              kasir, atau keluarga menyetujui pasien lanjut rawat inap.
            </p>
          </div>

          <div className="post-action-choice-wrapper">
            <div className="post-action-choice-group">
              <span>Keputusan Setelah Tindakan</span>
              <div className="post-action-button-group">
                {(['Pulang Setelah Tindakan', 'Setuju Rawat Inap'] as PostActionDecision[]).map(
                  (decision) => (
                    <button
                      type="button"
                      className={
                        postActionDecision === decision ? 'active' : ''
                      }
                      onClick={() => setPostActionDecision(decision)}
                      key={decision}
                    >
                      {decision}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="post-action-choice-group">
              <span>Penjamin / Cara Bayar</span>
              <div className="post-action-button-group guarantor">
                {(['Umum', 'BPJS', 'Asuransi Lain'] as PaymentGuarantor[]).map(
                  (guarantor) => (
                    <button
                      type="button"
                      className={paymentGuarantor === guarantor ? 'active' : ''}
                      onClick={() => setPaymentGuarantor(guarantor)}
                      key={guarantor}
                    >
                      {guarantor === 'Umum'
                        ? 'Umum / Mandiri'
                        : guarantor === 'BPJS'
                          ? 'BPJS Kesehatan'
                          : 'Asuransi Lain'}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="post-action-result-card">
            <small>ARAH LANJUTAN</small>
            <h3>{postActionFlow.title}</h3>
            <p>{postActionFlow.description}</p>

            <div className="post-action-result-meta">
              <div>
                <span>Penjamin</span>
                <strong>{paymentGuarantor}</strong>
              </div>
              <div>
                <span>Total Draft Tagihan</span>
                <strong>{formatCurrency(totalOperatingCost)}</strong>
              </div>
              <div>
                <span>Status Tujuan</span>
                <strong>{postActionFlow.status}</strong>
              </div>
            </div>

            <Link className="post-action-primary-link" to={postActionFlow.targetPath}>
              {postActionFlow.actionLabel}
            </Link>
          </div>
        </section>

        <section className="outpatient-panel operating-next-panel">
          <div className="outpatient-panel-title">
            <small>Arah Lanjutan</small>
            <h2>Setelah Tindakan / Operasi</h2>
          </div>

          <div className="operating-next-grid">
            <Link className="operating-next-card primary" to="/rawat-inap">
              <span>01</span>
              <strong>Lanjut Rawat Inap</strong>
              <p>Pasien dipindahkan ke ruang perawatan untuk monitoring lanjutan.</p>
            </Link>

            <Link className="operating-next-card" to="/igd">
              <span>02</span>
              <strong>Kembali Observasi IGD</strong>
              <p>Pasien dipantau kembali di IGD sebelum keputusan akhir.</p>
            </Link>

            <Link className="operating-next-card" to="/farmasi">
              <span>03</span>
              <strong>Lanjut Farmasi</strong>
              <p>Obat dan BMHP diteruskan ke farmasi untuk pelayanan berikutnya.</p>
            </Link>

            <Link className="operating-next-card" to="/kasir">
              <span>04</span>
              <strong>Lanjut Kasir</strong>
              <p>Tindakan, alat, dan layanan masuk proses administrasi biaya.</p>
            </Link>

            <Link className="operating-next-card" to="/rme">
              <span>05</span>
              <strong>Lihat RME</strong>
              <p>Catatan triage, tindakan, dan disposisi masuk rekam medis.</p>
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}

export default OperatingRoomPage
