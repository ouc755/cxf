import mongoose from 'mongoose';

// 创建商品模型
const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  stock: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  description: { 
    type: String, 
    required: false,
    trim: true 
  },
  images: [{ 
    type: String 
  }],
  category: { 
    type: String, 
    required: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// 更新时自动更新updatedAt字段
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;