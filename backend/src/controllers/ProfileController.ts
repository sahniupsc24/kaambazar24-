import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { WorkerProfileService } from '../services/WorkerProfileService';
import { EmployerProfileService } from '../services/EmployerProfileService';

export const WorkerProfileController = {
  getMine: asyncHandler(async (req: Request, res: Response) => {
    const profile = await WorkerProfileService.getMyProfile(req.user!.id);
    res.json({ success: true, data: profile });
  }),
  updateMine: asyncHandler(async (req: Request, res: Response) => {
    const profile = await WorkerProfileService.updateMyProfile(req.user!.id, req.body);
    res.json({ success: true, data: profile });
  }),
  submitAadhaar: asyncHandler(async (req: Request, res: Response) => {
    const profile = await WorkerProfileService.submitAadhaar(req.user!.id, req.body);
    res.json({ success: true, data: profile });
  }),
  // Buyer-facing directory search — the worker's phone is never included
  // here; the frontend calls POST /api/contacts/unlock separately to
  // reveal it once the viewer has a free unlock/credit/subscription.
  search: asyncHandler(async (req: Request, res: Response) => {
    const { categoryId, locationId, q, page, pageSize } = req.query;
    const result = await WorkerProfileService.search({
      categoryId: categoryId as string | undefined,
      locationId: locationId as string | undefined,
      q: q as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });
    res.json({ success: true, data: result });
  }),
};

export const EmployerProfileController = {
  getMine: asyncHandler(async (req: Request, res: Response) => {
    const profile = await EmployerProfileService.getMyProfile(req.user!.id);
    res.json({ success: true, data: profile });
  }),
  updateMine: asyncHandler(async (req: Request, res: Response) => {
    const profile = await EmployerProfileService.updateMyProfile(req.user!.id, req.body);
    res.json({ success: true, data: profile });
  }),
  getPublic: asyncHandler(async (req: Request, res: Response) => {
    const profile = await EmployerProfileService.getPublicById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Employer not found' });
    res.json({ success: true, data: profile });
  }),
};
