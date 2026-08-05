import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'
import {
  createLearnerRequestSchema,
  type CreateLearnerRequest,
} from '@family-english/contracts'

@Injectable()
export class CreateLearnerPipe implements PipeTransform<unknown, CreateLearnerRequest> {
  transform(value: unknown) {
    const result = createLearnerRequestSchema.safeParse(value)
    if (!result.success) throw new BadRequestException('孩子学习身份信息格式不正确')
    return result.data
  }
}
