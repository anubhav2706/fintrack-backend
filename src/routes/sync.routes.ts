import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller';
import { protect } from '../middleware';

const router = Router();

/**
 * Sync Routes - Standalone to bypass broken additional services
 */
router.post(
  '/pull',
  protect,
  SyncController.pullSync
);

router.post(
  '/push',
  protect,
  SyncController.pushSync
);

router.get(
  '/status',
  protect,
  SyncController.getSyncStatus
);

export default router;
