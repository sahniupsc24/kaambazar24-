import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../entities/enums';
import { AppDataSource } from '../config/data-source';
import { User, AuditLog, Payment } from '../entities';

const router = Router();

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      // Escape quotes
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// GET /api/export/users
router.get('/users', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), async (req, res) => {
  try {
    const users = await AppDataSource.getRepository(User).find({
      order: { createdAt: 'DESC' }
    });

    const csvData = users.map(u => ({
      ID: u.id,
      Email: u.email,
      Role: u.role,
      IsActive: u.isActive,
      JoinedAt: u.createdAt.toISOString()
    }));

    const csvString = convertToCSV(csvData);
    res.header('Content-Type', 'text/csv');
    res.attachment('users_export.csv');
    res.send(csvString);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[export error]', err);
    res.status(500).json({ success: false, message: 'Export failed.' });
  }
});

// GET /api/export/audit-logs
router.get('/audit-logs', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), async (req, res) => {
  try {
    const logs = await AppDataSource.getRepository(AuditLog).find({
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });

    const csvData = logs.map(l => ({
      LogID: l.id,
      Action: l.action,
      UserEmail: l.user ? l.user.email : 'System',
      IPAddress: l.ipAddress,
      CreatedAt: l.createdAt.toISOString()
    }));

    const csvString = convertToCSV(csvData);
    res.header('Content-Type', 'text/csv');
    res.attachment('audit_logs_export.csv');
    res.send(csvString);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[export error]', err);
    res.status(500).json({ success: false, message: 'Export failed.' });
  }
});

// GET /api/export/payments
router.get('/payments', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), async (req, res) => {
  try {
    const payments = await AppDataSource.getRepository(Payment).find({
      relations: ['payer', 'payee'],
      order: { createdAt: 'DESC' }
    });

    const csvData = payments.map(p => ({
      PaymentID: p.id,
      Amount: p.amount,
      Currency: p.currency,
      Status: p.status,
      PayerEmail: p.payer ? p.payer.email : '',
      PayeeEmail: p.payee ? p.payee.email : '',
      Reference: p.transactionReference,
      CreatedAt: p.createdAt.toISOString()
    }));

    const csvString = convertToCSV(csvData);
    res.header('Content-Type', 'text/csv');
    res.attachment('payments_export.csv');
    res.send(csvString);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[export error]', err);
    res.status(500).json({ success: false, message: 'Export failed.' });
  }
});

export default router;
