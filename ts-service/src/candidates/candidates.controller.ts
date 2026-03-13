import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/auth-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { CandidatesService } from './candidates.service';
import {
  CandidateDocumentResponseDto,
  CandidateSummaryResponseDto,
  RequestSummaryDto,
  UploadDocumentDto,
  CreateCandidateDto,
  CandidateResponseDto,
} from './dto';

@Controller('candidates')
@UseGuards(FakeAuthGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  /**
   * POST /candidates
   * Create a candidate (internal use for testing)
   */
  @Post()
  @HttpCode(201)
  async createCandidate(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCandidateDto,
  ): Promise<CandidateResponseDto> {
    return this.candidatesService.createCandidate(user, dto);
  }

  /**
   * GET /candidates
   * List all candidates in workspace
   */
  @Get()
  async listCandidates(@CurrentUser() user: AuthUser): Promise<CandidateResponseDto[]> {
    return this.candidatesService.listCandidates(user);
  }

  /**
   * POST /candidates/:candidateId/documents
   * Upload a document for a candidate
   */
  @Post(':candidateId/documents')
  @HttpCode(201)
  async uploadDocument(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Body() dto: UploadDocumentDto,
  ): Promise<CandidateDocumentResponseDto> {
    return this.candidatesService.uploadDocument(user, candidateId, dto);
  }

  /**
   * POST /candidates/:candidateId/summaries/generate
   * Request summary generation for a candidate
   */
  @Post(':candidateId/summaries/generate')
  @HttpCode(202)
  async generateSummary(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Body() _dto: RequestSummaryDto,
  ): Promise<CandidateSummaryResponseDto> {
    return this.candidatesService.requestSummaryGeneration(user, candidateId);
  }

  /**
   * GET /candidates/:candidateId/summaries
   * List all summaries for a candidate
   */
  @Get(':candidateId/summaries')
  async listSummaries(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ): Promise<CandidateSummaryResponseDto[]> {
    return this.candidatesService.listSummaries(user, candidateId);
  }

  /**
   * GET /candidates/:candidateId/summaries/:summaryId
   */
  @Get(':candidateId/summaries/:summaryId')
  async getSummary(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Param('summaryId') summaryId: string,
  ): Promise<CandidateSummaryResponseDto> {
    return this.candidatesService.getSummary(user, candidateId, summaryId);
  }

  /**
   * GET /candidates/:candidateId/documents
   */
  @Get(':candidateId/documents')
  async listDocuments(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ): Promise<CandidateDocumentResponseDto[]> {
    return this.candidatesService.listDocuments(user, candidateId);
  }

  /**
   * GET /candidates/:candidateId/documents/:documentId
   * Get a single document by ID
   */
  @Get(':candidateId/documents/:documentId')
  async getDocument(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Param('documentId') documentId: string,
  ): Promise<CandidateDocumentResponseDto> {
    return this.candidatesService.getDocument(user, candidateId, documentId);
  }
}
