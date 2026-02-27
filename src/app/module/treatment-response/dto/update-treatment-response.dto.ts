import { PartialType } from '@nestjs/mapped-types';
import { CreateTreatmentResponseDto } from './create-treatment-response.dto';

export class UpdateTreatmentResponseDto extends PartialType(CreateTreatmentResponseDto) {}
