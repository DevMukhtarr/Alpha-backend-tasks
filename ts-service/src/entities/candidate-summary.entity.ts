import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SampleCandidate } from './sample-candidate.entity';

export enum SummaryStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum RecommendedDecisionEnum {
  ADVANCE = 'advance',
  HOLD = 'hold',
  REJECT = 'reject',
}

@Entity({ name: 'candidate_summaries' })
export class CandidateSummary {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'candidate_id', type: 'varchar', length: 64 })
  candidateId!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: SummaryStatus;

  @Column({ type: 'integer', nullable: true })
  score!: number | null;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  strengths!: string[];

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  concerns!: string[];

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({ name: 'recommended_decision', type: 'varchar', length: 32, nullable: true })
  recommendedDecision!: RecommendedDecisionEnum | null;

  @Column({ type: 'varchar', length: 64, default: 'gemini-pro' })
  provider!: string;

  @Column({ name: 'prompt_version', type: 'integer', default: 1 })
  promptVersion!: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => SampleCandidate, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: SampleCandidate;
}
