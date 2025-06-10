const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authenticate = require('../middleware/authenticate');

// 获取商品列表
router.get('/', async (req, res) => {
  try {
    console.log('Fetching products with filters:', req.query);
    const { category, minPrice, maxPrice, sort } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = {};
    if (sort === 'price-asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { price: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const products = await Product.find(query).sort(sortOption);
    console.log('Found products:', products.length);
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取商品详情
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching product details:', req.params.id);
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.log('Product not found');
      return res.status(404).json({ message: '商品不存在' });
    }
    console.log('Product found:', product.name);
    res.json(product);
  } catch (err) {
    console.error('Error fetching product details:', err);
    res.status(500).json({ message: err.message });
  }
});

// 创建商品（管理员）
router.post('/', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      console.log('Unauthorized access attempt by user:', req.user.id);
      return res.status(403).json({ message: '无权限执行此操作' });
    }

    console.log('Creating new product:', req.body);
    const product = new Product(req.body);
    await product.save();
    console.log('Product created successfully:', product._id);
    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: err.message });
  }
});

// 更新商品（管理员）
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      console.log('Unauthorized access attempt by user:', req.user.id);
      return res.status(403).json({ message: '无权限执行此操作' });
    }

    console.log('Updating product:', req.params.id);
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!product) {
      console.log('Product not found');
      return res.status(404).json({ message: '商品不存在' });
    }

    console.log('Product updated successfully');
    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: err.message });
  }
});

// 删除商品（管理员）
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      console.log('Unauthorized access attempt by user:', req.user.id);
      return res.status(403).json({ message: '无权限执行此操作' });
    }

    console.log('Deleting product:', req.params.id);
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      console.log('Product not found');
      return res.status(404).json({ message: '商品不存在' });
    }

    console.log('Product deleted successfully');
    res.json({ message: '商品已删除' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 