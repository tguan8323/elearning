import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'

import { UpdateFamilyAdaptationDto } from './adaptation.dto'

const valid = {
  sessionMinutes: 15, sessionsPerWeek: 5, accent: 'en-US', reducedMotion: true, soundEnabled: true,
  interests: ['太空'], excludedThemes: ['竞赛'], availableMaterials: ['Flash Cards'],
}

describe('UpdateFamilyAdaptationDto', () => {
  it('accepts the complete valid family configuration', async () => {
    expect(await validate(plainToInstance(UpdateFamilyAdaptationDto, valid))).toHaveLength(0)
  })

  it.each([
    { ...valid, sessionMinutes: 4 },
    { ...valid, sessionsPerWeek: 8 },
    { ...valid, accent: 'en-GB' },
    { ...valid, reducedMotion: 'false' },
    { ...valid, interests: new Array(21).fill('主题') },
    { ...valid, excludedThemes: [123] },
  ])('strictly rejects invalid or unsupported values', async (input) => {
    expect((await validate(plainToInstance(UpdateFamilyAdaptationDto, input))).length).toBeGreaterThan(0)
  })
})
