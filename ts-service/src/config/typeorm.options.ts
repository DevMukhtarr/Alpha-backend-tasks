import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { QueueJob } from '../entities/queue-job.entity';
import { Recruiter } from '../entities/recruiter.entity';
import { InitialStarterEntities1710000000000 } from '../migrations/1710000000000-InitialStarterEntities';
import { CreateCandidateDocumentsAndSummaries1710000001000 } from '../migrations/1710000001000-CreateCandidateDocumentsAndSummaries';
import { CreateRecruitersTable1710000002000 } from '../migrations/1710000002000-CreateRecruitersTable';
import { SeedRecruitersAndWorkspaces1710000003000 } from '../migrations/1710000003000-SeedRecruitersAndWorkspaces';

export const defaultDatabaseUrl =
  'postgres://assessment_user:assessment_pass@localhost:5432/assessment_db';

export const getTypeOrmOptions = (
  databaseUrl: string,
): TypeOrmModuleOptions & DataSourceOptions => ({
  type: 'postgres',
  url: databaseUrl,
  entities: [SampleWorkspace, SampleCandidate, CandidateDocument, CandidateSummary, QueueJob, Recruiter],
  migrations: [InitialStarterEntities1710000000000, CreateCandidateDocumentsAndSummaries1710000001000, CreateRecruitersTable1710000002000, SeedRecruitersAndWorkspaces1710000003000],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: false,
});
