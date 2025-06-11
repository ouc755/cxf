// 管理员登录路由，校验账号密码并返回 token
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../../server/models/User.js'; // 更正 User 模型的导入路径
import bcrypt from 'bcryptjs'; // 导入 bcryptjs

const router = express.Router();

// 登录接口
router.post('/login', async (req, res) => {
  console.log('【登录调试】收到 headers:', JSON.stringify(req.headers), '收到 req.body:', JSON.stringify(req.body));
  const { username, password } = req.body;
  console.log('接收到的用户名:', username); // 添加日志
  console.log('接收到的密码:', password); // 添加日志
  try {
    // 查找管理员（role: 'admin'）
    const user = await User.findOne({ username, role: { $in: ['admin', 'merchant'] } });
    if (!user) {
      return res.status(401).json({ message: '账号或密码错误' });
    }

    // 比较密码
    console.log('【登录调试】待比较的明文密码:', password);
    console.log('【登录调试】数据库中的哈希密码:', user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('【登录调试】密码比较结果 (isMatch):', isMatch);
    if (!isMatch) {
      return res.status(401).json({ message: '账号或密码错误' });
    }

    // 生成 token
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: '服务器未配置 JWT_SECRET' });
    }
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, userInfo: { username: user.username, role: user.role } });

  } catch (error) {
    console.error('【登录接口错误】:', error); // 打印完整的错误对象
    res.status(500).json({ message: '登录失败', error: error.message });
  }
});

export default router;