const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Toy = require('../models/Toy'); // 引入Toy模型
const mongoose = require('mongoose'); // 引入 mongoose
const { authenticate } = require('../middleware/authenticate');

// 获取订单列表
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('Fetching orders for user:', req.user.id);
    const orders = await Order.find({ userId: req.user.id }).populate('items.product'); // 填充商品信息
    console.log('Found orders:', orders.length);
    // 打印填充后的订单数据，检查 items.product 的内容
    // console.log('Populated orders data:', JSON.stringify(orders, null, 2)); 
    if (orders && orders.length > 0) {
      console.log('Detailed populated orders data:');
      orders.forEach((order, index) => {
        console.log(`--- Order ${index + 1} (ID: ${order._id}) ---`);
        if (order.items && order.items.length > 0) {
          order.items.forEach((item, itemIndex) => {
            console.log(`  Item ${itemIndex + 1}:`);
            console.log(`    Product ID: ${item.product ? item.product._id : 'N/A'}`);
            console.log(`    Product Name: ${item.product ? item.product.name : 'N/A'}`);
            // 您可以根据需要打印更多 product 的属性
            // console.log(`    Product Details: ${JSON.stringify(item.product, null, 2)}`);
            console.log(`    Quantity: ${item.quantity}`);
            console.log(`    Specs (raw): ${JSON.stringify(item.specs, null, 2)}`);
            console.log(`    SpecSummary: ${item.specSummary}`); // 新增日志，检查 specSummary
          });
        } else {
          console.log('  No items in this order.');
        }
      });
    } else {
      console.log('No orders found or orders array is empty after populate.');
    }
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: err.message });
  }
});

// 取消订单
router.post('/:orderId/cancel', authenticate, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user.id;

    // 验证 orderId 是否为有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: '订单ID格式无效' });
    }

    console.log(`Attempting to cancel order: ${orderId} for user: ${userId}`);

    // 步骤 1: 更新订单状态为已取消 (3)
    // 使用 Mongoose 的 updateOne，它通常不会触发完整的 save 钩子和对未修改字段的校验
    // 只更新属于该用户且状态为 0 (待付款) 或 1 (待发货) 的订单
    const updateResult = await Order.updateOne(
      { _id: orderId, userId: userId, status: { $in: [0, 1] } },
      { $set: { status: 4 } } // 将状态更新为 4 (已取消)
    );

    if (updateResult.matchedCount === 0) {
        // 如果 matchedCount 是 0，说明没有找到符合条件的订单（不存在，不属于该用户，或状态不对）
        console.log('Order not found or not in a cancellable state (matchedCount=0):', orderId);
        const existingOrder = await Order.findOne({ _id: orderId, userId: userId });
        if (!existingOrder) {
            return res.status(404).json({ message: '订单不存在' });
        }
        return res.status(400).json({ message: '当前订单状态不可取消' });
    }
    
    // modifiedCount 表示实际被修改的文档数量。如果订单已经是取消状态，则 modifiedCount 会是0，但 matchedCount 可能是1。
    // 我们主要关心的是订单是否被匹配到并且现在（或之前就）是取消状态。

    // 步骤 2: 删除订单
    // 只有在订单状态被（或已经是）取消后才尝试删除。
    // 我们在这里再次确认 status: 4 是为了确保只删除确实已取消的订单。
    const deleteResult = await Order.deleteOne({ _id: orderId, userId: userId, status: 4 });

    if (deleteResult.deletedCount === 0 && updateResult.modifiedCount > 0) {
      // 订单状态被成功更新为取消，但删除操作未删除任何文档。
      // 这可能意味着订单在 status 更新为 3 之后，但在 deleteOne 执行之前，因为某些原因（例如并发操作）未能被删除，
      // 或者 status 字段由于某种原因没有正确持久化为 3 (尽管 updateOne 成功)。
      // 这是一个需要注意的边缘情况，但主要目标（标记为取消）已完成。
      console.warn(`Order ${orderId} was marked as cancelled (modifiedCount: ${updateResult.modifiedCount}), but could not be deleted (deletedCount: 0).`);
    } else if (deleteResult.deletedCount === 0 && updateResult.modifiedCount === 0 && updateResult.matchedCount === 1) {
      // 订单匹配到，但状态未被修改（可能已经是取消状态），并且删除也未成功。
      // 这可能意味着订单已经是取消状态，但由于某些原因无法被删除。
      console.warn(`Order ${orderId} was already in target state or not modified, and could not be deleted.`);
    }

    console.log(`Order ${orderId} cancellation process completed. Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}, Deleted: ${deleteResult.deletedCount}`);
    res.json({ success: true });

  } catch (err) {
    console.error('Error cancelling order:', err.name, err.message, err.stack);
    // 检查是否是 ObjectId 转换错误 (CastError)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({ message: '提供的订单ID格式无效。' });
    }
    // 对于其他错误，返回通用错误信息
    res.status(500).json({ message: err.message || '取消订单时发生服务器内部错误' });
  }
});

// 申请售后
router.post('/:orderId/after-sale', authenticate, async (req, res) => {
  try {
    console.log('Requesting after-sale for order:', req.params.orderId);
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.id
    });

    if (!order) {
      console.log('Order not found');
      return res.status(404).json({ message: '订单不存在' });
    }

    if (order.status !== 2) {
      console.log('Invalid order status for after-sale:', order.status);
      return res.status(400).json({ message: '只有已完成的订单可以申请售后' });
    }

    order.status = 4; // 售后中
    await order.save();
    console.log('After-sale request submitted successfully');
    res.json({ success: true });
  } catch (err) {
    console.error('Error requesting after-sale:', err);
    res.status(500).json({ message: err.message });
  }
});

