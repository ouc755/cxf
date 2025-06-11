// 初始化 toyShop 数据库管理员账号脚本，仅需运行一次
import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGO_URL = 'mongodb://localhost:27017/toyShop';

async function initUserAdmin() {
  await mongoose.connect(MONGO_URL);
  const exists = await User.findOne({ username: 'admin', role: 'admin' });
  if (!exists) {
    await User.create({ username: 'admin', password: '123456', email: 'admin@toyshop.com', role: 'admin', isAdmin: true });
    console.log('已创建默认管理员账号：admin / 123456');
  } else {
    console.log('管理员账号已存在，无需重复创建');
  }
  mongoose.disconnect();
}

initUserAdmin();