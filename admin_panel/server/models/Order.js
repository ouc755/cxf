// 订单模型
import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true }, // 订单号
  customer: { type: String, required: true }, // 客户名
  amount: { type: Number, required: true }, // 金额
  status: { type: String, required: true }, // 状态，如“待发货”、“已发货”等
  createdAt: { type: Date, default: Date.now } // 创建时间
});

const Order = mongoose.model('Order', OrderSchema);
export default Order;