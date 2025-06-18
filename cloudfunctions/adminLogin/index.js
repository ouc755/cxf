// 云函数入口文件
const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

const db = cloud.database()
const adminsCollection = db.collection('adminUsers')
const loginAttemptsCollection = db.collection('loginAttempts')

// 配置参数
const CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5, // 最大登录尝试次数
  LOCK_TIME: 30 * 60 * 1000, // 锁定时间（30分钟）
  PASSWORD_SALT: 'your-salt-here' // 密码加盐
}

// 生成会话ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex')
}

// 验证登录参数
function validateLoginParams(username, password) {
  if (!username || !password) {
    throw new Error('用户名和密码不能为空')
  }

  if (username.length < 3 || password.length < 6) {
    throw new Error('用户名或密码格式不正确')
  }
}

// 记录登录尝试
async function recordLoginAttempt(username, success) {
  await loginAttemptsCollection.add({
    data: {
      username,
      success,
      createTime: db.serverDate(),
      ip: cloud.getWXContext().CLIENTIP || ''
    }
  })
}

// 验证管理员凭据
async function verifyAdminCredentials(username, password) {
  // 对密码进行加盐哈希
  const hashedPassword = crypto
    .createHash('sha256')
    .update(password + CONFIG.PASSWORD_SALT)
    .digest('hex')

  const adminResult = await adminsCollection.where({
    username,
    password: hashedPassword
  }).get()

  if (adminResult.data.length === 0) {
    throw new Error('用户名或密码错误')
  }

  return adminResult.data[0]
}

// 创建管理员会话
async function createAdminSession(adminId) {
  const sessionId = generateSessionId()
  const expireTime = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期

  await adminsCollection.doc(adminId).update({
    data: {
      lastLoginTime: db.serverDate(),
      sessionId,
      sessionExpireTime: expireTime
    }
  })

  return {
    sessionId,
    expireTime
  }
}

// 清理过期会话
async function cleanExpiredSessions(adminId) {
  await adminsCollection.doc(adminId).update({
    data: {
      sessionId: null,
      sessionExpireTime: null
    }
  })
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { username, password } = event
  const wxContext = cloud.getWXContext()
  
  try {
    // 验证参数
    validateLoginParams(username, password)

    // 检查登录尝试次数
    // await checkLoginAttempts(username)

    // 验证管理员凭据
    const admin = await verifyAdminCredentials(username, password)

    // 清理过期会话
    await cleanExpiredSessions(admin._id)

    // 创建新会话
    const { sessionId, expireTime } = await createAdminSession(admin._id)

    // 记录成功的登录尝试
    await recordLoginAttempt(username, true)

    return {
      success: true,
      data: {
        sessionId,
        expireTime,
        username: admin.username
      }
    }

  } catch (error) {
    // 记录失败的登录尝试
    if (username) {
      await recordLoginAttempt(username, false)
    }

    console.error('[管理员登录失败]', error)
    return {
      success: false,
      error: error.message || '登录失败，请重试'
    }
  }
} 