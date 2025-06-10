const mongoose = require('mongoose');
const Order = require('../server/models/Order');
const Toy = require('../server/models/Toy');

async function migrateOrders() {
  await mongoose.connect('mongodb://localhost:27017/toyShop', {
    dbName: 'toyShop',
    bufferTimeoutMS: 60000 // 增加缓冲超时时间到 60 秒
  });

  const orders = await Order.find({}).maxTimeMS(60000);

  for (const order of orders) {
    let needsUpdate = false;

    order.items = await Promise.all(order.items.map(async (item) => {
      if (typeof item.product === 'number') {
        try {
          const toy = await Toy.findOne({ originalId: item.product });
          if (toy) {
            needsUpdate = true;
            return {
              ...item.toObject(),
              product: toy._id
            };
          } else {
            console.warn(`商品originalId ${item.product}未找到，订单ID: ${order._id}`);
            return item;
          }
        } catch (err) {
          console.error(`处理订单${order._id}时发生错误:`, err);
          return item;
        }
      }
      return item;
    }));

    if (needsUpdate) {
      await order.save();
      console.log(`成功更新订单 ${order._id}`);
    }
  }

  console.log('数据迁移完成');
  process.exit(0);
}

migrateOrders().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});