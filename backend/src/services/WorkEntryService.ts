import { AppDataSource } from '../config/data-source';
import { WorkEntry } from '../entities/WorkEntry';
import { WorkContract } from '../entities/WorkContract';
import { WorkSummary } from '../entities/WorkSummary';
import { WorkEntryStatus, ContractStatus } from '../entities/enums';
import { OwnershipService } from './OwnershipService';
import { ApiError } from '../utils/ApiError';
import { AuditService } from './AuditService';

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function validateHours(hours: number) {
  if (!(hours > 0)) throw ApiError.badRequest('Hours worked must be greater than 0');
  if (hours > 24) throw ApiError.badRequest('Hours worked cannot exceed 24 for a single work entry');
}

function validateWorkDate(workDate: string) {
  if (workDate > todayISODate()) {
    throw ApiError.badRequest('Work date cannot be in the future');
  }
}

async function recomputeSummary(manager: typeof AppDataSource, contractId: string) {
  const entryRepo = AppDataSource.getRepository(WorkEntry);
  const summaryRepo = AppDataSource.getRepository(WorkSummary);

  const entries = await entryRepo.find({ where: { contractId } });

  const sum = (predicate: (e: WorkEntry) => boolean) =>
    entries.filter(predicate).reduce((acc, e) => acc + parseFloat(e.hoursWorked), 0);

  let summary = await summaryRepo.findOne({ where: { contractId } });
  if (!summary) {
    summary = summaryRepo.create({ contractId });
  }
  summary.totalHoursSubmitted = sum(() => true).toFixed(2);
  summary.totalHoursApproved = sum((e) => e.status === WorkEntryStatus.APPROVED).toFixed(2);
  summary.totalHoursRejected = sum((e) => e.status === WorkEntryStatus.REJECTED).toFixed(2);
  summary.totalHoursSettled = sum((e) => e.isSettled).toFixed(2);
  summary.pendingEntryCount = entries.filter(
    (e) => e.status === WorkEntryStatus.SUBMITTED || e.status === WorkEntryStatus.CORRECTING
  ).length;

  await summaryRepo.save(summary);
}

export class WorkEntryService {
  static async submit(
    userId: string,
    contractId: string,
    input: { 
      workDate: string; 
      hoursWorked: number; 
      workerNotes?: string;
      checkInLat?: number;
      checkInLng?: number;
      checkInAccuracy?: number;
    }
  ) {
    const workerProfile = await OwnershipService.resolveWorkerProfile(userId);
    const contractRepo = AppDataSource.getRepository(WorkContract);
    const contract = await contractRepo.findOne({ where: { id: contractId } });
    if (!contract) throw ApiError.notFound('Contract not found');

    OwnershipService.assertOwns(contract.workerProfileId, workerProfile.id, 'contract');

    // Cross-module rule (spec section 45): only an ACTIVE contract can create work entries.
    if (contract.status !== ContractStatus.ACTIVE) {
      throw ApiError.badRequest('Work entries can only be submitted against an ACTIVE contract');
    }

    validateHours(input.hoursWorked);
    validateWorkDate(input.workDate);

    const entryRepo = AppDataSource.getRepository(WorkEntry);
    const existing = await entryRepo.findOne({ where: { contractId, workDate: input.workDate } });
    if (existing) {
      throw ApiError.conflict('A work entry already exists for this date on this contract');
    }

    const entry = entryRepo.create({
      contractId,
      workDate: input.workDate,
      hoursWorked: input.hoursWorked.toString(),
      workerNotes: input.workerNotes ?? null,
      status: WorkEntryStatus.SUBMITTED,
      checkInLat: input.checkInLat,
      checkInLng: input.checkInLng,
      checkInAccuracy: input.checkInAccuracy
    });
    const saved = await entryRepo.save(entry);
    await recomputeSummary(AppDataSource, contractId);
    return saved;
  }

