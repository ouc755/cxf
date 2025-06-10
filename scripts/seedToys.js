const mongoose = require('mongoose');
const Toy = require('../server/models/Toy');
const config = require('../server/config/' + (process.env.NODE_ENV || 'development') + '.js');

const sampleToys = [
  {
    originalId: 1,
    name: '可爱小熊',
    price: 50.00,
    image: '/images/toy1.jpg',
    desc: '一只非常可爱的小熊玩偶。',
    size: '中号',
    category: '毛绒玩具'
  },
  {
    originalId: 2,
    name: '积木套装',
    price: 120.00,
    image: '/images/toy2.jpg',
    desc: '一套丰富多彩的儿童积木。',
    size: '大号',
    category: '益智玩具'
  },
  {
    originalId: 3,
    name: '遥控汽车',
    price: 200.00,
    image: '/images/toy3.jpg',
    desc: '高速遥控赛车，带你体验速度与激情。',
    size: '小号',
    category: '电子玩具'
  }
  // 可以根据需要添加更多商品数据
];

async function seedToys() {
  let errorOccurred = false;
  try {
    await mongoose.connect(config.db.uri, { ...config.db.options, bufferTimeoutMS: 120000, useUnifiedTopology: true, serverSelectionTimeoutMS: 60000, connectTimeoutMS: 60000, socketTimeoutMS: 60000 });
    console.log('数据库连接成功，开始初始化商品数据...');

    // 清空现有的 toys 集合（可选，如果需要完全重置）
    await Toy.deleteMany({});
    // console.log('已清空现有的 toys 集合');

    const result = await Toy.insertMany(sampleToys);
    console.log(`成功插入 ${result.length} 条商品数据。`);

    process.exit(0); // 成功退出

  } catch (error) {
    console.error('商品数据初始化过程中发生错误:', error);
    errorOccurred = true;
    if (mongoose.connection.readyState === 1) { // 1 = connected
        await mongoose.disconnect();
        console.log('数据库连接已断开。');
    }
    process.exit(1); // 错误退出
  }
}

seedToys();