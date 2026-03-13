import { Test, TestingModule } from '@nestjs/testing';

import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import {
  CandidateDocumentResponseDto,
  CandidateSummaryResponseDto,
  UploadDocumentDto,
} from './dto';

describe('CandidatesController', () => {
  let controller: CandidatesController;
  let service: CandidatesService;

  const mockAuthUser = {
    userId: 'user-1',
    workspaceId: 'workspace-1',
  };

  const mockDocument: CandidateDocumentResponseDto = {
    id: 'doc-1',
    candidateId: 'candidate-1',
    documentType: 'resume',
    fileName: 'resume.txt',
    storageKey: 'candidates/candidate-1/documents/doc-1/123.txt',
    uploadedAt: new Date(),
  };

  const mockSummary: CandidateSummaryResponseDto = {
    id: 'summary-1',
    candidateId: 'candidate-1',
    status: 'pending',
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidatesController],
      providers: [
        {
          provide: CandidatesService,
          useValue: {
            uploadDocument: jest.fn(),
            requestSummaryGeneration: jest.fn(),
            listSummaries: jest.fn(),
            getSummary: jest.fn(),
            listDocuments: jest.fn(),
            getDocument: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CandidatesController>(CandidatesController);
    service = module.get<CandidatesService>(CandidatesService);
  });

  describe('uploadDocument', () => {
    it('should upload a document', async () => {
      const dto: UploadDocumentDto = {
        documentType: 'resume' as any,
        fileName: 'resume.txt',
        rawText: 'Sample resume content',
      };

      jest.spyOn(service, 'uploadDocument').mockResolvedValue(mockDocument);

      const result = await controller.uploadDocument(mockAuthUser, 'candidate-1', dto);

      expect(result.id).toBe('doc-1');
      expect(service.uploadDocument).toHaveBeenCalledWith(mockAuthUser, 'candidate-1', dto);
    });
  });

  describe('generateSummary', () => {
    it('should generate a summary', async () => {
      jest.spyOn(service, 'requestSummaryGeneration').mockResolvedValue(mockSummary);

      const result = await controller.generateSummary(mockAuthUser, 'candidate-1', {});

      expect(result.id).toBe('summary-1');
      expect(result.status).toBe('pending');
      expect(service.requestSummaryGeneration).toHaveBeenCalledWith(mockAuthUser, 'candidate-1');
    });
  });

  describe('listSummaries', () => {
    it('should list summaries', async () => {
      jest.spyOn(service, 'listSummaries').mockResolvedValue([mockSummary]);

      const result = await controller.listSummaries(mockAuthUser, 'candidate-1');

      expect(result).toHaveLength(1);
      expect(service.listSummaries).toHaveBeenCalledWith(mockAuthUser, 'candidate-1');
    });
  });

  describe('getSummary', () => {
    it('should get a summary', async () => {
      jest.spyOn(service, 'getSummary').mockResolvedValue(mockSummary);

      const result = await controller.getSummary(mockAuthUser, 'candidate-1', 'summary-1');

      expect(result.id).toBe('summary-1');
      expect(service.getSummary).toHaveBeenCalledWith(mockAuthUser, 'candidate-1', 'summary-1');
    });
  });

  describe('listDocuments', () => {
    it('should list documents', async () => {
      jest.spyOn(service, 'listDocuments').mockResolvedValue([mockDocument]);

      const result = await controller.listDocuments(mockAuthUser, 'candidate-1');

      expect(result).toHaveLength(1);
      expect(service.listDocuments).toHaveBeenCalledWith(mockAuthUser, 'candidate-1');
    });
  });

  describe('getDocument', () => {
    it('should get a document', async () => {
      jest.spyOn(service, 'getDocument').mockResolvedValue(mockDocument);

      const result = await controller.getDocument(mockAuthUser, 'candidate-1', 'doc-1');

      expect(result.id).toBe('doc-1');
      expect(service.getDocument).toHaveBeenCalledWith(mockAuthUser, 'candidate-1', 'doc-1');
    });
  });
});
