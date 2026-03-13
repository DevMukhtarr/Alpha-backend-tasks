import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { SampleWorkspace } from './sample-workspace.entity';

@Entity({ name: 'recruiters' })
export class Recruiter {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'workspace_id', type: 'varchar', length: 64 })
  workspaceId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => SampleWorkspace, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: SampleWorkspace;
}

