import { randomUUID } from 'crypto';
import * as path from 'path';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthUser } from '../auth/auth.types';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { CandidateDocument, DocumentType } from '../entities/candidate-document.entity';
import { CandidateSummary, SummaryStatus, RecommendedDecisionEnum } from '../entities/candidate-summary.entity';
import { QueueService } from '../queue/queue.service';
import {
  CandidateDocumentResponseDto,
  CandidateSummaryResponseDto,
  CandidateResponseDto,
  CreateCandidateDto,
  UploadDocumentDto,
} from './dto';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(SampleWorkspace)
    private readonly workspaceRepository: Repository<SampleWorkspace>,
    @InjectRepository(SampleCandidate)
    private readonly candidateRepository: Repository<SampleCandidate>,
    @InjectRepository(CandidateDocument)
    private readonly documentRepository: Repository<CandidateDocument>,
    @InjectRepository(CandidateSummary)
    private readonly summaryRepository: Repository<CandidateSummary>,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Create a new candidate in the workspace
   */
  async createCandidate(user: AuthUser, dto: CreateCandidateDto): Promise<CandidateResponseDto> {
    await this.ensureWorkspace(user.workspaceId);

    const candidate = this.candidateRepository.create({
      id: randomUUID(),
      workspaceId: user.workspaceId,
      fullName: dto.fullName.trim(),
      email: dto.email?.trim() ?? null,
    });

    await this.candidateRepository.save(candidate);
    return this.mapCandidateToResponse(candidate);
  }

  /**
   * List all candidates in workspace
   */
  async listCandidates(user: AuthUser): Promise<CandidateResponseDto[]> {
    const candidates = await this.candidateRepository.find({
      where: { workspaceId: user.workspaceId },
      order: { createdAt: 'DESC' },
    });

    return candidates.map((c) => this.mapCandidateToResponse(c));
  }

  /**
   * Upload a document for a candidate
   * Validates workspace access and candidate existence
   */
  async uploadDocument(
    user: AuthUser,
    candidateId: string,
    dto: UploadDocumentDto,
  ): Promise<CandidateDocumentResponseDto> {
    // Verify candidate exists and belongs to user's workspace
    const candidate = await this.getCandidateInWorkspace(candidateId, user.workspaceId);

    const documentId = randomUUID();
    const storageKey = this.generateStorageKey(candidateId, documentId, dto.fileName);

    const document = this.documentRepository.create({
      id: documentId,
      candidateId,
      documentType: dto.documentType,
      fileName: dto.fileName,
      storageKey,
      rawText: dto.rawText,
    });

    await this.documentRepository.save(document);

    return this.mapDocumentToResponse(document);
  }

  /**
   * Request summary generation for a candidate
   * Creates a pending summary record and enqueues the job
   */
  async requestSummaryGeneration(
    user: AuthUser,
    candidateId: string,
  ): Promise<CandidateSummaryResponseDto> {
    // Verify candidate exists and belongs to user's workspace
    await this.getCandidateInWorkspace(candidateId, user.workspaceId);

    // Get candidate's documents
    const documents = await this.documentRepository.find({
      where: { candidateId },
      order: { uploadedAt: 'DESC' },
    });

    if (documents.length === 0) {
      throw new BadRequestException(
        'Candidate must have at least one document before requesting a summary',
      );
    }

    // Create pending summary record
    const summaryId = randomUUID();
    const summary = this.summaryRepository.create({
      id: summaryId,
      candidateId,
      status: SummaryStatus.PENDING,
      score: null,
      strengths: [],
      concerns: [],
      summary: null,
      recommendedDecision: null,
      provider: 'gemini-pro',
      promptVersion: 1,
      errorMessage: null,
    });

    await this.summaryRepository.save(summary);

    // Enqueue the summary generation job
    await this.queueService.enqueue('generate-candidate-summary', {
      summaryId,
      candidateId,
      documentIds: documents.map((d) => d.id),
      workspaceId: user.workspaceId,
    });

    return this.mapSummaryToResponse(summary);
  }

  /**
   * Get all summaries for a candidate
   */
  async listSummaries(
    user: AuthUser,
    candidateId: string,
  ): Promise<CandidateSummaryResponseDto[]> {
    // Verify candidate exists and belongs to user's workspace
    await this.getCandidateInWorkspace(candidateId, user.workspaceId);

    const summaries = await this.summaryRepository.find({
      where: { candidateId },
      order: { createdAt: 'DESC' },
    });

    return summaries.map((s) => this.mapSummaryToResponse(s));
  }

  /**
   * Get a single summary by ID
   */
  async getSummary(
    user: AuthUser,
    candidateId: string,
    summaryId: string,
  ): Promise<CandidateSummaryResponseDto> {
    // Verify candidate exists and belongs to user's workspace
    await this.getCandidateInWorkspace(candidateId, user.workspaceId);

    const summary = await this.summaryRepository.findOne({
      where: {
        id: summaryId,
        candidateId,
      },
    });

    if (!summary) {
      throw new NotFoundException(`Summary ${summaryId} not found`);
    }

    return this.mapSummaryToResponse(summary);
  }

  /**
   * Get all documents for a candidate
   */
  async listDocuments(
    user: AuthUser,
    candidateId: string,
  ): Promise<CandidateDocumentResponseDto[]> {
    // Verify candidate exists and belongs to user's workspace
    await this.getCandidateInWorkspace(candidateId, user.workspaceId);

    const documents = await this.documentRepository.find({
      where: { candidateId },
      order: { uploadedAt: 'DESC' },
    });

    return documents.map((d) => this.mapDocumentToResponse(d));
  }

  /**
   * Get a single document by ID
   */
  async getDocument(
    user: AuthUser,
    candidateId: string,
    documentId: string,
  ): Promise<CandidateDocumentResponseDto> {
    // Verify candidate exists and belongs to user's workspace
    await this.getCandidateInWorkspace(candidateId, user.workspaceId);

    const document = await this.documentRepository.findOne({
      where: {
        id: documentId,
        candidateId,
      },
    });

    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    return this.mapDocumentToResponse(document);
  }

  /**
   * Internal: Get documents for a summary job
   * Used by worker
   */
  async getDocumentsForSummary(
    summaryId: string,
  ): Promise<{ candidateId: string; documents: CandidateDocument[] }> {
    const summary = await this.summaryRepository.findOne({
      where: { id: summaryId },
    });

    if (!summary) {
      throw new NotFoundException(`Summary ${summaryId} not found`);
    }

    const documents = await this.documentRepository.find({
      where: { candidateId: summary.candidateId },
    });

    return {
      candidateId: summary.candidateId,
      documents,
    };
  }

  /**
   * Internal: Update summary with completion result
   * Used by worker
   */
  async updateSummaryCompletion(
    summaryId: string,
    result: {
      score: number;
      strengths: string[];
      concerns: string[];
      summary: string;
      recommendedDecision: string;
    },
  ): Promise<void> {
    await this.summaryRepository.update(
      { id: summaryId },
      {
        status: SummaryStatus.COMPLETED,
        score: result.score,
        strengths: result.strengths,
        concerns: result.concerns,
        summary: result.summary,
        recommendedDecision: result.recommendedDecision as RecommendedDecisionEnum,
        errorMessage: null,
      },
    );
  }

  /**
   * Internal: Update summary with error
   * Used by worker
   */
  async updateSummaryError(summaryId: string, error: string): Promise<void> {
    await this.summaryRepository.update(
      { id: summaryId },
      {
        status: SummaryStatus.FAILED,
        errorMessage: error,
      },
    );
  }

  /**
   * Verify candidate exists and belongs to user's workspace
   * Throws NotFoundException if not found
   */
  private async getCandidateInWorkspace(
    candidateId: string,
    workspaceId: string,
  ): Promise<SampleCandidate> {
    const candidate = await this.candidateRepository.findOne({
      where: {
        id: candidateId,
        workspaceId,
      },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate ${candidateId} not found in workspace`);
    }

    return candidate;
  }

  /**
   * Generate a storage key for a document
   * Using local file storage paths convention
   */
  private generateStorageKey(candidateId: string, documentId: string, fileName: string): string {
    const timestamp = new Date().getTime();
    const ext = path.extname(fileName) || '.txt';
    return `candidates/${candidateId}/documents/${documentId}/${timestamp}${ext}`;
  }

  private mapDocumentToResponse(document: CandidateDocument): CandidateDocumentResponseDto {
    return {
      id: document.id,
      candidateId: document.candidateId,
      documentType: document.documentType,
      fileName: document.fileName,
      storageKey: document.storageKey,
      uploadedAt: document.uploadedAt,
    };
  }

  private mapSummaryToResponse(summary: CandidateSummary): CandidateSummaryResponseDto {
    return {
      id: summary.id,
      candidateId: summary.candidateId,
      status: summary.status,
      score: summary.score,
      strengths: summary.strengths || [],
      concerns: summary.concerns || [],
      summary: summary.summary,
      recommendedDecision: summary.recommendedDecision,
      provider: summary.provider,
      promptVersion: summary.promptVersion,
      errorMessage: summary.errorMessage,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
    };
  }

  private async ensureWorkspace(workspaceId: string): Promise<void> {
    const existing = await this.workspaceRepository.findOne({ where: { id: workspaceId } });

    if (existing) {
      return;
    }

    const workspace = this.workspaceRepository.create({
      id: workspaceId,
      name: `Workspace ${workspaceId}`,
    });

    await this.workspaceRepository.save(workspace);
  }

  private mapCandidateToResponse(candidate: SampleCandidate): CandidateResponseDto {
    return {
      id: candidate.id,
      workspaceId: candidate.workspaceId,
      fullName: candidate.fullName,
      email: candidate.email,
      createdAt: candidate.createdAt,
    };
  }
}
