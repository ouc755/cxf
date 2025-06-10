// migrateOrders.js
const mongoose = require('mongoose');
const Order = require('./models/Order');
const Toy = require('./models/Toy');
const config = process.env.NODE_ENV === 'production' ? require('./config/production.js') : require('./config/development.js');

async function migrateOrders() {
  let errorOccurred = false;
  try {
    await mongoose.connect(config.db.uri, config.db.options);
    console.log('数据库连接成功，开始迁移订单数据...');

    const orders = await Order.find({}); // 获取所有订单
    let updatedCount = 0;

    console.log(`发现 ${orders.length} 个订单需要检查。`);

    for (const order of orders) {
      let orderModified = false;
      for (const item of order.items) {
        // 检查 item.product 是否存在且不是一个 ObjectId 实例
        if (item.product && !(item.product instanceof mongoose.Types.ObjectId)) {
          const potentialNumericId = Number(item.product); // 尝试将其转换为数字

          // 如果能成功转换为数字 (不是 NaN)
          if (!isNaN(potentialNumericId)) {
            console.log(`订单 ${order._id} - 商品项 ${item._id}: product ID "${item.product}" (类型: ${typeof item.product}) 将尝试作为 originalId (${potentialNumericId}) 进行迁移。`);
            const toy = await Toy.findOne({ originalId: potentialNumericId });
            if (toy) {
              console.log(`  找到匹配的玩具 (originalId: ${potentialNumericId}), 其 _id 为 ${toy._id}。更新订单项。`);
              item.product = toy._id; // 更新为 ObjectId
              orderModified = true;
            } else {
              console.warn(`  警告: 订单 ${order._id} - 商品项 ${item._id}: originalId ${potentialNumericId} 在 Toy 集合中未找到对应的玩具。该商品项可能引用了一个已被删除或ID错误的商品。`);
            }
          } else {
            // 如果不能转换为数字，但又不是 ObjectId，这可能是一个无效的 ObjectId 字符串或其他非预期类型
            console.warn(`  警告: 订单 ${order._id} - 商品项 ${item._id}: product ID "${item.product}" (类型: ${typeof item.product}) 不是有效的 ObjectId 也不是可识别的数字ID。跳过。`);
          }
        } else if (item.product && item.product instanceof mongoose.Types.ObjectId) {
          // console.log(`订单 ${order._id} - 商品项 ${item._id}: product ID ${item.product} 已经是 ObjectId，无需迁移。`);
        } else if (!item.product) {
            console.warn(`  警告: 订单 ${order._id} - 商品项 ${item._id}: product ID 为空或未定义。跳过。`);
        }
      }

      if (orderModified) {
        await order.save();
        updatedCount++;
        console.log(`订单 ${order._id} 已成功更新。`);
      }
    }

    console.log(`订单数据迁移完成。共检查了 ${orders.length} 个订单，成功更新了 ${updatedCount} 个订单。`);
  } catch (error) {
    console.error('订单数据迁移过程中发生错误:', error);
    errorOccurred = true;
  } finally {
    if (mongoose.connection.readyState === 1) { // 1 = connected
        await mongoose.disconnect();
        console.log('数据库连接已断开。');
    }
    process.exit(errorOccurred ? 1 : 0); // 如果有错误，以状态码 1 退出，否则以 0 退出
  }
}

migrateOrders();