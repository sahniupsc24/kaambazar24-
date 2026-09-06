import { AppDataSource } from '../config/data-source';
import { Payment } from '../entities/Payment';
import { PaymentWorkEntry } from '../entities/PaymentWorkEntry';
import { WorkEntry } from '../entities/WorkEntry';
import { WorkContract } from '../entities/WorkContract';
import { PaymentStatus, WorkEntryStatus, CompensationType } from '../entities/enums';
import { OwnershipService } from './OwnershipService';
import { ApiError } from '../utils/ApiError';
import { AuditService } from './AuditService';
import { QueryFailedError } from 'typeorm';

export interface CreatePaymentInput {
  contractId: string;
  workEntryIds: string[]; // required for HOURLY (drives amount calc); optional context for manual amount types
  manualAmount?: string; // required for DAILY/WEEKLY/MONTHLY per spec section 17
}

export class PaymentService {
  static async create(userId: string, input: CreatePaymentInput) {
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);

    return AppDataSource.transaction(async (manager) => {
      const contractRepo = manager.getRepository(WorkContract);
      const entryRepo = manager.getRepository(WorkEntry);
      const paymentRepo = manager.getRepository(Payment);
      const pweRepo = manager.getRepository(PaymentWorkEntry);

      const contract = await contractRepo.findOne({ where: { id: input.contractId } });
      if (!contract) throw ApiError.notFound('Contract not found');
      OwnershipService.assertOwns(contract.employerProfileId, employerProfile.id, 'contract');

      if (!input.workEntryIds || input.workEntryIds.length === 0) {
        throw ApiError.badRequest('At least one work entry must be selected for payment');
      }

      // Lock the candidate rows so two concurrent payment requests can't
      // both pass the "is unsettled" check for the same entry.
      const entries = await entryRepo
        .createQueryBuilder('entry')
        .setLock('pessimistic_write')
        .where('entry.id IN (:...ids)', { ids: input.workEntryIds })
        .andWhere('entry.contractId = :contractId', { contractId: contract.id })
        .getMany();

      if (entries.length !== input.workEntryIds.length) {
        throw ApiError.badRequest('One or more work entries were not found on this contract');
      }

      // Application-level guard: only APPROVED and not-yet-settled entries
      // are payable (spec section 45: "Work -> Payment: Only APPROVED and
      // unsettled work can become payable").
      for (const e of entries) {
        if (e.status !== WorkEntryStatus.APPROVED) {
          throw ApiError.badRequest(`Work entry ${e.id} is not APPROVED and cannot be settled`);
        }
        if (e.isSettled) {
          throw ApiError.conflict(`Work entry ${e.id} has already been settled`);
        }
      }

      // Amount calculation (spec section 17).
      let amount: number;
      if (contract.compensationType === CompensationType.HOURLY) {
        const rate = parseFloat(contract.agreementRate);
        const totalHours = entries.reduce((acc, e) => acc + parseFloat(e.hoursWorked), 0);
        amount = totalHours * rate;
      } else {
        if (!input.manualAmount) {
          throw ApiError.badRequest(
            'manualAmount is required for DAILY/WEEKLY/MONTHLY compensation types'
          );
        }
        amount = parseFloat(input.manualAmount);
      }
      if (!(amount > 0)) throw ApiError.badRequest('Calculated payment amount must be greater than 0');

      const payment = paymentRepo.create({
        contractId: contract.id,
        amount: amount.toFixed(2),
        status: PaymentStatus.PENDING,
        createdByUserId: userId,
      });
      const savedPayment = await paymentRepo.save(payment);

      // The unique constraint on payment_work_entries.workEntryId is the
      // authoritative double-payment guard — if a race slipped past the
      // row lock above, this insert fails and the whole transaction rolls
      // back (caught below and surfaced as a 409, not a 500).
      try {
        for (const e of entries) {
          const shareAmount =
            contract.compensationType === CompensationType.HOURLY
              ? (parseFloat(e.hoursWorked) * parseFloat(contract.agreementRate)).toFixed(2)
              : (amount / entries.length).toFixed(2);

          await pweRepo.save(
            pweRepo.create({
              paymentId: savedPayment.id,
              workEntryId: e.id,
              amountForEntry: shareAmount,
            })
          );
          e.isSettled = true;
          await entryRepo.save(e);
        }
      } catch (err) {
        if (err instanceof QueryFailedError) {
          throw ApiError.conflict('One or more work entries were already settled by another payment');
        }
        throw err;
      }

      await AuditService.log({
        actorUserId: userId, actorRole: 'EMPLOYER', action: 'PAYMENT_CREATED',
        entityType: 'Payment', entityId: savedPayment.id,
        metadata: { contractId: contract.id, amount: savedPayment.amount },
      });

      return savedPayment;
    });
  }

  static async process(userId: string, paymentId: string, outcome: 'PAID' | 'FAILED', failureReason?: string) {
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
    const paymentRepo = AppDataSource.getRepository(Payment);
    const contractRepo = AppDataSource.getRepository(WorkContract);

    const payment = await paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw ApiError.notFound('Payment not found');

    const contract = await contractRepo.findOne({ where: { id: payment.contractId } });
    if (!contract) throw ApiError.notFound('Contract not found');
    OwnershipService.assertOwns(contract.employerProfileId, employerProfile.id, 'payment');

    if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.PROCESSING) {
      throw ApiError.badRequest(`Cannot process a payment in status ${payment.status}`);
    }

    if (outcome === 'PAID') {
      payment.status = PaymentStatus.PAID;
      payment.processedAt = new Date();
      payment.failureReason = null;
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = failureReason ?? 'Processing failed';
    }
    const saved = await paymentRepo.save(payment);

    await AuditService.log({
      actorUserId: userId, actorRole: 'EMPLOYER',
      action: outcome === 'PAID' ? 'PAYMENT_PAID' : 'PAYMENT_FAILED',
      entityType: 'Payment', entityId: payment.id,
    });

    return saved;
  }

  /**
   * Retrying a failed payment reuses the existing record (per spec) rather
   * than creating a new one — flips FAILED back to PROCESSING so the same
   * settlement links (and their unique constraint) stay intact.
   */
  static async retry(userId: string, paymentId: string) {
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
    const paymentRepo = AppDataSource.getRepository(Payment);
    const contractRepo = AppDataSource.getRepository(WorkContract);

    const payment = await paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw ApiError.notFound('Payment not found');
    const contract = await contractRepo.findOne({ where: { id: payment.contractId } });
    if (!contract) throw ApiError.notFound('Contract not found');
    OwnershipService.assertOwns(contract.employerProfileId, employerProfile.id, 'payment');

    if (payment.status !== PaymentStatus.FAILED) {
      throw ApiError.badRequest('Only a FAILED payment can be retried');
    }
    payment.status = PaymentStatus.PROCESSING;
    payment.failureReason = null;
    return paymentRepo.save(payment);
  }

  static async getMyPaymentsAsWorker(userId: string) {
    const workerProfile = await OwnershipService.resolveWorkerProfile(userId);
    const repo = AppDataSource.getRepository(Payment);
    return repo
      .createQueryBuilder('payment')
      .innerJoin('payment.contract', 'contract')
      .where('contract.workerProfileId = :wpId', { wpId: workerProfile.id })
      .orderBy('payment.createdAt', 'DESC')
      .getMany();
  }

  static async getMyPaymentsAsEmployer(userId: string) {
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
    const repo = AppDataSource.getRepository(Payment);
    return repo
      .createQueryBuilder('payment')
      .innerJoin('payment.contract', 'contract')
      .where('contract.employerProfileId = :epId', { epId: employerProfile.id })
      .orderBy('payment.createdAt', 'DESC')
      .getMany();
  }
}
