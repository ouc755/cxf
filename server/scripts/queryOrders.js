// 查询userId为12345678的订单脚本，直接在命令行运行即可
const mongoose = require('mongoose');
const Order = require('../models/Order');

// 你的MongoDB连接字符串
const mongoURI = 'mongodb://localhost:27017/toyShop';

async function main() {
  try {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    // 注意：userId字段为ObjectId类型，不能直接用字符串'12345678'，需要转换
    const userId = '12345678';
    let orders;
    // 兼容ObjectId和字符串类型的userId
    if (/^[0-9a-fA-F]{24}$/.test(userId)) {
      // 如果是ObjectId格式
      orders = await Order.find({ userId: mongoose.Types.ObjectId(userId) });
    } else {
      // 如果是字符串格式
      // 查询全部订单，方便人工筛选
      orders = await Order.find({}).limit(10); // 只输出前10条，避免数据过多
      if (orders.length === 0) {
        console.log('没有找到该用户的订单。');
      } else {
        console.log('查询到的订单如下：');
        orders.forEach(order => {
          console.log(JSON.stringify(order, null, 2));
        });
      }
      await mongoose.disconnect();
    } // <-- 修正：补全try块的结束括号
    } catch (err) {
      console.error('查询出错:', err);
      process.exit(1);
    }
}

main();