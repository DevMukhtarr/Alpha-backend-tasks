import { Injectable, Logger, Inject } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { CandidatesService } from '../candidates/candidates.service';
import { QueueService } from './queue.service';
import { SUMMARIZATION_PROVIDER, SummarizationProvider } from '../llm/summarization-provider.interface';
import { QueueJobStatus } from '../entities/queue-job.entity';

export interface SummaryGenerationJobPayload {
  summaryId: string;
  candidateId: string;
  documentIds: string[];
  workspaceId: string;
}

@Injectable()
export class QueueWorker {
  private readonly logger = new Logger(QueueWorker.name);
  private isProcessing = false;
  private workerInterval: NodeJS.Timeout | null = null;
  private candidatesService: CandidatesService | null = null;

  constructor(
    private readonly queueService: QueueService,
    @Inject(SUMMARIZATION_PROVIDER)
    private readonly summarizationProvider: SummarizationProvider,
    private readonly moduleRef: ModuleRef,
  ) {}

  async initialize(): Promise<void> {
    try {
      this.candidatesService = await this.moduleRef.get(CandidatesService, { strict: false });
      if (!this.candidatesService) {
        throw new Error('Failed to resolve CandidatesService');
      }
      this.logger.log('CandidatesService resolved');
    } catch (error) {
      this.logger.error(`Failed to resolve CandidatesService: ${error}`);
      throw error;
    }
  }

  /**
   * Start the worker to process queued jobs
   */
  async startWorker(): Promise<void> {
    await this.initialize();
    this.logger.log('Queue worker started');
    // Process jobs every 5 seconds
    this.workerInterval = setInterval(() => {
      this.processNextJob().catch((error) => {
        this.logger.error(`Error processing job: ${error}`);
      });
    }, 5000);
  }

  /**
   * Stop the worker
   */
  stopWorker(): void {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
      this.logger.log('Queue worker stopped');
    }
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    const job = await this.queueService.getPendingJob('generate-candidate-summary');

    if (!job) {
      return;
    }

    this.isProcessing = true;

    try {
      // Mark job as processing
      await this.queueService.updateJobStatus(job.id, QueueJobStatus.PROCESSING);

      const payload = job.payload as SummaryGenerationJobPayload;
      await this.handleSummaryGenerationJob(payload);

      // Mark job as completed
      await this.queueService.updateJobStatus(job.id, QueueJobStatus.COMPLETED);
      this.logger.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Job ${job.id} failed: ${errorMessage}`);

      // Increment attempts
      await this.queueService.incrementJobAttempts(job.id);

      // Get the updated job to check attempts
      const updatedJob = await this.queueService.getJobById(job.id);

      if (updatedJob && updatedJob.attempts >= updatedJob.maxAttempts) {
        // Max attempts reached, mark as failed
        await this.queueService.updateJobStatus(job.id, QueueJobStatus.FAILED, errorMessage);
        this.logger.error(`Job ${job.id} marked as FAILED after ${updatedJob.attempts} attempts`);
      } else {
        // Requeue by setting status back to PENDING
        await this.queueService.updateJobStatus(job.id, QueueJobStatus.PENDING, errorMessage);
        this.logger.warn(`Job ${job.id} requeued (attempt ${updatedJob?.attempts || 0})`);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async handleSummaryGenerationJob(payload: SummaryGenerationJobPayload): Promise<void> {
    if (!this.candidatesService) {
      throw new Error('CandidatesService not initialized');
    }

    const { summaryId } = payload;

    try {
      // Get candidate's documents
      const { documents } = await this.candidatesService.getDocumentsForSummary(summaryId);

      if (documents.length === 0) {
        throw new Error('No documents found for candidate');
      }

      // Extract text content from documents
      const documentTexts = documents.map((doc) => doc.rawText);

      // Call summarization provider
      const result = await this.summarizationProvider.generateCandidateSummary({
        candidateId: payload.candidateId,
        documents: documentTexts,
      });

      // Update summary with result
      await this.candidatesService.updateSummaryCompletion(summaryId, result);

      this.logger.log(`Summary ${summaryId} generated successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.candidatesService.updateSummaryError(summaryId, errorMessage);
      throw error;
    }
  }
}
