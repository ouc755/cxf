const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '商品名称不能为空'],
    trim: true,
    minlength: [2, '商品名称至少需要2个字符'],
    maxlength: [100, '商品名称不能超过100个字符']
  },
  description: {
    type: String,
    required: [true, '商品描述不能为空'],
    trim: true,
    minlength: [10, '商品描述至少需要10个字符'],
    maxlength: [2000, '商品描述不能超过2000个字符']
  },
  price: {
    type: Number,
    required: [true, '商品价格不能为空'],
    min: [0, '商品价格不能为负数']
  },
  stock: {
    type: Number,
    required: [true, '商品库存不能为空'],
    min: [0, '商品库存不能为负数'],
    default: 0
  },
  category: {
    type: String,
    required: [true, '商品分类不能为空'],
    trim: true
  },
  images: [{
    type: String,
    required: [true, '商品图片不能为空']
  }],
  rating: {
    type: Number,
    min: [0, '评分不能小于0'],
    max: [5, '评分不能大于5'],
    default: 0
  },
  numReviews: {
    type: Number,
    min: [0, '评论数不能为负数'],
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 保存前验证
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
  if (this.isModified('description')) {
    this.description = this.description.trim();
  }
  if (this.isModified('category')) {
    this.category = this.category.trim();
  }
  next();
});

// 错误处理中间件
productSchema.post('save', function(error, doc, next) {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    next(new Error(messages.join(', ')));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('Product', productSchema); 