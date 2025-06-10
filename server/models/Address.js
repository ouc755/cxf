const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  province: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  detail: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 添加保存前处理中间件
addressSchema.pre('save', async function(next) {
  // 自动去除省/市后缀
  if (this.province) this.province = this.province.replace(/省$/, '');
  if (this.city) this.city = this.city.replace(/市$/, '');

  // 处理默认地址设置
  if (this.isDefault) {
    await mongoose.model('Address').updateMany(
      { userId: this.userId },
      { $set: { isDefault: false } }
    );
  }
  next();
});

module.exports = mongoose.model('Address', addressSchema);