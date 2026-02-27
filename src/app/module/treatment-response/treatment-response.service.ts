import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TreatmentResponse,
  TreatmentResponseDocument,
} from './entities/treatment-response.entity';
import { CreateTreatmentResponseDto } from './dto/create-treatment-response.dto';
import {
  Treatment,
  TreatmentDocment,
} from '../treatment/entities/treatment.entity';
import { User, UserDocument } from '../user/entities/user.entity';

@Injectable()
export class TreatmentResponseService {
  constructor(
    @InjectModel(TreatmentResponse.name)
    private readonly responseModel: Model<TreatmentResponseDocument>,
    @InjectModel(Treatment.name)
    private readonly treatmentModel: Model<TreatmentDocment>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async submitResponse(userId: string, dto: CreateTreatmentResponseDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const treatment = await this.treatmentModel.findById(dto.treatment);
    if (!treatment) throw new HttpException('Treatment not found', 404);

    const evaluatedAnswers = dto.answers.map((ans) => {
      const questionData = treatment.treatmentQuestions.find(
        (q) => q.question === ans.question,
      );

      const correctAnswer = questionData?.answare || '';
      const isCorrect = correctAnswer === ans.selectedAnswer;

      return {
        question: ans.question,
        selectedAnswer: ans.selectedAnswer,
        correctAnswer,
        isCorrect,
      };
    });

    const correctCount = evaluatedAnswers.filter((a) => a.isCorrect).length;
    const totalQuestions = treatment.treatmentQuestions.length;

    const result = await this.responseModel.create({
      treatment: dto.treatment,
      user: user._id,
      answers: evaluatedAnswers,
      totalQuestions,
      correctCount,
      wrongCount: totalQuestions - correctCount,
      isCompleted: true,
    });

    return result;
  }

  async myDashboard(userId: string) {
    const responses = await this.responseModel
      .find({ user: userId })
      .populate('treatment', 'name description');

    return responses;
  }
}
