import { Injectable, Logger, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';

import { QueueWorker } from './queue/queue.worker';

@Injectable()
export class AppService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly queueWorker: QueueWorker) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Application initialized');
    // Start the queue worker
    try {
      await this.queueWorker.startWorker();
    } catch (error) {
      this.logger.error(`Failed to start queue worker: ${error}`);
    }
  }

  onApplicationShutdown(): void {
    this.logger.log('Application shutting down, stopping queue worker');
    this.queueWorker.stopWorker();
  }

  getHealth(): string {
    return 'OK';
  }
}
