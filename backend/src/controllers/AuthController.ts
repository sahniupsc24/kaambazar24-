import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '../entities/enums';
import { ApiError } from '../utils/ApiError';

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { email, password, phone, role, fullNameOrBusinessName } = req.body;

    if (role !== UserRole.WORKER && role !== UserRole.EMPLOYER) {
      throw ApiError.badRequest('role must be WORKER or EMPLOYER for self-registration');
    }

    const result = await AuthService.register({
      email,
      password,
      phone,
      role,
      fullNameOrBusinessName,
    });
    res.status(201).json({ success: true, data: result });
  }),

  // Login for all roles — identifier can be email, phone, or username.
  login: asyncHandler(async (req: Request, res: Response) => {
    const identifier = req.body.identifier || req.body.email || req.body.phone || req.body.username;
    const password = req.body.password;
    if (!identifier || !password) {
      throw ApiError.badRequest('Email, phone, or username and password are required');
    }
    const result = await AuthService.login(identifier, password);
    res.status(200).json({ success: true, data: result });
  }),

  // Separate admin-only login — never accepts OTP, only username/email + password.
  adminLogin: asyncHandler(async (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    const result = await AuthService.adminLogin(identifier, password);
    res.status(200).json({ success: true, data: result });
  }),

  requestOtp: asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body;
    const result = await AuthService.requestLoginOtp(phone);
    res.status(200).json({ success: true, message: 'OTP sent', data: result });
  }),

  verifyOtp: asyncHandler(async (req: Request, res: Response) => {
    const { phone, code } = req.body;
    const result = await AuthService.verifyLoginOtp(phone, code);
    res.status(200).json({ success: true, data: result });
  }),

  requestPasswordResetOtp: asyncHandler(async (req: Request, res: Response) => {
    const { identifier } = req.body;
    const result = await AuthService.requestPasswordResetOtp(identifier);
    res.status(200).json({ success: true, message: 'Password reset OTP sent', data: result });
  }),

  resetPasswordWithOtp: asyncHandler(async (req: Request, res: Response) => {
    const { identifier, code, newPassword } = req.body;
    const result = await AuthService.resetPasswordWithOtp(identifier, code, newPassword);
    res.status(200).json({ success: true, data: result });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw ApiError.badRequest('refreshToken is required');
    const result = await AuthService.refresh(refreshToken);
    res.status(200).json({ success: true, data: result });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    // req.user is populated by the authenticate middleware from the DB,
    // never trusted from client input.
    res.status(200).json({ success: true, data: req.user });
  }),
};
