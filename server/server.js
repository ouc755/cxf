const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // 确保这行在最顶部，并使用绝对路径加载.env文件
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// 基本的中间件应该在最前面定义
app.use(cors());
app.use(express.json());

// 添加一个日志中间件来记录所有请求的路径和方法
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// 连接本地MongoDB
// mongoose.connect('mongodb://localhost:27017/toyShop', {
//   dbName: 'toyShop'
// })
mongoose.connect(process.env.MONGODB_URI, {
  dbName: 'toyShop' // 如果你的 MONGODB_URI 中没有包含数据库名，可以在这里指定
})
.then(() => {
  console.log('MongoDB connected to toyShop database');
  
  // 在数据库连接成功后加载模型
  require('./models/User'); 
  require('./models/Product'); 
  require('./models/Order'); 

  // 将路由定义也移到这里，确保模型已加载
  // 商品路由
  app.use('/api/toys', require('./routes/toyRoutes'));
  // 地址路由
  app.use('/api/addresses', require('./routes/addressRoutes'));
  // 订单路由
  app.use('/api/orders', require('./routes/orderRoutes'));
  // 用户认证路由
  app.use('/api/auth', require('./routes/userRoutes'));

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} and accessible on all network interfaces`);
  });

})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // 连接失败时退出应用
});