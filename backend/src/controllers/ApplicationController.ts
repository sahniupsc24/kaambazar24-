import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApplicationService } from '../services/ApplicationService';

export const ApplicationController = {
  apply: asyncHandler(async (req: Request, res: Response) => {
    const { jobId, coverNote, aadhaarNumber } = req.body;
    const application = await ApplicationService.apply(req.user!.id, jobId, coverNote, aadhaarNumber);
    res.status(201).json({ success: true, data: application });
  }),
  withdraw: asyncHandler(async (req: Request, res: Response) => {
    const application = await ApplicationService.withdraw(req.user!.id, req.params.id);
    res.json({ success: true, data: application });
  }),
  getMine: asyncHandler(async (req: Request, res: Response) => {
    const applications = await ApplicationService.getMyApplications(req.user!.id);
    res.json({ success: true, data: applications });
  }),
  getForJob: asyncHandler(async (req: Request, res: Response) => {
    const applications = await ApplicationService.getApplicationsForJob(req.user!.id, req.params.jobId);
    res.json({ success: true, data: applications });
  }),
  accept: asyncHandler(async (req: Request, res: Response) => {
    const result = await ApplicationService.accept(req.user!.id, req.params.id, req.body?.reviewNote);
    res.json({ success: true, data: result });
  }),
  reject: asyncHandler(async (req: Request, res: Response) => {
    const application = await ApplicationService.reject(req.user!.id, req.params.id, req.body?.reviewNote);
    res.json({ success: true, data: application });
  }),
};
