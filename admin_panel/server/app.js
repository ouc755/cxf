import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = __filename || __dirname;
const __dirname = __dirname || dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') }); // 使用绝对路径加载.env文件
import express from 'express';
import mongoose from 'mongoose';
import orderRoutes from './routes/orderRoutes.js'; // 新增：导入订单路由
import productRoutes from './routes/productRoutes.js'; // 新增：导入商品路由

const app = express();
app.use(express.json()); // 新增：用于解析 JSON 请求体

// 连接MongoDB
// mongoose.connect('mongodb://localhost:27017/toyShop'); // 修改数据库为 toyShop
mongoose.connect(process.env.MONGODB_URI, {
  // useNewUrlParser: true, // 保持这些选项以获得更好的兼容性
  // useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected to toyShop database via admin_panel'))
.catch(err => console.error('MongoDB connection error (admin_panel):', err));

// 路由注册
import addressRoutes from './routes/addressRoutes.js';
import adminLogin from './routes/adminLogin.js'; // 新增：导入管理员登录路由
app.use('/api/addresses', addressRoutes);
app.use('/api/admin', adminLogin); // 新增：注册管理员登录路由
app.use('/api/orders', orderRoutes); // 新增：注册订单路由
app.use('/api/products', productRoutes); // 新增：注册商品路由

// 启动服务器
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});