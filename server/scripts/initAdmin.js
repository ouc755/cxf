import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// 连接数据库
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/toyShop';
console.log('正在连接到数据库...');
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('数据库连接成功！');
}).catch(err => {
  console.error('数据库连接失败:', err);
});

async function createAdminUser() {
  try {
    // 删除现有的 root 用户（如果存在）
    const rootUser = await User.findOne({ username: 'root' });
    if (rootUser) {
      await User.deleteOne({ username: 'root' });
      console.log('已删除现有的 root 用户');
    }

    // 检查是否已存在 admin 账号
    const existingAdmin = await User.findOne({ username: 'admin' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin', salt); // 将 admin 密码哈希

    if (existingAdmin) {
      console.log('Admin 账号已存在，正在更新密码...');
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('Admin 账号密码更新成功');
    } else {
      console.log('Admin 账号不存在，正在创建...');
      const adminUser = new User({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com', // 为 admin 用户设置一个邮箱
        role: 'admin',
        isAdmin: true
      });
      await adminUser.save();
      console.log('Admin 账号创建成功');
    }
  } catch (error) {
    console.error('创建管理员账号失败:', error);
    console.error('创建管理员账号失败:', error);
  } finally {
    mongoose.disconnect();
  }
}

createAdminUser();