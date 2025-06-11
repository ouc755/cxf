import express from 'express';
import mongoose from 'mongoose';
import auth from './middleware/auth.js';

const app = express();
const port = 5002;

// 连接MongoDB
mongoose.connect('mongodb://localhost:27017/toyShop')
.then(() => console.log('MongoDB连接成功'))
.catch(err => console.error('MongoDB连接失败:', err));

// 中间件
app.use(express.json());
app.use((req, res, next) => {
  console.log('收到请求:', req.method, req.originalUrl);
  next();
});

// 登录路由应放在 auth 之前
import adminLogin from './routes/adminLogin.js';
app.use('/admin', adminLogin); // 注册管理员登录路由
console.log('已注册 /admin 路由'); // 新增日志

app.use(auth); // 用户认证中间件

// 路由
import addressRoutes from './routes/addressRoutes.js';
import productRoutes from './routes/productRoutes.js';

app.use('/api/addresses', addressRoutes);
app.use('/api/admin/products', productRoutes); // 添加商品管理路由

// 基础路由
app.get('/', (req, res) => {
  res.json({ status: 'running', message: '欢迎使用管理后台接口' });
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});