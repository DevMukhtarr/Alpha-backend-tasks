import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class CreateRecruitersTable1710000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'recruiters',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '64',
            isPrimary: true,
          },
          {
            name: 'workspace_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );

    // Add foreign key to workspace
    await queryRunner.createForeignKey(
      'recruiters',
      new TableForeignKey({
        name: 'fk_recruiters_workspace_id',
        columnNames: ['workspace_id'],
        referencedTableName: 'sample_workspaces',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add index on workspace_id for faster lookups
    await queryRunner.createIndex(
      'recruiters',
      new TableIndex({
        name: 'idx_recruiters_workspace_id',
        columnNames: ['workspace_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('recruiters', 'idx_recruiters_workspace_id');
    await queryRunner.dropForeignKey('recruiters', 'fk_recruiters_workspace_id');
    await queryRunner.dropTable('recruiters');
  }
}

