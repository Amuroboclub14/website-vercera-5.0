export const FEST_STATUS = {
  isOver: true,
  successTitle: 'Vercera 5.0 was a huge success',
  successMessage:
    'Thanks to every participant, sponsor, organizer, and volunteer who made it unforgettable.',
  paymentsClosedMessage:
    'Registrations and payments are now closed because the fest has concluded.',
} as const

export function paymentsAreClosed(): boolean {
  return FEST_STATUS.isOver
}
