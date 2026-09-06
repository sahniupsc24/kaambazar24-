import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { Job } from './Job';
import { WorkerProfile } from './WorkerProfile';
import { ApplicationStatus } from './enums';

@Entity('applications')
// A worker should not be able to spam-apply to the same job repeatedly.
@Unique('UQ_application_job_worker', ['jobId', 'workerProfileId'])
export class Application extends AppBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  jobId!: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job!: Job;

  @Index()
  @Column({ type: 'uuid' })
  workerProfileId!: string;

  @ManyToOne(() => WorkerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workerProfileId' })
  workerProfile!: WorkerProfile;

  @Column({ type: 'text', nullable: true })
  coverNote!: string | null;

  @Index()
  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.SUBMITTED })
  status!: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  employerReviewNote!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;
}
