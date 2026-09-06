import { AppDataSource } from '../config/data-source';
import { WorkContract } from '../entities/WorkContract';
import { ContractStatus } from '../entities/enums';
import { OwnershipService } from './OwnershipService';
import { ApiError } from '../utils/ApiError';
import { AuditService } from './AuditService';

async function loadOwnedContract(
  contractId: string,
  userId: string,
  role: 'WORKER' | 'EMPLOYER'
): Promise<WorkContract> {
  const repo = AppDataSource.getRepository(WorkContract);
  const contract = await repo.findOne({ where: { id: contractId } });
  if (!contract) throw ApiError.notFound('Contract not found');

  if (role === 'WORKER') {
    const workerProfile = await OwnershipService.resolveWorkerProfile(userId);
    OwnershipService.assertOwns(contract.workerProfileId, workerProfile.id, 'contract');
  } else {
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
    OwnershipService.assertOwns(contract.employerProfileId, employerProfile.id, 'contract');
  }
  return contract;
}

export class WorkContractService {
  static async getMyContracts(userId: string, role: 'WORKER' | 'EMPLOYER') {
    const repo = AppDataSource.getRepository(WorkContract);
    if (role === 'WORKER') {
      const workerProfile = await OwnershipService.resolveWorkerProfile(userId);
      return repo.find({ where: { workerProfileId: workerProfile.id }, order: { createdAt: 'DESC' } });
    }
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
    return repo.find({ where: { employerProfileId: employerProfile.id }, order: { createdAt: 'DESC' } });
  }

  static async getById(contractId: string, userId: string, role: 'WORKER' | 'EMPLOYER') {
    return loadOwnedContract(contractId, userId, role);
  }

  // Employer edits terms while still DRAFT.
  static async updateDraft(
    userId: string,
    contractId: string,
    updates: { agreementRate?: string; startDate?: string; endDate?: string }
  ) {
    const contract = await loadOwnedContract(contractId, userId, 'EMPLOYER');
    if (contract.status !== ContractStatus.DRAFT) {
      throw ApiError.badRequest('Only DRAFT contracts can be edited');
    }
    Object.assign(contract, updates);
    const repo = AppDataSource.getRepository(WorkContract);
    return repo.save(contract);
  }

  // DRAFT -> SENT (employer only)
  static async send(userId: string, contractId: string) {
    const contract = await loadOwnedContract(contractId, userId, 'EMPLOYER');
    if (contract.status !== ContractStatus.DRAFT) {
      throw ApiError.badRequest(`Cannot send a contract in status ${contract.status}`);
    }
    contract.status = ContractStatus.SENT;
    contract.sentAt = new Date();
    const repo = AppDataSource.getRepository(WorkContract);
    const saved = await repo.save(contract);
    await AuditService.log({
      actorUserId: userId, actorRole: 'EMPLOYER', action: 'CONTRACT_SENT',
      entityType: 'WorkContract', entityId: contract.id,
    });
    return saved;
  }

  // SENT -> ACCEPTED (worker only)
  static async workerAccept(userId: string, contractId: string) {
    const contract = await loadOwnedContract(contractId, userId, 'WORKER');
    if (contract.status !== ContractStatus.SENT) {
      throw ApiError.badRequest(`Cannot accept a contract in status ${contract.status}`);
    }
    contract.status = ContractStatus.ACCEPTED;
    contract.workerAcceptedAt = new Date();
    const repo = AppDataSource.getRepository(WorkContract);
    const saved = await repo.save(contract);
    await AuditService.log({
      actorUserId: userId, actorRole: 'WORKER', action: 'CONTRACT_ACCEPTED_BY_WORKER',
      entityType: 'WorkContract', entityId: contract.id,
    });
    return saved;
  }

  // ACCEPTED -> ACTIVE (employer confirms, per spec section 13)
  static async employerConfirm(userId: string, contractId: string) {
    const contract = await loadOwnedContract(contractId, userId, 'EMPLOYER');
    if (contract.status !== ContractStatus.ACCEPTED) {
      throw ApiError.badRequest(`Cannot activate a contract in status ${contract.status}`);
    }
    contract.status = ContractStatus.ACTIVE;
    contract.activatedAt = new Date();
    const repo = AppDataSource.getRepository(WorkContract);
    const saved = await repo.save(contract);
    await AuditService.log({
      actorUserId: userId, actorRole: 'EMPLOYER', action: 'CONTRACT_ACTIVATED',
      entityType: 'WorkContract', entityId: contract.id,
    });
    return saved;
  }

  // ACTIVE -> COMPLETED (employer only, normal end of engagement)
  static async complete(userId: string, contractId: string) {
    const contract = await loadOwnedContract(contractId, userId, 'EMPLOYER');
    if (contract.status !== ContractStatus.ACTIVE) {
      throw ApiError.badRequest(`Only an ACTIVE contract can be completed`);
    }
    contract.status = ContractStatus.COMPLETED;
    contract.completedAt = new Date();
    const repo = AppDataSource.getRepository(WorkContract);
    const saved = await repo.save(contract);
    await AuditService.log({
      actorUserId: userId, actorRole: 'EMPLOYER', action: 'CONTRACT_COMPLETED',
      entityType: 'WorkContract', entityId: contract.id,
    });
    return saved;
  }

  // ACTIVE (or earlier non-terminal states) -> TERMINATED. Either party or admin.
  static async terminate(userId: string, role: 'WORKER' | 'EMPLOYER', contractId: string, reason: string) {
    const contract = await loadOwnedContract(contractId, userId, role);
    if (contract.status === ContractStatus.COMPLETED || contract.status === ContractStatus.TERMINATED) {
      throw ApiError.badRequest(`Cannot terminate a contract in status ${contract.status}`);
    }
    contract.status = ContractStatus.TERMINATED;
    contract.terminatedAt = new Date();
    contract.terminationReason = reason;
    const repo = AppDataSource.getRepository(WorkContract);
    const saved = await repo.save(contract);
    await AuditService.log({
      actorUserId: userId, actorRole: role, action: 'CONTRACT_TERMINATED',
      entityType: 'WorkContract', entityId: contract.id, metadata: { reason },
    });
    return saved;
  }
}
