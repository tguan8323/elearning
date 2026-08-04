export const learningObservationOutcomes = [
  'independent',
  'prompted',
  'not_observed',
  'declined',
] as const

export type LearningObservationOutcome =
  (typeof learningObservationOutcomes)[number]
