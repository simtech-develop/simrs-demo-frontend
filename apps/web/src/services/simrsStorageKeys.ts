export const simrsStorageKeys = {
  registrationEditOverrides: 'simrs_registration_edit_overrides',
  lastRegistrationEdit: 'simrs_last_registration_edit',

  rmeCashierBilling: 'simrs_rme_cashier_billing_demo',
  outpatientExam: 'simrs_outpatient_exam_demo',

  cashierPayment: 'simrs_cashier_payment_demo',
  pharmacyQueue: 'simrs_pharmacy_queue_demo',
  pharmacyDispense: 'simrs_pharmacy_dispense_demo',

  inpatientAdmission: 'simrs_inpatient_admission_demo',
  inpatientDailyCare: 'simrs_inpatient_daily_care_demo',

  operatingRoomCosts: 'simrs_operating_room_costs',
} as const

export type SimrsStorageKey =
  (typeof simrsStorageKeys)[keyof typeof simrsStorageKeys]
