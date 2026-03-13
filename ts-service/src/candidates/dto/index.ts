import { IsEnum, IsNotEmpty, IsOptional, IsString, IsEmail, MaxLength, MinLength } from 'class-validator';
import { DocumentType } from '../../entities/candidate-document.entity';
import { RecommendedDecisionEnum } from '../../entities/candidate-summary.entity';

export class CreateCandidateDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;
}

export class CandidateResponseDto {
  id!: string;
  workspaceId!: string;
  fullName!: string;
  email!: string | null;
  createdAt!: Date;
}

export class UploadDocumentDto {
  @IsNotEmpty()
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  rawText!: string;
}

export class RequestSummaryDto {
}

export class CandidateDocumentResponseDto {
  id!: string;
  candidateId!: string;
  documentType!: string;
  fileName!: string;
  storageKey!: string;
  uploadedAt!: Date;
}

export class CandidateSummaryResponseDto {
  id!: string;
  candidateId!: string;
  status!: string;
  score!: number | null;
  strengths!: string[];
  concerns!: string[];
  summary!: string | null;
  recommendedDecision!: string | null;
  provider!: string;
  promptVersion!: number;
  errorMessage!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
