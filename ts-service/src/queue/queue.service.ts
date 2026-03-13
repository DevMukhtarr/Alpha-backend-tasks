import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { QueueJob, QueueJobStatus } from '../entities/queue-job.entity';

export interface EnqueuedJob<TPayload = unknown> {
  id: string;
  name: string;
  payload: TPayload;
  enqueuedAt: string;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueJob)
    private readonly jobRepository: Repository<QueueJob>,
  ) {}

  async enqueue<TPayload>(name: string, payload: TPayload): Promise<EnqueuedJob<TPayload>> {
    const jobId = randomUUID();
    const now = new Date();

    const job = this.jobRepository.create({
      id: jobId,
      name,
      payload: payload as any,
      status: QueueJobStatus.PENDING,
      errorMessage: null,
      attempts: 0,
      maxAttempts: 3,
      processedBy: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });

    await this.jobRepository.save(job);

    return {
      id: jobId,
      name,
      payload,
      enqueuedAt: now.toISOString(),
    };
  }

  async getQueuedJobs(jobName?: string, limit = 100): Promise<QueueJob[]> {
    const query = this.jobRepository
      .createQueryBuilder('job')
      .where('job.status = :status', { status: QueueJobStatus.PENDING });

    if (jobName) {
      query.andWhere('job.name = :name', { name: jobName });
    }

    return query
      .orderBy('job.created_at', 'ASC')
      .take(limit)
      .getMany();
  }

  async getPendingJob(jobName: string): Promise<QueueJob | null> {
    return this.jobRepository.findOne({
      where: {
        name: jobName,
        status: QueueJobStatus.PENDING,
      },
      order: { createdAt: 'ASC' },
    });
  }

  async updateJobStatus(
    jobId: string,
    status: QueueJobStatus,
    errorMessage?: string,
  ): Promise<void> {
    const updates: any = {
      status,
      updatedAt: new Date(),
    };

    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }

    if (status === QueueJobStatus.COMPLETED || status === QueueJobStatus.FAILED) {
      updates.completedAt = new Date();
    }

    await this.jobRepository.update({ id: jobId }, updates);
  }

  async incrementJobAttempts(jobId: string): Promise<void> {
    await this.jobRepository.increment({ id: jobId }, 'attempts', 1);
  }

  async removeJob(jobId: string): Promise<boolean> {
    const result = await this.jobRepository.delete({ id: jobId });
    return result.affected ? result.affected > 0 : false;
  }

  async getJobById(jobId: string): Promise<QueueJob | null> {
    return this.jobRepository.findOne({
      where: { id: jobId },
    });
  }

  async getCompletedJobs(limit = 100): Promise<QueueJob[]> {
    return this.jobRepository.find({
      where: { status: QueueJobStatus.COMPLETED },
      order: { completedAt: 'DESC' },
      take: limit,
    });
  }

  async getFailedJobs(limit = 100): Promise<QueueJob[]> {
    return this.jobRepository.find({
      where: { status: QueueJobStatus.FAILED },
      order: { completedAt: 'DESC' },
      take: limit,
    });
  }

  async getJobStats(): Promise<{ pending: number; processing: number; completed: number; failed: number }> {
    const [pending, processing, completed, failed] = await Promise.all([
      this.jobRepository.count({ where: { status: QueueJobStatus.PENDING } }),
      this.jobRepository.count({ where: { status: QueueJobStatus.PROCESSING } }),
      this.jobRepository.count({ where: { status: QueueJobStatus.COMPLETED } }),
      this.jobRepository.count({ where: { status: QueueJobStatus.FAILED } }),
    ]);

    return { pending, processing, completed, failed };
  }
}
