const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, '商品ID不能为空']
    },
    quantity: {
      type: Number,
      required: [true, '商品数量不能为空'],
      min: [1, '商品数量至少为1']
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 保存前更新
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 错误处理中间件
cartSchema.post('save', function(error, doc, next) {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    next(new Error(messages.join(', ')));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('Cart', cartSchema); 