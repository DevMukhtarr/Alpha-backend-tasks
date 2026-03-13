import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedRecruitersAndWorkspaces1710000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed sample_workspaces
    await queryRunner.query(`
      INSERT INTO sample_workspaces (id, name, created_at)
      VALUES
        ('1', 'Workspace 1', NOW()),
        ('2', 'Workspace 2', NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // Seed recruiters
    await queryRunner.query(`
      INSERT INTO recruiters (id, workspace_id, created_at)
      VALUES
        ('1', '1', NOW()),
        ('2', '2', NOW()),
        ('3', '1', NOW()),
        ('4', '2', NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete the seeded recruiters
    await queryRunner.query(`
      DELETE FROM recruiters 
      WHERE (id, workspace_id) IN (('1', '1'), ('2', '2'), ('3', '1'), ('4', '2'));
    `);

    // Delete the seeded workspaces
    await queryRunner.query(`
      DELETE FROM sample_workspaces 
      WHERE id IN ('1', '2');
    `);
  }
}
