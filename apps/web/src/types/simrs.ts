export type GuarantorType = 'Umum' | 'BPJS' | 'Asuransi Lain'

export type PaymentStatus =
  | 'Belum Dibayar'
  | 'Verifikasi Penjamin'
  | 'Dibayar'
  | 'Klaim / Penjamin'

export type MedicinePaymentApproval =
  | 'Belum Dipilih'
  | 'Setuju Bayar Obat'
  | 'Tidak Setuju Bayar Obat'

export type PharmacyStatus =
  | 'Order Masuk'
  | 'Diverifikasi Farmasi'
  | 'Obat Disiapkan'
  | 'Obat Siap Diambil'
  | 'Obat Diserahkan'
  | 'Tidak Diambil'

export type BillingItem = {
  source: string
  category: string
  itemName: string
  quantity: number
  unitPrice: number
}

export type CashierPaymentDemo = {
  patientName?: string
  medicalRecordNo?: string
  guarantor?: GuarantorType
  insuranceNumber?: string
  totalBilling?: number
  patientResponsibility?: number
  guarantorResponsibility?: number
  paymentStatus?: PaymentStatus
  medicinePaymentApproval?: MedicinePaymentApproval | string
  isMedicinePaymentApproved?: boolean
  items?: BillingItem[]
  savedAt?: string
}

export type PharmacyQueuePatientDemo = {
  id: string
  medicalRecordNo: string
  patientName: string
  sourceUnit: string
  guarantor: string
  insuranceNumber?: string
  cashierStatus: string
  medicineApproval: string
  pharmacyStatus: PharmacyStatus
  medicineItems: BillingItem[]
  sentAt?: string
}
