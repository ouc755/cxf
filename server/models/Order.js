const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
  },
  items: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Toy',
      required: true,
      validate: {
        validator: async function(v) {
          const toy = await mongoose.model('Toy').findById(v);
          return !!toy;
        },
        message: '商品ID {VALUE} 不存在'
      }
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      min: 0
    },
    specs: {
      specification: { type: String },
      size: { type: String }
    },
    specSummary: { type: String } // 新增：用于存储规格摘要，例如 "版本: 基础款, 尺寸: 30颗粒"
  }],
  totalAmount: {
    type: Number,
    required: [true, '订单总金额不能为空'],
    min: [0, '订单总金额不能为负数']
  },
  status: {
    type: Number,
    required: [true, '订单状态不能为空'],
    enum: {
      values: [0, 1, 2, 3, 4],
      message: '无效的订单状态'
    },
    default: 0
  },
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address'
    // required: [true, '收货地址ID不能为空'] // 再次尝试注释掉此约束
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 保存前验证
orderSchema.pre('save', function(next) {
  // 转换商品ID为ObjectId类型
  this.items.forEach(item => {
    if (typeof item.product === 'string' && mongoose.isValidObjectId(item.product)) {
      item.product = new mongoose.Types.ObjectId(item.product);
    }
  });

  // 如果 shippingAddress 是 ObjectId 类型，则不需要处理其内部字段
  // 如果需要验证地址是否存在，可以在这里添加逻辑，但populate通常在查询时处理
  next();
});

// 错误处理中间件
orderSchema.post('save', function(error, doc, next) {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    next(new Error(messages.join(', ')));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('Order', orderSchema);