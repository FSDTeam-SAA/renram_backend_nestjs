import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  TreatmentResponse,
  TreatmentResponseDocument,
} from './entities/treatment-response.entity';
import { CreateTreatmentResponseDto } from './dto/create-treatment-response.dto';

import {
  TreatmentBenefit,
  TreatmentBenefitDocment,
} from '../treatment-benefit/entities/treatment-benefit.entity';

import { User, UserDocument } from '../user/entities/user.entity';

import {
  Treatment,
  TreatmentDocment,
} from '../treatment/entities/treatment.entity';

import { Product, ProductDocument } from '../product/entities/product.entity';

type QuestionSource = TreatmentBenefitDocment | TreatmentDocment;
type TreatmentQuestion = QuestionSource['treatmentQuestions'][number];

type MatchSummary = {
  level: 'recommended' | 'possible' | 'low';
  statusBadge: string;
  title: string;
  text: string;
};

const RAW_SCORE_MIN = 1;
const RAW_SCORE_MAX = 10;

@Injectable()
export class TreatmentResponseService {
  constructor(
    @InjectModel(TreatmentResponse.name)
    private readonly responseModel: Model<TreatmentResponseDocument>,

    @InjectModel(TreatmentBenefit.name)
    private readonly treatmentBenefitModel: Model<TreatmentBenefitDocment>,

    @InjectModel(Treatment.name)
    private readonly treatmentModel: Model<TreatmentDocment>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // ✅ COMBINED NAMES
  async allTreatmentNamesAndTreatmentBenefinitNames() {
    const treatmentNames = await this.treatmentModel.distinct('name');

    const treatmentBenefitNames =
      await this.treatmentBenefitModel.distinct('title');

    const treatmentBenefitNamesOnly = treatmentBenefitNames.map((title) =>
      title.includes('From ') ? title.split('From ')[1] : title,
    );

    const combined = [
      ...new Set([...treatmentNames, ...treatmentBenefitNamesOnly]),
    ].map((item) => item.trim().toLowerCase());

    return { combined };
  }

  // ✅ SOURCE
  private async getQuestionSource(dto: CreateTreatmentResponseDto) {
    if (dto.treatmentBenefit) {
      const tb = await this.treatmentBenefitModel.findById(
        dto.treatmentBenefit,
      );
      if (!tb) throw new HttpException('Treatment benefit not found', 404);

      return {
        sourceType: 'treatmentBenefit' as const,
        source: tb,
        sourceId: tb._id,
        sourceTitle: tb.title,
        category: tb.category,
      };
    }

    if (dto.treatment) {
      const t = await this.treatmentModel.findById(dto.treatment);
      if (!t) throw new HttpException('Treatment not found', 404);

      return {
        sourceType: 'treatment' as const,
        source: t,
        sourceId: t._id,
        sourceTitle: t.name,
        category: t.category,
      };
    }

    throw new HttpException('Treatment or Benefit required', 400);
  }

  // ✅ NORMALIZE
  private normalizeSelectedAnswer(selectedAnswer: string) {
    return selectedAnswer.replace(/\s*[—-]\s*\d+\s*$/, '').trim();
  }

  // ✅ 1–10 → % (20–100 STEP)
  private convertRawScoreToPercentage(rawScore: number) {
    const percentage =
      ((rawScore - RAW_SCORE_MIN) / (RAW_SCORE_MAX - RAW_SCORE_MIN)) * 100;

    const stepped = Math.round(percentage / 5) * 5;

    return Math.min(100, Math.max(20, stepped));
  }

  // ✅ SCORE LOGIC (UPDATED FOR 10 SCALE)
  private getAnswerScore(
    questionData: TreatmentQuestion | undefined,
    selectedAnswer: string,
  ) {
    const normalized =
      this.normalizeSelectedAnswer(selectedAnswer).toLowerCase();

    const weighted = questionData?.optionWeights?.find(
      (o) => this.normalizeSelectedAnswer(o.label).toLowerCase() === normalized,
    );

    if (weighted?.score) return weighted.score;

    const correct = questionData?.answare
      ? this.normalizeSelectedAnswer(questionData.answare).toLowerCase()
      : undefined;

    if (correct === normalized) return 10;

    if (normalized.includes('none')) return 1;

    return 5; // middle score (balanced)
  }

  // ✅ MATCH SUMMARY
  private getMatchSummary(matchPercentage: number): MatchSummary {
    if (matchPercentage >= 70) {
      return {
        level: 'recommended',
        statusBadge: 'Recommended Match',
        title: 'You may be a good fit for this treatment',
        text: `This treatment strongly matches your symptoms.`,
      };
    }

    if (matchPercentage >= 40) {
      return {
        level: 'possible',
        statusBadge: 'Possible Match',
        title: 'This treatment may still help you',
        text: `Partial match found based on your answers.`,
      };
    }

    return {
      level: 'low',
      statusBadge: 'Low Match',
      title: 'This may not be suitable now',
      text: `Try exploring alternative treatments.`,
    };
  }

  // ✅ EVALUATION (FIXED AVERAGE BUG)
  private evaluateAnswers(
    questionSource: QuestionSource,
    dto: CreateTreatmentResponseDto,
  ) {
    const evaluatedAnswers = dto.answers.map((ans) => {
      const q = questionSource.treatmentQuestions.find(
        (qq) => qq.question === ans.question,
      );

      const raw = this.getAnswerScore(q, ans.selectedAnswer);
      const score = this.convertRawScoreToPercentage(raw);

      return {
        question: ans.question,
        selectedAnswer: this.normalizeSelectedAnswer(ans.selectedAnswer),
        score,
        matchLevel:
          score >= 70 ? 'recommended' : score >= 40 ? 'possible' : 'low',
      };
    });

    const totalQuestions = evaluatedAnswers.length;

    const avg =
      totalQuestions > 0
        ? evaluatedAnswers.reduce((sum, a) => sum + a.score, 0) / totalQuestions
        : 0;

    const matchPercentage = Math.round(avg / 5) * 5;

    return {
      evaluatedAnswers,
      totalQuestions,
      totalScore: matchPercentage,
      averageScore: matchPercentage,
      matchPercentage,
      resultSummary: this.getMatchSummary(matchPercentage),
    };
  }

  // ✅ SMART PRODUCT MATCH
  private async getRecommendedProducts(source: {
    sourceType: 'treatment' | 'treatmentBenefit';
    sourceTitle: string;
    category?: string;
  }) {
    const keywords = [
      source.sourceTitle?.toLowerCase(),
      source.category?.toLowerCase(),
    ].filter((keyword): keyword is string => Boolean(keyword));

    if (!keywords.length) return [];

    return this.productModel
      .find({
        $or: [
          {
            category: {
              $in: keywords.map((k) => new RegExp(k, 'i')),
            },
          },
          {
            name: {
              $in: keywords.map((k) => new RegExp(k, 'i')),
            },
          },
        ],
      })
      .limit(4)
      .sort({ createdAt: -1 })
      .select('name category description price image');
  }

  // ✅ PREVIEW
  async previewResponse(dto: CreateTreatmentResponseDto) {
    const source = await this.getQuestionSource(dto);

    const evaluation = this.evaluateAnswers(source.source, dto);

    const products = await this.getRecommendedProducts({
      sourceType: source.sourceType,
      sourceTitle: source.sourceTitle,
      category: source.category,
    });

    return {
      treatmentTitle: source.sourceTitle,
      recommendedProducts: products,
      ...evaluation,
    };
  }

  // ✅ SUBMIT
  async submitResponse(userId: string, dto: CreateTreatmentResponseDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);

    const source = await this.getQuestionSource(dto);

    const evaluation = this.evaluateAnswers(source.source, dto);

    const products = await this.getRecommendedProducts({
      sourceType: source.sourceType,
      sourceTitle: source.sourceTitle,
      category: source.category,
    });

    const result = await this.responseModel.create({
      user: user._id,
      treatment:
        source.sourceType === 'treatment' ? source.sourceId : undefined,
      treatmentBenefit:
        source.sourceType === 'treatmentBenefit' ? source.sourceId : undefined,
      answers: evaluation.evaluatedAnswers,
      totalQuestions: evaluation.totalQuestions,
      totalScore: evaluation.totalScore,
      averageScore: evaluation.averageScore,
      matchPercentage: evaluation.matchPercentage,
      resultSummary: evaluation.resultSummary,
      isCompleted: true,
    });

    return {
      ...result.toObject(),
      recommendedProducts: products,
    };
  }

  // ✅ DASHBOARD
  async myDashboard(userId: string) {
    return this.responseModel
      .find({ user: userId })
      .populate('treatmentBenefit', 'title category')
      .populate('treatment', 'name category');
  }
}
