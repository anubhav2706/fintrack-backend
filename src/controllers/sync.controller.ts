import { Request, Response } from 'express';
import { SyncService } from '../services/sync.service';
import { catchAsync } from '../utils/catchAsync';

/**
 * Standalone Sync Controller
 */
export class SyncController {
  static pullSync = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await SyncService.pullSync(userId, req.body);
    res.status(result.statusCode).json(result);
  });

  static pushSync = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await SyncService.pushSync(userId, req.body);
    res.status(result.statusCode).json(result);
  });

  static getSyncStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await SyncService.getSyncStatus(userId);
    res.status(result.statusCode).json(result);
  });
}
