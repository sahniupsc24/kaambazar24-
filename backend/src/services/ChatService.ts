import { AppDataSource } from '../config/data-source';
import { Message } from '../entities';
import { Hiring } from '../entities';

export class ChatService {
  private messageRepo = AppDataSource.getRepository(Message);
  private hiringRepo = AppDataSource.getRepository(Hiring);

  async getMessagesByContract(contractId: string, userId: string) {
    // Ensure user is part of this contract
    const contract = await this.hiringRepo.findOne({
      where: { id: contractId },
      relations: ['workerProfile', 'workerProfile.user', 'job', 'job.employerProfile', 'job.employerProfile.user'],
    });

    if (!contract) throw new Error('Contract not found');

    const isWorker = contract.workerProfile.user.id === userId;
    const isEmployer = contract.job.employerProfile.user.id === userId;

    if (!isWorker && !isEmployer) {
      throw new Error('Not authorized to view these messages');
    }

    return this.messageRepo.find({
      where: { contractId },
      order: { createdAt: 'ASC' },
      relations: ['sender'],
    });
  }

  async sendMessage(contractId: string, senderId: string, content: string) {
    const contract = await this.hiringRepo.findOne({
      where: { id: contractId },
      relations: ['workerProfile', 'workerProfile.user', 'job', 'job.employerProfile', 'job.employerProfile.user'],
    });

    if (!contract) throw new Error('Contract not found');

    const workerUserId = contract.workerProfile.user.id;
    const employerUserId = contract.job.employerProfile.user.id;

    let receiverId = '';
    if (senderId === workerUserId) {
      receiverId = employerUserId;
    } else if (senderId === employerUserId) {
      receiverId = workerUserId;
    } else {
      throw new Error('Not authorized to send messages for this contract');
    }

    const message = this.messageRepo.create({
      contractId,
      senderId,
      receiverId,
      content,
    });

    await this.messageRepo.save(message);

    return message;
  }

  async markAsRead(contractId: string, receiverId: string) {
    await this.messageRepo.update(
      { contractId, receiverId, isRead: false },
      { isRead: true }
    );
  }
}
