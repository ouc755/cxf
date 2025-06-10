const mongoose = require('mongoose');
const Toy = require('./models/Toy');
const toyData = require('../utils/toyData');

const config = process.env.NODE_ENV === 'production' ? require('./config/production.js') : require('./config/development.js');

mongoose.connect(config.db.uri, config.db.options)
.then(async () => {
  await Toy.deleteMany({});
  const toys = toyData.toyList.map(toy => ({
    _id: new mongoose.Types.ObjectId(), // 生成新的ObjectId
    originalId: toy.id, // 保留原始数字ID作为参考
    name: toy.name,
    price: toy.price,
    image: toy.image,
    desc: toy.desc,
    size: (toy.sizes && toy.sizes.length > 0) ? toy.sizes[0] : (toy.size || '标准尺寸'), // 从 sizes 数组取值，或使用已有的 size，或默认值
    category: toy.category
  }));
  const createdToys = await Toy.insertMany(toys);
  console.log('生成的玩具ObjectId示例:', createdToys[0]._id);
  console.log('数据导入完成');
  process.exit(0);
})
.catch(err => {
  console.error('数据导入失败:', err);
  process.exit(1);
});