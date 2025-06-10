import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少需要3个字符'],
    maxlength: [20, '用户名不能超过20个字符']
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少需要6个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请提供有效的邮箱地址']
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    match: [/^1[3-9]\d{9}$/, '请提供有效的手机号码']
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'merchant'],
    default: 'user'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function(next) {
  if (this.isModified('username')) {
    this.username = this.username.trim();
  }
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    if (error.keyPattern.username) {
      next(new Error('用户名已被使用'));
    } else if (error.keyPattern.email) {
      next(new Error('邮箱已被注册'));
    } else {
      next(error);
    }
  } else {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);
export default User;