// 创建新订单
router.post('/', authenticate, async (req, res) => {
  try {
    const { productId, quantity, shippingAddress, paymentMethod } = req.body; // 移除 totalPrice，因为总价应该根据商品价格和数量计算
    console.log('Creating new order for user:', req.user.id, 'with product ID from request:', productId, 'quantity:', quantity, 'specs:', req.body.specs, 'shippingAddress:', shippingAddress);

    // 验证请求体中是否包含商品信息
    if (!productId || !quantity ) {
      console.log('Missing product ID or quantity in request body.');
      return res.status(400).json({ message: '缺少必要的商品信息或数量' });
    }

    // 验证 shippingAddress 是否为有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(shippingAddress)) {
      console.log('Invalid shipping address ID format:', shippingAddress);
      return res.status(400).json({ message: '收货地址ID格式无效' });
    }

    // 验证 productId 是否为有效数字
    if (isNaN(Number(productId))) { // 简化验证，因为 productId 应该总是数字或可转为数字的字符串
      console.log('Invalid Product ID format:', productId);
      return res.status(400).json({ message: '商品ID格式无效' });
    }

    // 根据 originalId 查找商品
    const productDoc = await Toy.findOne({ originalId: Number(productId) });
    if (!productDoc) {
      console.log('Product not found with originalId:', productId);
      return res.status(404).json({ message: '商品未找到' });
    }

    // 从请求体中获取选中的规格和尺寸
    const selectedSpecs = req.body.specs || {}; 

    // 将规格对象转换为描述性字符串
    let specSummary = '';
    if (selectedSpecs && typeof selectedSpecs === 'object' && Object.keys(selectedSpecs).length > 0) {
      specSummary = Object.entries(selectedSpecs)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } else {
      specSummary = '无特定规格'; // 或者根据业务需求设置默认值
    }

    const newOrder = new Order({
      userId: req.user.id,
      items: [{
        product: productDoc._id, // 使用查找到的商品的 ObjectId
        quantity: quantity,
        specs: selectedSpecs, // 保留原始规格对象
        specSummary: specSummary, // 添加规格描述字符串
        price: productDoc.price // 添加商品价格
      }],
      shippingAddress: shippingAddress, 
      paymentMethod: paymentMethod,   
      // totalAmount: totalPrice, // 总价应根据商品价格和数量计算
      totalAmount: productDoc.price * quantity, // 计算总价      
      status: 0 
    });

    const savedOrder = await newOrder.save();
    console.log('Order created successfully with ID:', savedOrder._id, 'and items:', JSON.stringify(savedOrder.items, null, 2));
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: '创建订单失败: ' + err.message });
  }
});

// 获取特定订单详情
router.get('/:orderId', authenticate, async (req, res) => {
  try {
    console.log('Fetching order details for order ID:', req.params.orderId, 'and user ID:', req.user.id);
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.id
    }).populate('items.product').populate('shippingAddress').populate('userId'); // 填充商品详情、收货地址和用户信息

    if (!order) {
      console.log('Order not found with ID:', req.params.orderId, 'for user:', req.user.id);
      return res.status(404).json({ message: '订单未找到' });
    }
    console.log('Order found:', order._id);
    console.log('[DEBUG] Server: Populated order.shippingAddress:', JSON.stringify(order.shippingAddress, null, 2)); // 检查 populate 结果
    res.json(order);
  } catch (err) {
    console.error('Error fetching order details:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '订单ID格式无效' });
    }
    res.status(500).json({ message: err.message });
  }
});

// 更新订单的收货地址
router.put('/:orderId/shipping-address', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { shippingAddressId } = req.body;
    const userId = req.user.id;

    console.log(`Updating shipping address for order ID: ${orderId}, user ID: ${userId}, new address ID: ${shippingAddressId}`);

    const order = await Order.findOne({
      _id: orderId,
      userId: userId
    });

    if (!order) {
      console.log('Order not found for updating shipping address.');
      return res.status(404).json({ message: '订单未找到' });
    }

    // 验证 shippingAddressId 是否存在且有效 (例如，检查它是否是一个有效的 ObjectId)
    // 这里可以添加对 shippingAddressId 的进一步验证，比如检查该地址是否存在于用户的地址列表中
    if (!shippingAddressId || !mongoose.Types.ObjectId.isValid(shippingAddressId)) {
        console.log('Invalid shippingAddressId provided.');
        return res.status(400).json({ message: '无效的收货地址ID' });
    }

    order.shippingAddress = shippingAddressId;
    await order.save();

    console.log('Order shipping address updated successfully.');
    // 返回更新后的订单信息，或者至少是成功的消息
    // 为了与前端的 getOrderDetail 保持一致，可以考虑 populate 相关字段后返回
    const updatedOrder = await Order.findById(orderId).populate('items.product').populate('shippingAddress').populate('userId');
    res.json(updatedOrder);

  } catch (err) {
    console.error('Error updating order shipping address:', err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: '订单ID或地址ID格式无效' });
    }
    res.status(500).json({ message: err.message });
  }
});

// 获取所有订单 (供商家后台使用)
router.get('/all', async (req, res) => {
  try {
    console.log('Fetching all orders for admin panel');
    // 按创建时间降序排序，获取最近的订单
    const orders = await Order.find({}).populate('items.product').sort({ createdAt: -1 }); 
    console.log('Found all orders:', orders.length);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching all orders:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;