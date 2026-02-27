import { IsArray, IsMongoId, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @IsString()
  question: string;

  @IsString()
  selectedAnswer: string;
}

export class CreateTreatmentResponseDto {
  @IsMongoId()
  treatment: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
