import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { CandidatesService } from './candidates.service';
import { CandidateDocument, DocumentType } from '../entities/candidate-document.entity';
import { CandidateSummary, SummaryStatus } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { QueueService } from '../queue/queue.service';
import { UploadDocumentDto } from './dto';

describe('CandidatesService', () => {
  let service: CandidatesService;
  let candidateRepository: Repository<SampleCandidate>;
  let documentRepository: Repository<CandidateDocument>;
  let summaryRepository: Repository<CandidateSummary>;
  let queueService: QueueService;

  const mockAuthUser = {
    userId: 'user-1',
    workspaceId: 'workspace-1',
  };

  const mockCandidate: SampleCandidate = {
    id: 'candidate-1',
    workspaceId: 'workspace-1',
    fullName: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date(),
    workspace: null as any,
  };

  const mockDocument: CandidateDocument = {
    id: 'doc-1',
    candidateId: 'candidate-1',
    documentType: DocumentType.RESUME,
    fileName: 'resume.txt',
    storageKey: 'candidates/candidate-1/documents/doc-1/123.txt',
    rawText: 'Sample resume content',
    uploadedAt: new Date(),
    candidate: mockCandidate,
  };

  const mockSummary: CandidateSummary = {
    id: 'summary-1',
    candidateId: 'candidate-1',
    status: SummaryStatus.PENDING,
    score: null,
    strengths: [],
    concerns: [],
    summary: null,
    recommendedDecision: null,
    provider: 'gemini-pro',
    promptVersion: 1,
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    candidate: mockCandidate,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        {
          provide: getRepositoryToken(SampleCandidate),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CandidateDocument),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CandidateSummary),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: QueueService,
          useValue: {
            enqueue: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
    candidateRepository = module.get<Repository<SampleCandidate>>(
      getRepositoryToken(SampleCandidate),
    );
    documentRepository = module.get<Repository<CandidateDocument>>(
      getRepositoryToken(CandidateDocument),
    );
    summaryRepository = module.get<Repository<CandidateSummary>>(
      getRepositoryToken(CandidateSummary),
    );
    queueService = module.get<QueueService>(QueueService);
  });

  describe('uploadDocument', () => {
    it('should upload a document successfully', async () => {
      const dto: UploadDocumentDto = {
        documentType: 'resume' as any,
        fileName: 'resume.txt',
        rawText: 'Sample resume content',
      };

      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(mockCandidate);
      jest.spyOn(documentRepository, 'create').mockReturnValue(mockDocument);
      jest.spyOn(documentRepository, 'save').mockResolvedValue(mockDocument);

      const result = await service.uploadDocument(mockAuthUser, 'candidate-1', dto);

      expect(result.candidateId).toBe('candidate-1');
      expect(result.fileName).toBe('resume.txt');
      expect(result.documentType).toBe(DocumentType.RESUME);
      expect(candidateRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'candidate-1',
          workspaceId: 'workspace-1',
        },
      });
    });

    it('should throw NotFoundException for non-existent candidate', async () => {
      const dto: UploadDocumentDto = {
        documentType: 'resume' as any,
        fileName: 'resume.txt',
        rawText: 'Sample resume content',
      };

      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(null);

      await expect(service.uploadDocument(mockAuthUser, 'non-existent', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('requestSummaryGeneration', () => {
    it('should create pending summary and enqueue job', async () => {
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(mockCandidate);
      jest.spyOn(documentRepository, 'find').mockResolvedValue([mockDocument]);
      jest.spyOn(summaryRepository, 'create').mockReturnValue(mockSummary);
      jest.spyOn(summaryRepository, 'save').mockResolvedValue(mockSummary);
      jest.spyOn(queueService, 'enqueue').mockReturnValue({
        id: 'job-1',
        name: 'generate-candidate-summary',
        payload: {},
        enqueuedAt: new Date().toISOString(),
      });

      const result = await service.requestSummaryGeneration(mockAuthUser, 'candidate-1');

      expect(result.status).toBe(SummaryStatus.PENDING);
      expect(queueService.enqueue).toHaveBeenCalled();
      expect(summaryRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when no documents exist', async () => {
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(mockCandidate);
      jest.spyOn(documentRepository, 'find').mockResolvedValue([]);

      await expect(
        service.requestSummaryGeneration(mockAuthUser, 'candidate-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listSummaries', () => {
    it('should list summaries for a candidate', async () => {
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(mockCandidate);
      jest.spyOn(summaryRepository, 'find').mockResolvedValue([mockSummary]);

      const result = await service.listSummaries(mockAuthUser, 'candidate-1');

      expect(result).toHaveLength(1);
      expect(result[0].candidateId).toBe('candidate-1');
    });
  });

  describe('getSummary', () => {
    it('should get a single summary', async () => {
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(mockCandidate);
      jest.spyOn(summaryRepository, 'findOne').mockResolvedValue(mockSummary);

      const result = await service.getSummary(mockAuthUser, 'candidate-1', 'summary-1');

      expect(result.id).toBe('summary-1');
    });

    it('should throw NotFoundException for non-existent summary', async () => {
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(mockCandidate);
      jest.spyOn(summaryRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getSummary(mockAuthUser, 'candidate-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSummaryCompletion', () => {
    it('should update summary with completion result', async () => {
      const result = {
        score: 85,
        strengths: ['Strong technical skills', 'Good communication'],
        concerns: ['Limited experience', 'No leadership experience'],
        summary: 'John is a strong candidate with relevant skills.',
        recommendedDecision: 'advance',
      };

      await service.updateSummaryCompletion('summary-1', result);

      expect(summaryRepository.update).toHaveBeenCalledWith(
        { id: 'summary-1' },
        expect.objectContaining({
          status: SummaryStatus.COMPLETED,
          score: 85,
        }),
      );
    });
  });

  describe('updateSummaryError', () => {
    it('should update summary with error', async () => {
      await service.updateSummaryError('summary-1', 'API error');

      expect(summaryRepository.update).toHaveBeenCalledWith(
        { id: 'summary-1' },
        expect.objectContaining({
          status: SummaryStatus.FAILED,
          errorMessage: 'API error',
        }),
      );
    });
  });
});
