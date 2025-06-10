const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const authenticate = require('../middleware/authenticate');

// 获取购物车
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('Fetching cart for user:', req.user.id);
    let cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.productId');

    if (!cart) {
      console.log('Cart not found, creating new cart');
      cart = new Cart({ userId: req.user.id, items: [] });
      await cart.save();
    }

    console.log('Cart items count:', cart.items.length);
    res.json(cart);
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ message: err.message });
  }
});

// 添加商品到购物车
router.post('/add', authenticate, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    console.log('Adding product to cart:', { productId, quantity, userId: req.user.id });

    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(404).json({ message: '商品不存在' });
    }

    if (product.stock < quantity) {
      console.log('Insufficient stock:', { productId, requested: quantity, available: product.stock });
      return res.status(400).json({ message: '商品库存不足' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      console.log('Cart not found, creating new cart');
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    const existingItem = cart.items.find(item => item.productId.toString() === productId);
    if (existingItem) {
      console.log('Updating existing item quantity');
      existingItem.quantity += quantity;
    } else {
      console.log('Adding new item to cart');
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    console.log('Cart updated successfully');
    res.json(cart);
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ message: err.message });
  }
});

// 更新购物车商品数量
router.put('/update/:productId', authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;
    console.log('Updating cart item:', { productId: req.params.productId, quantity, userId: req.user.id });

    const product = await Product.findById(req.params.productId);
    if (!product) {
      console.log('Product not found:', req.params.productId);
      return res.status(404).json({ message: '商品不存在' });
    }

    if (product.stock < quantity) {
      console.log('Insufficient stock:', { productId: req.params.productId, requested: quantity, available: product.stock });
      return res.status(400).json({ message: '商品库存不足' });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      console.log('Cart not found');
      return res.status(404).json({ message: '购物车不存在' });
    }

    const item = cart.items.find(item => item.productId.toString() === req.params.productId);
    if (!item) {
      console.log('Item not found in cart');
      return res.status(404).json({ message: '商品不在购物车中' });
    }

    item.quantity = quantity;
    await cart.save();
    console.log('Cart item updated successfully');
    res.json(cart);
  } catch (err) {
    console.error('Error updating cart:', err);
    res.status(500).json({ message: err.message });
  }
});

// 从购物车删除商品
router.delete('/remove/:productId', authenticate, async (req, res) => {
  try {
    console.log('Removing item from cart:', { productId: req.params.productId, userId: req.user.id });
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      console.log('Cart not found');
      return res.status(404).json({ message: '购物车不存在' });
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== req.params.productId);
    await cart.save();
    console.log('Item removed from cart successfully');
    res.json(cart);
  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).json({ message: err.message });
  }
});

// 清空购物车
router.delete('/clear', authenticate, async (req, res) => {
  try {
    console.log('Clearing cart for user:', req.user.id);
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      console.log('Cart not found');
      return res.status(404).json({ message: '购物车不存在' });
    }

    cart.items = [];
    await cart.save();
    console.log('Cart cleared successfully');
    res.json(cart);
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 