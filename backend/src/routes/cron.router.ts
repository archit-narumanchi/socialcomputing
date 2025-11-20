import { Router } from 'express';
import { updateTopContributors } from '../utils/ranking';

const router = Router();

// POST /api/cron/calculate-ranks
// This endpoint triggers the ranking calculation.
// In a real app, you would protect this with a secret key header.
router.post('/calculate-ranks', async (req, res) => {
  // Simple security check (optional for MVP, but good practice)
  const cronKey = req.headers['x-cron-key'];
  if (process.env.CRON_SECRET && cronKey !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Run the calculation asynchronously (don't wait for it to finish to respond)
  updateTopContributors();

  res.status(200).json({ message: 'Calculation started' });
});

export default router;