const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User').default;
const config = require('../config/config'); // 导入配置文件
const { authenticate } = require('../middleware/authenticate');

// 用户注册
router.post('/register', async (req, res) => {
  try {
    console.log('Registering new user:', req.body.username, 'Phone:', req.body.phone);
    const { username, password, email, phone } = req.body; // 添加 phone 到解构赋值

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('Username already exists:', username);
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.log('Email already exists:', email);
      return res.status(400).json({ message: '邮箱已被注册' });
    }

    // 检查手机号是否已存在 (暂时注释掉)
    /*
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      console.log('Phone already exists:', phone);
      return res.status(400).json({ message: '手机号已被注册' });
    }
    */

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建新用户
    const user = new User({
      username,
      password: hashedPassword,
      email,
      phone // 添加 phone 到新用户对象
    });

    await user.save();
    console.log('User registered successfully:', user._id);

    // 生成 JWT
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      config.jwtSecret, // 使用配置文件中的 jwtSecret
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone, // 在返回的用户信息中添加 phone
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: err.message });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  console.log('Login route handler reached.'); // 添加新的日志

  try {
    console.log('User login attempt:', req.body.username); // 修改日志记录为 username
    const { username, password } = req.body; // 修改为接收 username

    // 查找用户
    const user = await User.findOne({ username }); // 修改为使用 username 查找用户
    if (!user) {
      console.log('Login failed: User not found for username:', username); // 添加更详细的日志
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Invalid password for user:', username); // 添加更详细的日志
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    // 生成 JWT
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      config.jwtSecret, // 使用配置文件中的 jwtSecret
      { expiresIn: '24h' }
    );

    console.log('User logged in successfully:', user._id);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone, // 在返回的用户信息中添加 phone
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取用户信息
router.get('/profile', authenticate, async (req, res) => {
  try {
    console.log('Fetching user profile:', req.user.id);
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: '用户不存在' });
    }
    console.log('User profile found');
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: err.message });
  }
});

// 更新用户信息
router.put('/profile', authenticate, async (req, res) => {
  try {
    console.log('Updating user profile:', req.user.id);
    const { email, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: '用户不存在' });
    }

    // 如果要更新密码
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        console.log('Current password is incorrect');
        return res.status(400).json({ message: '当前密码错误' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // 更新邮箱
    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingEmail) {
        console.log('Email already exists:', email);
        return res.status(400).json({ message: '邮箱已被使用' });
      }
      user.email = email;
    }

    await user.save();
    console.log('User profile updated successfully');
    res.json({ message: '个人信息更新成功' });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ message: err.message });
  }
});

// 验证token有效性
router.get('/verify', authenticate, async (req, res) => {
  try {
    // authenticate 中间件已经将用户信息附加到 req.user
    // 我们只需要查找最新的用户信息（不包括密码）并返回
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json(user); // 返回用户信息
  } catch (err) {
    console.error('Error verifying token:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;