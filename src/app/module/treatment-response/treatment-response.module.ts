import { Module } from '@nestjs/common';
import { TreatmentResponseService } from './treatment-response.service';
import { TreatmentResponseController } from './treatment-response.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Treatment,
  TreatmentSchema,
} from '../treatment/entities/treatment.entity';
import {
  TreatmentResponse,
  TreatmentResponseSchema,
} from './entities/treatment-response.entity';
import { User, UserSchema } from '../user/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Treatment.name, schema: TreatmentSchema },
      { name: TreatmentResponse.name, schema: TreatmentResponseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TreatmentResponseController],
  providers: [TreatmentResponseService],
})
export class TreatmentResponseModule {}
