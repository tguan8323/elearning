import { IsIn, IsString, Length, Matches, MaxLength } from 'class-validator'

const LEARNER_AVATARS = ['fox', 'panda', 'dolphin']

export class CreateLearnerDto {
  @IsString()
  @Length(1, 24)
  @MaxLength(24)
  nickname!: string

  @IsString()
  @IsIn(LEARNER_AVATARS)
  avatarId!: string

  @IsString()
  @Matches(/^\d{6}$/)
  pin!: string
}
