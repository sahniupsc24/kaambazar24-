import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { JobService } from '../services/JobService';

export const JobController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const job = await JobService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: job });
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const job = await JobService.update(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: job });
  }),
  close: asyncHandler(async (req: Request, res: Response) => {
    const job = await JobService.close(req.user!.id, req.params.id);
    res.json({ success: true, data: job });
  }),
  getMine: asyncHandler(async (req: Request, res: Response) => {
    const jobs = await JobService.getMyJobs(req.user!.id);
    res.json({ success: true, data: jobs });
  }),
  getPublicById: asyncHandler(async (req: Request, res: Response) => {
    const job = await JobService.getPublicById(req.params.id);
    res.json({ success: true, data: job });
  }),
  search: asyncHandler(async (req: Request, res: Response) => {
    const { categoryId, locationId, workType, q, page, pageSize } = req.query;
    const result = await JobService.search({
      categoryId: categoryId as string | undefined,
      locationId: locationId as string | undefined,
      workType: workType as string | undefined,
      q: q as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });
    res.json({ success: true, data: result });
  }),
};
