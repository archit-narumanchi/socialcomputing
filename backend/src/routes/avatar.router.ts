import { Router } from 'express';
import { prisma } from '../db';
import { isAuthenticated, AuthRequest } from '../middleware/auth';

const router = Router();

// --- Get My Profile (Coins, Avatar, Owned Items) ---
// GET /api/avatar/me
router.get('/me', isAuthenticated, async (req: AuthRequest, res) => {
  const userId = req.userId!;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        coins: true,
        avatarConfig: true,
        items: {
          include: { item: true } // Get details of owned items
        }
      }
    });
    res.status(200).json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal serv    er error' });
  }
});

// --- List Shop Items ---
// GET /api/avatar/shop
router.get('/shop', isAuthenticated, async (req: AuthRequest, res) => {
  try {
    const items = await prisma.avatarItem.findMany();
    res.status(200).json(items);
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Buy an Item ---
// POST /api/avatar/buy/:itemId
router.post('/buy/:itemId', isAuthenticated, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const itemId = parseInt(req.params.itemId);

  try {
    // Transaction: Check coins, deduct coins, add item
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get user and item
      const user = await tx.user.findUnique({ where: { id: userId } });
      const item = await tx.avatarItem.findUnique({ where: { id: itemId } });

      if (!item) throw new Error('Item not found');
      if (!user) throw new Error('User not found');

      // 2. Check if already owned
      const existingItem = await tx.userItem.findUnique({
        where: { userId_itemId: { userId, itemId } }
      });
      if (existingItem) throw new Error('You already own this item');

      // 3. Check balance
      if (user.coins < item.price) throw new Error('Not enough coins');

      // 4. Deduct coins
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { coins: { decrement: item.price } }
      });

      // 5. Add item to inventory
      await tx.userItem.create({
        data: { userId, itemId }
      });

      return { coins: updatedUser.coins, message: `Bought ${item.name}` };
    });

    res.status(200).json(result);

  } catch (error: any) {
    console.error('Buy item error:', error);
    if (error.message === 'Not enough coins' || error.message === 'You already own this item') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Update Avatar Configuration (Equip Items) ---
// POST /api/avatar/equip
// Body: { hat: "red-cap", shirt: "blue-shirt" } -> Saves arbitrary JSON config
router.post('/equip', isAuthenticated, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { config } = req.body; // Expects a JSON object

  if (!config) return res.status(400).json({ error: 'Config object is required' });

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarConfig: config },
      select: { avatarConfig: true }
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Equip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;