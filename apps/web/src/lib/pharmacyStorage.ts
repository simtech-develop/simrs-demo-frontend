export type PharmacyOrderStatus =
  | 'Menunggu Diproses'
  | 'Sedang Disiapkan'
  | 'Obat Siap Diambil'

export type PharmacyOrder = {
  registrationId: string
  status: PharmacyOrderStatus
  processedAt?: string
  readyAt?: string
  updatedAt: string
}

const STORAGE_KEY = 'simrs-demo-pharmacy-orders'

export function getPharmacyOrders(): PharmacyOrder[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as PharmacyOrder[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getPharmacyOrderByRegistrationId(
  registrationId: string,
): PharmacyOrder | undefined {
  return getPharmacyOrders().find(
    (item) => item.registrationId === registrationId,
  )
}

export function ensurePharmacyOrder(
  registrationId: string,
): PharmacyOrder {
  const existing = getPharmacyOrderByRegistrationId(registrationId)

  if (existing) {
    return existing
  }

  const created: PharmacyOrder = {
    registrationId,
    status: 'Menunggu Diproses',
    updatedAt: new Date().toISOString(),
  }

  const updated = [created, ...getPharmacyOrders()]
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

  return created
}

export function updatePharmacyOrderStatus(
  registrationId: string,
  status: PharmacyOrderStatus,
): PharmacyOrder {
  const current = getPharmacyOrders()
  const existing = getPharmacyOrderByRegistrationId(registrationId)

  const next: PharmacyOrder = {
    registrationId,
    status,
    processedAt:
      status === 'Sedang Disiapkan'
        ? new Date().toISOString()
        : existing?.processedAt,
    readyAt:
      status === 'Obat Siap Diambil'
        ? new Date().toISOString()
        : existing?.readyAt,
    updatedAt: new Date().toISOString(),
  }

  const updated = existing
    ? current.map((item) =>
        item.registrationId === registrationId ? next : item,
      )
    : [next, ...current]

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

  return next
}
