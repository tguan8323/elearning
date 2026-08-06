import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'
import {
  returnToParentRequestSchema,
  switchToLearnerRequestSchema,
  updateLearnerPinRequestSchema,
  updateLearnerRequestSchema,
  parentPasswordRequestSchema,
  confirmLearnerDeletionRequestSchema,
} from '@family-english/contracts'

type Parser = {
  safeParse(value: unknown):
    | { success: true; data: unknown }
    | { success: false }
}

function parse(schema: Parser, value: unknown) {
  const result = schema.safeParse(value)
  if (!result.success) throw new BadRequestException('请求信息格式不正确')
  return result.data
}

@Injectable()
export class SwitchToLearnerPipe implements PipeTransform {
  transform(value: unknown) { return parse(switchToLearnerRequestSchema, value) }
}

@Injectable()
export class ReturnToParentPipe implements PipeTransform {
  transform(value: unknown) { return parse(returnToParentRequestSchema, value) }
}

@Injectable()
export class UpdateLearnerPipe implements PipeTransform {
  transform(value: unknown) { return parse(updateLearnerRequestSchema, value) }
}

@Injectable()
export class UpdateLearnerPinPipe implements PipeTransform {
  transform(value: unknown) { return parse(updateLearnerPinRequestSchema, value) }
}

@Injectable()
export class ParentPasswordPipe implements PipeTransform {
  transform(value: unknown) { return parse(parentPasswordRequestSchema, value) }
}

@Injectable()
export class ConfirmLearnerDeletionPipe implements PipeTransform {
  transform(value: unknown) { return parse(confirmLearnerDeletionRequestSchema, value) }
}
