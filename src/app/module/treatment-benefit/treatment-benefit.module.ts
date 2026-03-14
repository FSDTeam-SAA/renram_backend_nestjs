import { Module } from '@nestjs/common';
import { TreatmentBenefitService } from './treatment-benefit.service';
import { TreatmentBenefitController } from './treatment-benefit.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TreatmentBenefit,
  TreatmentBenefitSchema,
} from './entities/treatment-benefit.entity';
import { User, UserSchema } from '../user/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TreatmentBenefit.name, schema: TreatmentBenefitSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TreatmentBenefitController],
  providers: [TreatmentBenefitService],
})
export class TreatmentBenefitModule {}
