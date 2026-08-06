import { Transform } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

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
  structuredGuide: { actions: [], praisePhrases: [], substituteActivities: [], ortRecords: [], objectInventory: [] },
}

const trimStrings = ({ value }: { value: unknown }): unknown => Array.isArray(value)
  ? (value as unknown[]).map((item): unknown => typeof item === 'string' ? item.trim() : item)
  : value

class PlanOverrideDto {
  @IsIn(['skip', 'light_contact', 'specified_ort', 'review_only']) mode!: 'skip' | 'light_contact' | 'specified_ort' | 'review_only'
  @IsString() @MaxLength(200) reason!: string
  @IsOptional() @IsString() @MaxLength(120) specifiedOrt?: string
}

class OrtRecordDto {
  @IsString() @MaxLength(120) title!: string
  @IsString() @MaxLength(40) level!: string
  @IsString() @MaxLength(160) context!: string
  @IsString() @MaxLength(160) interactionGoal!: string
}

class StructuredGuideDto {
  actions!: string[]
  praisePhrases!: string[]
  substituteActivities!: string[]
  ortRecords!: OrtRecordDto[]
  objectInventory!: string[]
}

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

  @IsOptional()
  planOverride?: PlanOverrideDto

  @IsOptional()
  structuredGuide?: StructuredGuideDto
}
