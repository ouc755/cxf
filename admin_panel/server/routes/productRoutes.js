import express from 'express';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js'; // 新增：引入权限中间件

const router = express.Router();

// 获取所有商品
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ message: '获取商品列表失败', error: error.message });
  }
});

// 获取单个商品
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }
    res.json(product);
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({ message: '获取商品详情失败', error: error.message });
  }
});

// 创建商品
router.post('/', auth, async (req, res) => {
  // 校验管理员权限
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '无权限操作' });
  }
  try {
    const { name, price, stock, description, images, category } = req.body;
    
    // 创建新商品
    const newProduct = new Product({
      name,
      price,
      stock,
      description,
      images,
      category
    });
    
    // 保存到数据库
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('创建商品失败:', error);
    res.status(400).json({ message: '创建商品失败', error: error.message });
  }
});

// 更新商品
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '无权限操作' });
  }
  try {
    const { name, price, stock, description, images, category } = req.body;
    
    // 查找并更新商品
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, stock, description, images, category, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ message: '商品不存在' });
    }
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('更新商品失败:', error);
    res.status(400).json({ message: '更新商品失败', error: error.message });
  }
});

// 删除商品
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '无权限操作' });
  }
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      return res.status(404).json({ message: '商品不存在' });
    }
    
    res.json({ message: '商品删除成功', product: deletedProduct });
  } catch (error) {
    console.error('删除商品失败:', error);
    res.status(500).json({ message: '删除商品失败', error: error.message });
  }
});

export default router;