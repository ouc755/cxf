// 订单相关路由
import express from 'express';
import Order from '../models/Order.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// 获取最近订单列表（默认返回最新10条）
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(10);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: '获取订单失败' });
  }
});

export default router;