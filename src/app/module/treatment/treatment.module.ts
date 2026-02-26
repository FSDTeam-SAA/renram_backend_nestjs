import { Module } from '@nestjs/common';
import { TreatmentService } from './treatment.service';
import { TreatmentController } from './treatment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Treatment, TreatmentSchema } from './entities/treatment.entity';
import { User, UserSchema } from '../user/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Treatment.name, schema: TreatmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TreatmentController],
  providers: [TreatmentService],
})
export class TreatmentModule {}
