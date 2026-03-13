import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QueueJob } from '../entities/queue-job.entity';
import { QueueService } from './queue.service';
import { QueueWorker } from './queue.worker';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [TypeOrmModule.forFeature([QueueJob]), LlmModule],
  providers: [QueueService, QueueWorker],
  exports: [QueueService, QueueWorker],
})
export class QueueModule {}
