import { PartialType } from '@nestjs/mapped-types';
import { CreateTreatmentBenefitDto } from './create-treatment-benefit.dto';

export class UpdateTreatmentBenefitDto extends PartialType(CreateTreatmentBenefitDto) {}
