import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCandidateDocumentsAndSummaries1710000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create candidate_documents table
    await queryRunner.createTable(
      new Table({
        name: 'candidate_documents',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '64',
            isPrimary: true,
          },
          {
            name: 'candidate_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'document_type',
            type: 'varchar',
            length: '32',
            isNullable: false,
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'storage_key',
            type: 'varchar',
            length: '512',
            isNullable: false,
          },
          {
            name: 'raw_text',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'uploaded_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );

    // Add foreign key for candidate_documents
    await queryRunner.createForeignKey(
      'candidate_documents',
      new TableForeignKey({
        name: 'fk_candidate_documents_candidate_id',
        columnNames: ['candidate_id'],
        referencedTableName: 'sample_candidates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add indices for candidate_documents
    await queryRunner.createIndex(
      'candidate_documents',
      new TableIndex({
        name: 'idx_candidate_documents_candidate_id',
        columnNames: ['candidate_id'],
      }),
    );

    await queryRunner.createIndex(
      'candidate_documents',
      new TableIndex({
        name: 'idx_candidate_documents_document_type',
        columnNames: ['document_type'],
      }),
    );

    // Create candidate_summaries table
    await queryRunner.createTable(
      new Table({
        name: 'candidate_summaries',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '64',
            isPrimary: true,
          },
          {
            name: 'candidate_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            isNullable: false,
            default: "'pending'",
          },
          {
            name: 'score',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'strengths',
            type: 'text',
            isArray: true,
            default: "'{}' :: text[]",
            isNullable: false,
          },
          {
            name: 'concerns',
            type: 'text',
            isArray: true,
            default: "'{}' :: text[]",
            isNullable: false,
          },
          {
            name: 'summary',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'recommended_decision',
            type: 'varchar',
            length: '32',
            isNullable: true,
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '64',
            default: "'gemini-pro'",
            isNullable: false,
          },
          {
            name: 'prompt_version',
            type: 'integer',
            default: 1,
            isNullable: false,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );

    // Add foreign key for candidate_summaries
    await queryRunner.createForeignKey(
      'candidate_summaries',
      new TableForeignKey({
        name: 'fk_candidate_summaries_candidate_id',
        columnNames: ['candidate_id'],
        referencedTableName: 'sample_candidates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add indices for candidate_summaries
    await queryRunner.createIndex(
      'candidate_summaries',
      new TableIndex({
        name: 'idx_candidate_summaries_candidate_id',
        columnNames: ['candidate_id'],
      }),
    );

    await queryRunner.createIndex(
      'candidate_summaries',
      new TableIndex({
        name: 'idx_candidate_summaries_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'candidate_summaries',
      new TableIndex({
        name: 'idx_candidate_summaries_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Create queue_jobs table
    await queryRunner.createTable(
      new Table({
        name: 'queue_jobs',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '64',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            isNullable: false,
            default: "'pending'",
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'attempts',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'max_attempts',
            type: 'integer',
            default: 3,
            isNullable: false,
          },
          {
            name: 'processed_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'completed_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
    );

    // Add indices for queue_jobs
    await queryRunner.createIndex(
      'queue_jobs',
      new TableIndex({
        name: 'idx_queue_jobs_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'queue_jobs',
      new TableIndex({
        name: 'idx_queue_jobs_name_status',
        columnNames: ['name', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'queue_jobs',
      new TableIndex({
        name: 'idx_queue_jobs_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop queue_jobs indices
    await queryRunner.dropIndex('queue_jobs', 'idx_queue_jobs_created_at');
    await queryRunner.dropIndex('queue_jobs', 'idx_queue_jobs_name_status');
    await queryRunner.dropIndex('queue_jobs', 'idx_queue_jobs_status');

    // Drop candidate_summaries indices
    await queryRunner.dropIndex('candidate_summaries', 'idx_candidate_summaries_created_at');
    await queryRunner.dropIndex('candidate_summaries', 'idx_candidate_summaries_status');
    await queryRunner.dropIndex('candidate_summaries', 'idx_candidate_summaries_candidate_id');

    await queryRunner.dropIndex('candidate_documents', 'idx_candidate_documents_document_type');
    await queryRunner.dropIndex('candidate_documents', 'idx_candidate_documents_candidate_id');

    // Drop foreign keys
    await queryRunner.dropForeignKey(
      'candidate_summaries',
      'fk_candidate_summaries_candidate_id',
    );

    await queryRunner.dropForeignKey(
      'candidate_documents',
      'fk_candidate_documents_candidate_id',
    );

    // Drop tables
    await queryRunner.dropTable('queue_jobs');
    await queryRunner.dropTable('candidate_summaries');
    await queryRunner.dropTable('candidate_documents');
  }
}
