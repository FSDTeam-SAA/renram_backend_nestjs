import {
  IsString,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
}