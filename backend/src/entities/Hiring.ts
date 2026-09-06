import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { Application } from './Application';
import { Job } from './Job';
import { WorkerProfile } from './WorkerProfile';
import { EmployerProfile } from './EmployerProfile';
import { HiringStatus } from './enums';

@Entity('hirings')
export class Hiring extends AppBaseEntity {
  // 1:1 with the accepted application that spawned this hiring record.
  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true })
  applicationId!: string;

  @ManyToOne(() => Application, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'applicationId' })
  application!: Application;

  @Index()
  @Column({ type: 'uuid' })
  jobId!: string;

  @ManyToOne(() => Job, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'jobId' })
  job!: Job;

  // Explicitly WorkerProfile ID, not User ID — see rule 46 in the spec.
  @Index()
  @Column({ type: 'uuid' })
  workerProfileId!: string;

  @ManyToOne(() => WorkerProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workerProfileId' })
  workerProfile!: WorkerProfile;

  // Explicitly EmployerProfile ID, not User ID.
  @Index()
  @Column({ type: 'uuid' })
  employerProfileId!: string;

  @ManyToOne(() => EmployerProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employerProfileId' })
  employerProfile!: EmployerProfile;

  @Column({ type: 'enum', enum: HiringStatus, default: HiringStatus.CREATED })
  status!: HiringStatus;
}
