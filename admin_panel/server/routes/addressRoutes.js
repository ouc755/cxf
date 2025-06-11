import express from 'express';
import Address from '../models/Address.js';

const router = express.Router();

// 创建地址
router.post('/', async (req, res) => {
  try {
    const newAddress = new Address({
      user: req.user.id,
      receiver: req.body.receiver,
      contact: req.body.contact,
      province: req.body.province,
      city: req.body.city,
      district: req.body.district,
      detail: req.body.detail,
      isDefault: req.body.isDefault
    });

    const savedAddress = await newAddress.save();
    res.status(201).json({
      code: 200,
      data: savedAddress,
      msg: '地址创建成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      msg: error.message || '服务器内部错误'
    });
  }
});

export default router;