  // Worker correction of a previously REJECTED (or CORRECTING) entry — re-uses the row.
  static async correct(
    userId: string,
    entryId: string,
    input: { hoursWorked?: number; workerNotes?: string }
  ) {
    const workerProfile = await OwnershipService.resolveWorkerProfile(userId);
    const entryRepo = AppDataSource.getRepository(WorkEntry);
    const contractRepo = AppDataSource.getRepository(WorkContract);

    const entry = await entryRepo.findOne({ where: { id: entryId } });
    if (!entry) throw ApiError.notFound('Work entry not found');

    const contract = await contractRepo.findOne({ where: { id: entry.contractId } });
    if (!contract) throw ApiError.notFound('Contract not found');
    OwnershipService.assertOwns(contract.workerProfileId, workerProfile.id, 'work entry');

    if (entry.status !== WorkEntryStatus.REJECTED && entry.status !== WorkEntryStatus.CORRECTING) {
      throw ApiError.badRequest('Only rejected entries can be corrected');
    }

    if (input.hoursWorked !== undefined) {
      validateHours(input.hoursWorked);
      entry.hoursWorked = input.hoursWorked.toString();
    }
    if (input.workerNotes !== undefined) entry.workerNotes = input.workerNotes;

    entry.status = WorkEntryStatus.SUBMITTED; // CORRECTING -> SUBMITTED per spec workflow
    entry.reviewedAt = null;
    entry.reviewedByUserId = null;

    const saved = await entryRepo.save(entry);
    await recomputeSummary(AppDataSource, entry.contractId);
    return saved;
  }

  static async getMyEntriesForContract(userId: string, contractId: string) {
    const workerProfile = await OwnershipService.resolveWorkerProfile(userId);
    const contractRepo = AppDataSource.getRepository(WorkContract);
    const contract = await contractRepo.findOne({ where: { id: contractId } });
    if (!contract) throw ApiError.notFound('Contract not found');
    OwnershipService.assertOwns(contract.workerProfileId, workerProfile.id, 'contract');

    const entryRepo = AppDataSource.getRepository(WorkEntry);
    // Worker view NEVER includes employerInternalNote.
    const entries = await entryRepo.find({ where: { contractId }, order: { workDate: 'DESC' } });
    return entries.map(({ employerInternalNote, ...rest }) => rest);
  }

  static async getEntriesForContractAsEmployer(userId: string, contractId: string) {
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
    const contractRepo = AppDataSource.getRepository(WorkContract);
    const contract = await contractRepo.findOne({ where: { id: contractId } });
    if (!contract) throw ApiError.notFound('Contract not found');
    OwnershipService.assertOwns(contract.employerProfileId, employerProfile.id, 'contract');

    const entryRepo = AppDataSource.getRepository(WorkEntry);
    return entryRepo.find({ where: { contractId }, order: { workDate: 'DESC' } });
  }

  static async approve(userId: string, entryId: string, employerInternalNote?: string) {
    return WorkEntryService.review(userId, entryId, WorkEntryStatus.APPROVED, employerInternalNote);
  }

  static async reject(userId: string, entryId: string, employerInternalNote?: string) {
    return WorkEntryService.review(userId, entryId, WorkEntryStatus.REJECTED, employerInternalNote);
  }

  private static async review(
    userId: string,
    entryId: string,
    newStatus: WorkEntryStatus.APPROVED | WorkEntryStatus.REJECTED,
    employerInternalNote?: string
  ) {
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
    const entryRepo = AppDataSource.getRepository(WorkEntry);
    const contractRepo = AppDataSource.getRepository(WorkContract);

    const entry = await entryRepo.findOne({ where: { id: entryId } });
    if (!entry) throw ApiError.notFound('Work entry not found');

    const contract = await contractRepo.findOne({ where: { id: entry.contractId } });
    if (!contract) throw ApiError.notFound('Contract not found');
    OwnershipService.assertOwns(contract.employerProfileId, employerProfile.id, 'work entry');

    if (entry.status !== WorkEntryStatus.SUBMITTED) {
      throw ApiError.badRequest(`Only SUBMITTED entries can be reviewed (current status: ${entry.status})`);
    }

    entry.status = newStatus;
    entry.reviewedAt = new Date();
    entry.reviewedByUserId = userId;
    if (employerInternalNote !== undefined) entry.employerInternalNote = employerInternalNote;

    const saved = await entryRepo.save(entry);
    await recomputeSummary(AppDataSource, entry.contractId);

    await AuditService.log({
      actorUserId: userId, actorRole: 'EMPLOYER',
      action: newStatus === WorkEntryStatus.APPROVED ? 'WORK_ENTRY_APPROVED' : 'WORK_ENTRY_REJECTED',
      entityType: 'WorkEntry', entityId: entry.id,
    });

    return saved;
  }
}
