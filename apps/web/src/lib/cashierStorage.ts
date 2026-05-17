export type CashierPaymentStatus =
  | 'Belum Dibayar'
  | 'Sedang Diproses'
  | 'Lunas'

export type CashierBill = {
  registrationId: string
  consultationFee: number
  medicineFee: number
  totalAmount: number
  status: CashierPaymentStatus
  processedAt?: string
  paidAt?: string
  updatedAt: string
}

const STORAGE_KEY = 'simrs-demo-cashier-bills'

export function getCashierBills(): CashierBill[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as CashierBill[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getCashierBillByRegistrationId(
  registrationId: string,
): CashierBill | undefined {
  return getCashierBills().find(
    (item) => item.registrationId === registrationId,
  )
}

export function ensureCashierBill(
  registrationId: string,
  consultationFee: number,
  medicineFee: number,
): CashierBill {
  const existing = getCashierBillByRegistrationId(registrationId)

  if (existing) {
    return existing
  }

  const totalAmount = consultationFee + medicineFee

  const created: CashierBill = {
    registrationId,
    consultationFee,
    medicineFee,
    totalAmount,
    status: 'Belum Dibayar',
    updatedAt: new Date().toISOString(),
  }

  const updated = [created, ...getCashierBills()]
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

  return created
}

export function updateCashierBillStatus(
  registrationId: string,
  status: CashierPaymentStatus,
): CashierBill | undefined {
  const current = getCashierBills()
  const existing = getCashierBillByRegistrationId(registrationId)

  if (!existing) {
    return undefined
  }

  const updatedBill: CashierBill = {
    ...existing,
    status,
    processedAt:
      status === 'Sedang Diproses'
        ? new Date().toISOString()
        : existing.processedAt,
    paidAt:
      status === 'Lunas'
        ? new Date().toISOString()
        : existing.paidAt,
    updatedAt: new Date().toISOString(),
  }

  const updated = current.map((item) =>
    item.registrationId === registrationId ? updatedBill : item,
  )

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

  return updatedBill
}
