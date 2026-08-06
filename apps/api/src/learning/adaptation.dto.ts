import { Transform } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsString, Max, MaxLength, Min } from 'class-validator'

export const AMERICAN_ACCENT = 'en-US' as const
export const DEFAULT_ADAPTATION = {
  sessionMinutes: 15,
  sessionsPerWeek: 5,
  accent: AMERICAN_ACCENT,
  reducedMotion: true,
  soundEnabled: true,
  interests: [] as string[],
  excludedThemes: ['强烈声音', '闪烁动画', '竞争与倒计时'],
  availableMaterials: ['Flash Cards', 'ORT 实体书'],
}

const trimStrings = ({ value }: { value: unknown }): unknown => Array.isArray(value)
  ? (value as unknown[]).map((item): unknown => typeof item === 'string' ? item.trim() : item)
  : value

export class UpdateFamilyAdaptationDto {
  @IsInt() @Min(5) @Max(60)
  sessionMinutes!: number

  @IsInt() @Min(1) @Max(7)
  sessionsPerWeek!: number

  @IsString() @IsIn([AMERICAN_ACCENT])
  accent!: typeof AMERICAN_ACCENT

  @IsBoolean()
  reducedMotion!: boolean

  @IsBoolean()
  soundEnabled!: boolean

  @Transform(trimStrings) @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(40, { each: true })
  interests!: string[]

  @Transform(trimStrings) @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(80, { each: true })
  excludedThemes!: string[]

  @Transform(trimStrings) @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(80, { each: true })
  availableMaterials!: string[]
}
