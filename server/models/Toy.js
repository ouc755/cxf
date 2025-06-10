const mongoose = require('mongoose');

const toySchema = new mongoose.Schema({
  originalId: { type: Number, required: true, unique: true, index: true }, // 新增字段，存储原始数字ID
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  desc: { type: String, required: true },
  size: { type: String, required: true },
  category: { type: String, required: true },
  // 新增 specifications 字段用于存储规格和价格
  // 每个规格包含名称(name)，选项(options)数组
  // 每个选项包含值(value)和价格调整(priceAdjustment, 可以是正数或负数，表示在基础价格上的增加或减少)
  specifications: [
    {
      name: { type: String, required: true }, // 例如：版本、颜色
      options: [
        {
          value: { type: String, required: true }, // 例如：标准版、豪华版、红色、蓝色
          priceAdjustment: { type: Number, required: true, default: 0 } // 价格调整值
        }
      ]
    }
  ]
});

module.exports = mongoose.model('Toy', toySchema);