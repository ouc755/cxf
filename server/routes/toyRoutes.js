const express = require('express');
const router = express.Router();
const Toy = require('../models/Toy');

// 获取所有商品接口
router.get('/', async (req, res) => {
  try {
    const { category, keyword } = req.query;
    let query = {};

    if (category && category !== '全部商品') {
      query.category = category;
    }

    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' };
    }

    const toys = await Toy.find(query);
    res.json(toys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 创建新商品接口
router.post('/', async (req, res) => {
  try {
    const { id, name, price, image, desc, size, category } = req.body;
    
    if (!id || !name || !price || !image || !desc || !size || !category) {
      return res.status(400).json({ message: '所有字段均为必填项' });
    }

    const newToy = new Toy({
      id,
      name,
      price,
      image,
      desc,
      size,
      category
    });

    const savedToy = await newToy.save();
    res.status(201).json(savedToy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 创建订单接口
router.post('/orders', async (req, res) => {
  try {
    const { productId, userId, specs } = req.body;
    
    if (!productId || !userId || !specs) {
      return res.status(400).json({ message: '缺少必要参数' });
    }

    const newOrder = new Order({
      product: productId,
      user: userId,
      specs,
      createdAt: Date.now()
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;