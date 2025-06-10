const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Address = require('../models/Address');
const { authenticate } = require('../middleware/authenticate');

// 获取用户地址列表
router.get('/', authenticate, async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.id });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 添加新地址
router.post('/', authenticate, async (req, res) => {
  const { receiver, contact, province, city, district, detail, isDefault } = req.body;

  // 基础字段校验
  if (!receiver || !contact || !province || !city || !district || !detail) {
    return res.status(400).json({
      code: 400,
      msg: '所有带*的字段为必填项'
    });
  }

  try {
    const newAddress = new Address({
      userId: req.user.id,
      receiver,
      contact,
      province: province.replace(/省$/, ''),
      city: city.replace(/市$/, ''),
      district,
      detail,
      isDefault: isDefault || false
    });

    if(isDefault) {
      await Address.updateMany(
        { userId: req.user.id },
        { $set: { isDefault: false } }
      );
    }

    const savedAddress = await newAddress.save();
    res.status(201).json(savedAddress);
  } catch (err) {
    console.error('地址保存错误:', err);
    res.status(err instanceof mongoose.Error.ValidationError ? 400 : 500).json({
      code: err instanceof mongoose.Error.ValidationError ? 400 : 500,
      msg: err instanceof mongoose.Error.ValidationError 
        ? '请求参数错误: ' + Object.values(err.errors).map(e => e.message).join(', ')
        : '服务器内部错误，请稍后再试',
      _debug: process.env.NODE_ENV === 'development' ? {
        stack: err.stack,
        fullError: err
      } : undefined
    });
  }
});

// 获取单个地址详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address) {
      return res.status(404).json({ message: '未找到指定的地址' });
    }
    // 确保返回的地址属于当前用户，虽然 authenticate 中间件已经校验了用户，但这里可以加一层保险
    if (address.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: '无权访问该地址' });
    }
    res.json(address);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: '无效的地址ID格式' });
    }
    res.status(500).json({ message: err.message });
  }
});

// 更新地址
router.put('/:id', authenticate, async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if(req.body.isDefault) {
      await Address.updateMany(
        { userId: req.user.id },
        { $set: { isDefault: false } }
      );
    }
    Object.assign(address, req.body);
    const updatedAddress = await address.save();
    res.json(updatedAddress);
  } catch (err) {
    console.error('地址保存错误:', err);
    res.status(err instanceof mongoose.Error.ValidationError ? 400 : 500).json({
      code: err instanceof mongoose.Error.ValidationError ? 400 : 500,
      msg: err instanceof mongoose.Error.ValidationError 
        ? '请求参数错误: ' + Object.values(err.errors).map(e => e.message).join(', ')
        : '服务器内部错误，请稍后再试',
      _debug: process.env.NODE_ENV === 'development' ? {
        stack: err.stack,
        fullError: err
      } : undefined
    });
  }
});

// 获取用户默认地址
router.get('/default', authenticate, async (req, res) => {
  try {
    const defaultAddress = await Address.findOne({ userId: req.user.id, isDefault: true });
    if (!defaultAddress) {
      // 如果没有找到默认地址，可以返回 404 或者一个空对象/null，根据前端期望处理
      return res.status(404).json({ message: '未找到默认地址' });
    }
    res.json(defaultAddress);
  } catch (err) {
    console.error('获取默认地址失败:', err);
    res.status(500).json({ message: err.message });
  }
});

// 删除地址
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await Address.findByIdAndDelete(req.params.id);
    res.json({ message: '地址删除成功' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;