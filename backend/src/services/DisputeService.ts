import { AppDataSource } from '../config/data-source';
import { Dispute, DisputeStatus } from '../entities/Dispute';
import { Hiring } from '../entities/Hiring';

export class DisputeService {
  private disputeRepo = AppDataSource.getRepository(Dispute);
  private hiringRepo = AppDataSource.getRepository(Hiring);

  async createDispute(contractId: string, raisedByUserId: string, reason: string, workEntryId?: string) {
    const contract = await this.hiringRepo.findOne({
      where: { id: contractId },
      relations: ['workerProfile', 'workerProfile.user', 'job', 'job.employerProfile', 'job.employerProfile.user'],
    });

    if (!contract) throw new Error('Contract not found');

    const workerUserId = contract.workerProfile.user.id;
    const employerUserId = contract.job.employerProfile.user.id;

    let againstUserId = '';
    if (raisedByUserId === workerUserId) {
      againstUserId = employerUserId;
    } else if (raisedByUserId === employerUserId) {
      againstUserId = workerUserId;
    } else {
      throw new Error('Not authorized to raise dispute for this contract');
    }

    const dispute = this.disputeRepo.create({
      contractId,
      workEntryId: workEntryId || null,
      raisedByUserId,
      againstUserId,
      reason,
      status: DisputeStatus.OPEN,
    });

    await this.disputeRepo.save(dispute);
    return dispute;
  }

  async getMyDisputes(userId: string) {
    return this.disputeRepo.find({
      where: [
        { raisedByUserId: userId },
        { againstUserId: userId }
      ],
      relations: ['contract', 'contract.job', 'workEntry'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllDisputes() {
    return this.disputeRepo.find({
      relations: ['contract', 'contract.job', 'raisedByUser', 'againstUser', 'workEntry'],
      order: { createdAt: 'DESC' },
    });
  }

  async resolveDispute(disputeId: string, adminUserId: string, resolutionStatus: DisputeStatus, notes: string) {
    const dispute = await this.disputeRepo.findOne({ where: { id: disputeId } });
    if (!dispute) throw new Error('Dispute not found');

    dispute.status = resolutionStatus;
    dispute.resolutionNotes = notes;
    dispute.resolvedByAdminId = adminUserId;

    await this.disputeRepo.save(dispute);
    return dispute;
  }
}
