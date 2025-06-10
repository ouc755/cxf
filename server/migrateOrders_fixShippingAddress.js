// 批量修正历史订单数据，将 shippingAddress 字段全部替换为地址表的 _id
// 使用方法：node server/migrateOrders_fixShippingAddress.js
// 本脚本只需运行一次，修正后可删除

const mongoose = require('mongoose');
const Order = require('./models/Order');
const Address = require('./models/Address');
const config = require('./config/config');

// 修改为你的数据库连接字符串
const MONGO_URI = config.mongoUri || 'mongodb://localhost:27017/xyx';

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('数据库已连接');

  // 查询所有订单
  const orders = await Order.find({});
  let updateCount = 0;
  for (const order of orders) {
    // 如果 shippingAddress 已经是 ObjectId，跳过
    if (mongoose.isValidObjectId(order.shippingAddress)) continue;
    // 如果 shippingAddress 不是对象，跳过
    if (!order.shippingAddress || typeof order.shippingAddress !== 'object') continue;
    // 查找匹配的地址
    // 优化匹配条件，允许部分字段匹配（如只匹配收件人、手机号和详细地址）
    const address = await Address.findOne({
      userId: order.userId,
      receiver: order.shippingAddress.receiver,
      contact: order.shippingAddress.contact,
      detail: order.shippingAddress.detail
    });
    if (address) {
      order.shippingAddress = address._id;
      await order.save();
      updateCount++;
      console.log(`订单 ${order._id} 的 shippingAddress 已修正为地址ID: ${address._id}`);
    } else {
      // 如果严格匹配失败，尝试更宽松的匹配（只匹配手机号和详细地址）
      const looseAddress = await Address.findOne({
        userId: order.userId,
        contact: order.shippingAddress.contact,
        detail: order.shippingAddress.detail
      });
      if (looseAddress) {
        order.shippingAddress = looseAddress._id;
        await order.save();
        updateCount++;
        console.log(`订单 ${order._id} 的 shippingAddress 已宽松匹配为地址ID: ${looseAddress._id}`);
      } else {
        console.warn(`订单 ${order._id} 未找到匹配的地址，未做修改。`);
      }
    }
  }
  console.log(`修正完成，共更新 ${updateCount} 条订单。`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('修正过程中发生错误:', err);
  process.exit(1);
});